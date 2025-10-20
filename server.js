import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { create } from "xmlbuilder2";
import https from "https";

const app = express();
const PORT = process.env.PORT || 3000;
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

const agent = new https.Agent({ rejectUnauthorized: false }); // SSL doğrulamasını kapat

app.get("/", (req, res) => {
  res.send("<h2>Hacı Bayram Menü Proxy Çalışıyor ✅<br/>/menu endpoint'ini deneyin.</h2>");
});

app.get("/menu", async (req, res) => {
  try {
    const response = await axios.get(MENU_URL, { httpsAgent: agent });
    const $ = cheerio.load(response.data);

    // Menü listesini yakala (örnek: <div class="menu"><ul><li>...</li></ul></div>)
    const gun = $("h2, .menuHeader, .menuTitle").first().text().trim() || "Günün Menüsü";

    const yemekler = [];
    $("ul li, .menu ul li").each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 0) yemekler.push(text);
    });

    // Eğer liste boşsa fallback döndür
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
    res.status(500).send("<error>Menü alınamadı</error>");
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
