// Modüller
import express from "express";
import axios from "axios";
import { create } from "xmlbuilder2";
import https from "https";
import * as cheerio from "cheerio";

// SSL doğrulama kapalı (Hacı Bayram sitesi sertifika hatası veriyor)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = process.env.PORT || 3000;

// Menü çekme fonksiyonu
async function fetchMenu() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const url = "https://yemek.hacibayram.edu.tr/";

    // Site HTML'sini al
    const response = await axios.get(url, { httpsAgent: agent });
    const html = response.data;

    // HTML'den menü verilerini çekmek için cheerio (jQuery benzeri)
    const $ = cheerio.load(html);

    // Menü listesi için veri alanlarını bul
    // (Site yapısı değişirse burayı düzenleyebilirsin)
    const days = [];
    $("div.day").each((i, el) => {
      const date = $(el).find("h3").text().trim();
      const meals = [];
      $(el)
        .find("li")
        .each((j, li) => {
          const meal = $(li).text().trim();
          if (meal) meals.push(meal);
        });
      if (date && meals.length > 0) {
        days.push({ date, meals });
      }
    });

    // Eğer sayfa farklı yapıya sahipse fallback
    if (days.length === 0) {
      const text = $("body").text().trim().slice(0, 300);
      days.push({
        date: "Veri formatı değişmiş olabilir",
        meals: [text],
      });
    }

    // XML oluştur
    const xmlObj = create({ version: "1.0", encoding: "UTF-8" })
      .ele("menu", { source: url });

    days.forEach((day) => {
      const dayNode = xmlObj.ele("day");
      dayNode.ele("date").txt(day.date);
      const mealsNode = dayNode.ele("meals");
      day.meals.forEach((m) => mealsNode.ele("item").txt(m));
      dayNode.up();
    });

    const xml = xmlObj.end({ prettyPrint: true });
    return xml;
  } catch (error) {
    console.error("Fetch Error:", error.message);

    // Hata XML çıktısı
    const xmlError = create({ version: "1.0" })
      .ele("menu")
      .ele("error")
      .txt(error.message)
      .up()
      .end({ prettyPrint: true });

    return xmlError;
  }
}

// Endpoint: /menu → XML döndürür
app.get("/menu", async (req, res) => {
  const xml = await fetchMenu();
  res.set("Content-Type", "application/xml");
  res.send(xml);
});

// Sunucu başlat
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`➡️  Endpoint ready: http://localhost:${PORT}/menu`);
});
