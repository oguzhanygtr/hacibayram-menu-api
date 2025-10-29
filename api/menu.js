// api/haftalik.js
import fs from "fs";
import path from "path";

function escapeXml(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req, res) {
  const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";
  let data = null;

  try {
    // 1) Uzak JSON çekmeyi dene
    try {
      const resp = await fetch(remoteUrl);
      if (resp.ok) {
        const text = await resp.text();
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length) {
            data = parsed;
            console.log("Uzak JSON yüklendi:", data.length);
          } else if (parsed && typeof parsed === "object") {
            // { data: [...] } ya da { menus: [...] } gibi durumlar
            const maybe =
              parsed.data ||
              parsed.menus ||
              parsed.menu ||
              parsed.items ||
              null;
            if (Array.isArray(maybe) && maybe.length) {
              data = maybe;
              console.log("Uzak JSON alt dizi bulundu:", data.length);
            }
          }
        } catch (err) {
          console.warn("Uzak JSON parse hatası:", err.message);
        }
      } else {
        console.warn("Uzak bağlantı başarısız:", resp.status);
      }
    } catch (fetchErr) {
      console.warn("Fetch hatası:", fetchErr.message);
    }

    // 2) Uzak başarısızsa yerel `data/menu.json` oku
    if (!Array.isArray(data)) {
      const filePath = path.join(process.cwd(), "data", "menu.json");
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const localData = JSON.parse(raw);
        if (Array.isArray(localData)) {
          data = localData;
          console.log("Yerel menu.json yüklendi:", data.length);
        } else {
          data = [];
          console.warn("Yerel menu.json dizi formatında değil.");
        }
      } catch (err) {
        console.error("Yerel menu.json okunamadı:", err.message);
        data = [];
      }
    }

    // 3) XML oluştur
    let xml;
    if (data.length) {
      const parts = data
        .map((m) => {
          const tarih = escapeXml(m.menu_date || m.date || "");
          const yemekler = Array.isArray(m.food_list)
            ? m.food_list
            : Array.isArray(m.yemekler)
            ? m.yemekler
            : [];
          const yemekXml = yemekler
            .map((y) => `      <yemek>${escapeXml(y)}</yemek>`)
            .join("\n");
          return `  <gun tarih="${tarih}">
    <yemekler>
${yemekXml || "      <yemek>Menü boş</yemek>"}
    </yemekler>
  </gun>`;
        })
        .join("\n");
      xml = `<menu>\n${parts}\n</menu>`;
    } else {
      xml = `<menu>
  <gun/>
  <yemekler>
    <yemek>Menü verisi bulunamadı.</yemek>
  </yemekler>
</menu>`;
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Genel hata:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
