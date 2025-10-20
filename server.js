import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { create } from "xmlbuilder2";
import https from "https";

const app = express();
const PORT = process.env.PORT || 3000;
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

const agent = new https.Agent({ rejectUnauthorized: false }); // Render SSL doğrulama kapalı

app.get("/", (req, res) => {
  res.send(`
    <h2>🍽 Hacı Bayram Menü Proxy</h2>
    <p>Gerçek menüyü XML olarak görmek için <a href="/menu">/menu</a> endpoint’ini ziyaret edin.</p>
  `);
});

app.get("/menu", async (req, res) => {
  try {
    // Menü sayfasını çek
    const response = await axios.get(MENU_URL, { httpsAgent: agent });
    const $ = cheerio.load(response.data);

    // Gün bilgisini bul
    const gun = $(".calendar-events .event-header p").first().text().trim() || "Günün Menüsü";

    // Menüdeki yemekleri al
    const yemekler = [];
    $(".calendar-events ul#list li").each((i, el) => {
      const yemek = $(el).text().trim();
      if (yemek) yemekler.push(yemek);
    });

    // Eğer hiç yemek yoksa bilgi mesajı ver
    if (yemekler.length === 0) {
      yemekler.push("Menü şu anda görüntülenemiyor.");
    }

    // XML oluştur
    const xml = create({ version: "1.0" })
      .ele("menu")
      .ele("gun").txt(gun).up()
      .ele("yemekler");

    yemekler.forEach((y) => xml.ele("yemek").txt(y).up());
    const xmlOutput = xml.end({ prettyPrint: true });

    res.type("application/xml");
    res.send(xmlOutput);

  } catch (error) {
    console.error("Hata:", error.message);
    res.status(500).send(`<error>Menü alınamadı: ${error.message}</error>`);
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
