import express from "express";
import puppeteer from "puppeteer";
import { create } from "xmlbuilder2";

const app = express();
const PORT = process.env.PORT || 3000;
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

app.get("/menu", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();
    await page.goto(MENU_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const gun = document.querySelector(".event-header p")?.innerText || "Günün Menüsü";
      const yemekler = Array.from(document.querySelectorAll(".event-list ul li")).map(li => li.innerText.trim());
      return { gun, yemekler };
    });

    await browser.close();

    const xml = create({ version: "1.0" })
      .ele("menu")
      .ele("gun").txt(data.gun).up()
      .ele("yemekler");

    if (data.yemekler.length > 0) {
      data.yemekler.forEach(y => xml.ele("yemek").txt(y).up());
    } else {
      xml.ele("yemek").txt("Menü şu anda görüntülenemiyor.").up();
    }

    res.type("application/xml").send(xml.end({ prettyPrint: true }));
  } catch (err) {
    console.error("❌ Hata:", err.message);
    res
      .status(500)
      .type("application/xml")
      .send(`<menu><gun>Günün Menüsü</gun><yemekler><yemek>Sunucu hatası: ${err.message}</yemek></yemekler></menu>`);
  }
});

app.listen(PORT, () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));