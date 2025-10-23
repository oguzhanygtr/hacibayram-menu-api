// api/menu.js
import fetch from "node-fetch";
import https from "https";

const BASE = "https://yemek.hacibayram.edu.tr";
const LOAD_MENU = `${BASE}/load-menu`;

// helper: format date variations
function formatDates(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return [
    `${mm}/${dd}/${yyyy}`, // MM/DD/YYYY (used in site examples)
    `${yyyy}-${mm}-${dd}`, // ISO
    `${dd}.${mm}.${yyyy}`, // DD.MM.YYYY
  ];
}

async function tryFetchJson(url, opts = {}) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const response = await fetch(url, { agent, ...opts, timeout: 20000 });
  const text = await response.text();
  // try JSON parse
  try {
    return { ok: true, json: JSON.parse(text), rawText: text };
  } catch {
    return { ok: false, json: null, rawText: text };
  }
}

function jsonToXml(data) {
  const gun = data?.gun ?? data?.date ?? "";
  const yemekler = Array.isArray(data?.yemekler) ? data.yemekler : Array.isArray(data) ? data : [];
  // normalize yemek entries (if items are strings or objects)
  const items = yemekler.map((it) => {
    if (!it) return "";
    if (typeof it === "string") return `<yemek>${it}</yemek>`;
    // common object shapes:
    const name = it.ad || it.name || it.title || it.yemek || "";
    const kcal = it.kalori || it.kcal || it.energy || "";
    return `<yemek>${name}${kcal ? ` (${kcal} Kcal)` : ""}</yemek>`;
  }).filter(Boolean);
  return `
<menu>
  <gun>${gun}</gun>
  <yemekler>
    ${items.join("\n    ")}
  </yemekler>
</menu>`.trim();
}

export default async function handler(req, res) {
  try {
    // 1) Try GET /load-menu
    let attempt = await tryFetchJson(LOAD_MENU, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
    if (attempt.ok && attempt.json) {
      // found JSON
      const xml = jsonToXml(attempt.json);
      if (xml.includes("<yemek>")) {
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(xml);
      }
    }

    // 2) Try POST /load-menu with common date formats (some sites expect date param)
    const dates = formatDates(new Date());
    for (const d of dates) {
      const postOpts = {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ date: d }),
      };
      attempt = await tryFetchJson(LOAD_MENU, postOpts);
      if (attempt.ok && attempt.json) {
        const xml = jsonToXml(attempt.json);
        if (xml.includes("<yemek>")) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.status(200).send(xml);
        }
      }
      // also try form-encoded post (some endpoints expect form fields)
      const formOpts = {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: `date=${encodeURIComponent(d)}`,
      };
      attempt = await tryFetchJson(LOAD_MENU, formOpts);
      if (attempt.ok && attempt.json) {
        const xml = jsonToXml(attempt.json);
        if (xml.includes("<yemek>")) {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.status(200).send(xml);
        }
      }
    }

    // 3) Try fetch homepage and search for embedded JSON in scripts
    const homepage = await tryFetchJson(BASE, { method: "GET", headers: { "User-Agent": "Mozilla/5.0" } });
    const html = homepage.rawText ?? "";
    // try to find a JSON blob inside scripts, e.g. window.__DATA__ = {...}
    const jsonBlobs = [];
    const scriptJsonRe = /<script[^>]*>[\s\S]*?(window\.[A-Za-z0-9_]*\s*=\s*)(\{[\s\S]*?\})[\s\S]*?<\/script>/gi;
    let m;
    while ((m = scriptJsonRe.exec(html))) {
      try {
        const parsed = JSON.parse(m[2]);
        jsonBlobs.push(parsed);
      } catch (e) {
        // ignore parse errors
      }
    }
    // also try any { ... } patterns inside scripts (lightweight)
    const genericJsonRe = /(\{(?:[^{}]|(?R))*\})/g;
    // (heavy but fallback) try to capture obvious JSON arrays with "yemek" or "kalori"
    const quickMatch = html.match(/(\{[\s\S]*?"yemek(?:ler|)"[\s\S]*?\})/i) || html.match(/(\{[\s\S]*?"kalori"[\s\S]*?\})/i);
    if (quickMatch) {
      try {
        const parsed = JSON.parse(quickMatch[1]);
        jsonBlobs.push(parsed);
      } catch {}
    }

    for (const blob of jsonBlobs) {
      // try to find yemekler inside blob
      const candidate = blob?.yemekler || blob?.data?.yemekler || blob?.menus || blob;
      if (candidate && (Array.isArray(candidate) && candidate.length)) {
        const xml = jsonToXml({ gun: blob.gun || blob.date || "", yemekler: candidate });
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(xml);
      }
    }

    // 4) Fallback: simple li regex from homepage HTML (may be empty because content is JS-rendered)
    const liRe = /<li[^>]*>(.*?)<\/li>/gi;
    const found = [];
    while ((m = liRe.exec(html)) !== null) {
      const txt = m[1].replace(/(<[^>]+>)/g, "").trim();
      if (txt) found.push(txt);
    }
    if (found.length) {
      const xml = `
<menu>
  <gun></gun>
  <yemekler>
    ${found.map(t => `<yemek>${t}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`.trim();
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      return res.status(200).send(xml);
    }

    // Nothing worked — return informative error XML
    const debug = {
      tried: ["GET /load-menu", "POST /load-menu (date variants)", "fetch homepage + embedded JSON", "li regex"],
      homepageLength: html.length,
      note: "Endpoint likely requires additional headers/cookies or is rendered client-side only. If you can inspect the Network/XHR request details (method, headers, payload) I can hardcode them here.",
    };
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.status(200).send(`
<menu>
  <gun/>
  <yemekler></yemekler>
  <debug>${escapeXml(JSON.stringify(debug))}</debug>
</menu>`.trim());

  } catch (err) {
    console.error("Unexpected error:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<error>${escapeXml(String(err.message || err))}</error>`);
  }
}

// small helper for safe XML embedding
function escapeXml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
