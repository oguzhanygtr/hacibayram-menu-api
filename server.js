// server.js
const express = require('express');
const fetch = require('node-fetch'); // node-fetch v2 (require ile)
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = "https://yemek.hacibayram.edu.tr/";

// Basit cache: 5 dakikada bir yenile
let cachedXml = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

async function fetchHtml(url) {
  const res = await fetch(url, {headers: { 'User-Agent': 'Mozilla/5.0' }});
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return await res.text();
}

function buildXmlFromItems(items) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<menu>\n';
  xml += `  <metadata>\n    <source>${TARGET_URL}</source>\n    <fetched_at>${new Date().toISOString()}</fetched_at>\n  </metadata>\n`;
  xml += '  <days>\n';

  // items: array of {date: "...", meals: ["a","b"...]} or if not grouped, fallback list
  if (Array.isArray(items) && items.length && items[0].date) {
    items.forEach(day => {
      xml += '    <day>\n';
      xml += `      <date>${escapeXml(day.date)}</date>\n`;
      xml += '      <meals>\n';
      day.meals.forEach(m => {
        const kcalMatch = m.match(/\((\d+)\s*Kcal\)/i);
        const kcal = kcalMatch ? kcalMatch[1] : '';
        const name = m.replace(/\(\d+\s*Kcal\)/i, '').trim();
        xml += '        <meal>\n';
        xml += `          <name>${escapeXml(name)}</name>\n`;
        if (kcal) xml += `          <kcal>${kcal}</kcal>\n`;
        xml += '        </meal>\n';
      });
      xml += '      </meals>\n';
      xml += '    </day>\n';
    });
  } else {
    // fallback: raw list
    items.forEach(it => {
      xml += `    <item>${escapeXml(it)}</item>\n`;
    });
  }

  xml += '  </days>\n';
  xml += '</menu>\n';
  return xml;
}

function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function parseMenu($) {
  // 1) Denemeler: yaygın seçicilerle bul
  const attempts = [
    'div.yemek-listesi',
    'div#icerik',
    'div#content',
    '.content',
    '.yemek-content',
    'table',
    '.menu',
    '#menu'
  ];

  // Try each selector; collect text
  for (const sel of attempts) {
    const el = $(sel).first();
    if (el && el.length) {
      const text = el.text().trim();
      if (text.length > 20) {
        return heuristicParse(text);
      }
    }
  }

  // 2) Eğer seçiciler bulmadıysa, daha geniş tarama: tüm <li> ve <p>
  const liTexts = $('li').map((i, el) => $(el).text().trim()).get().filter(Boolean);
  if (liTexts.length) return groupByDate(liTexts);

  const pTexts = $('p').map((i, el) => $(el).text().trim()).get().filter(Boolean);
  if (pTexts.length) return groupByDate(pTexts);

  // 3) fallback: tüm body text
  const bodyText = $('body').text().trim();
  if (bodyText.length) return heuristicParse(bodyText);

  return [];
}

function heuristicParse(text) {
  // Örnek sayfalarda tarih satırları "1 Ekim 2025, Çarşamba." gibi görünüyor.
  // Bu fonksiyon metni satırlara ayırır ve tarih bazlı gruplar oluşturur.
  const parts = text.split(/\n|;/).map(s => s.trim()).filter(Boolean);
  return groupByDate(parts);
}

function looksLikeDate(s) {
  // basit: içinde yıl veya gün adı/ay adı varsa
  return /\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4}/.test(s) || /Pazartesi|Salı|Çarşamba|Perşembe|Cuma|Cumartesi|Pazar/i.test(s);
}

function groupByDate(lines) {
  const days = [];
  let current = null;
  for (const line of lines) {
    if (looksLikeDate(line)) {
      if (current) days.push(current);
      current = { date: line, meals: [] };
    } else {
      if (!current) {
        // eğer henüz tarih yoksa başlangıçta unknown günü aç
        current = { date: "unknown", meals: [] };
      }
      // ignore very short noise
      if (line.length > 2) current.meals.push(line);
    }
  }
  if (current) days.push(current);
  return days;
}

app.get('/menu', async (req, res) => {
  try {
    // cache check
    if (cachedXml && (Date.now() - cacheTime) < CACHE_MS) {
      res.header('Content-Type', 'application/xml');
      return res.send(cachedXml);
    }

    const html = await fetchHtml(TARGET_URL);
    const $ = cheerio.load(html);

    const items = parseMenu($);
    const xml = buildXmlFromItems(items);

    // update cache
    cachedXml = xml;
    cacheTime = Date.now();

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error("Error in /menu:", err && err.message);
    res.status(500).send(`<error>${escapeXml(String(err && err.message))}</error>`);
  }
});

app.get('/', (req, res) => {
  res.send('Hacı Bayram Menü Proxy. Endpoint: /menu (returns XML)');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
