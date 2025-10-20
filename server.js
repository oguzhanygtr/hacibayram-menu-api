import express from "express";
<<<<<<< HEAD
import axios from "axios";
import * as cheerio from "cheerio";
=======
import puppeteer from "puppeteer";
>>>>>>> 252e2b5 (Update: Puppeteer tabanlı gerçek menü çekici eklendi)
import { create } from "xmlbuilder2";
import https from "https";

const app = express();
const PORT = process.env.PORT || 3000;
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

<<<<<<< HEAD
const agent = new https.Agent({ rejectUnauthorized: false }); // Render SSL doğrulama kapalı

app.get("/", (req, res) => {
  res.send(`
    <h2>🍽 Hacı Bayram Menü Proxy</h2>
    <p>Gerçek menüyü XML olarak görmek için <a href="/menu">/menu</a> endpoint’ini ziyaret edin.</p>
  `);
=======
// Menü URL'si (gerekirse burayı güncelle)
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

app.get("/", (req, res) => {
  res.send("Hacibayram Menü API çalışıyor ✅  /menu endpoint'ini ziyaret et.");
>>>>>>> 252e2b5 (Update: Puppeteer tabanlı gerçek menü çekici eklendi)
});

app.get("/menu", async (req, res) => {
  try {
<<<<<<< HEAD
    // Menü sayfasını çek
    const response = await axios.get(MENU_URL, { httpsAgent: agent });
    console.log(response.data);
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

=======
    const agent = new https.Agent({ rejectUnauthorized: false });

    // Puppeteer başlat
    const browser = await puppeteer.launch({
      headless: "new", // Render için uyumlu headless mod
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(MENU_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Sayfadan gün ve yemek listesini al
    const data = await page.evaluate(() => {
      const gun = document.querySelector(".event-header p")?.innerText || "Günün Menüsü";
      const yemekler = Array.from(document.querySelectorAll(".event-list ul li")).map(
        (li) => li.innerText.trim()
      );
      return { gun, yemekler };
    });

    await browser.close();

    // XML oluştur
    const xml = create({ version: "1.0", encoding: "UTF-8" })
      .ele("menu")
      .ele("gun")
      .txt(data.gun)
      .up()
      .ele("yemekler");

    if (data.yemekler.length > 0) {
      data.yemekler.forEach((yemek) => {
        xml.ele("yemek").txt(yemek).up();
      });
    } else {
      xml.ele("yemek").txt("Menü şu anda görüntülenemiyor.").up();
    }

    const xmlString = xml.end({ prettyPrint: true });
    res.type("application/xml").send(xmlString);
  } catch (error) {
    console.error("Hata:", error);
    res
      .status(500)
      .type("application/xml")
      .send(`<menu><gun>Günün Menüsü</gun><yemekler><yemek>Sunucu hatası: ${error.message}</yemek></yemekler></menu>`);
  }
});

app.listen(PORT, () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));
>>>>>>> 252e2b5 (Update: Puppeteer tabanlı gerçek menü çekici eklendi)
