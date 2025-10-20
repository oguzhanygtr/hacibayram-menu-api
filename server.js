import express from "express";
import puppeteer from "puppeteer";
import { create } from "xmlbuilder2";

const app = express();
const PORT = process.env.PORT || 10000;
const TARGET_URL = "https://yemek.hacibayram.edu.tr/";

app.get("/menu", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    const menuItems = await page.evaluate(() => {
      const list = document.querySelectorAll("ul#list li");
      return Array.from(list).map(li => li.textContent.trim());
    });

    await browser.close();

    let root;
    if (menuItems.length > 0) {
      root = create({ version: "1.0" })
        .ele("menu")
        .ele("gun").txt("Günün Menüsü").up()
        .ele("yemekler");

      for (const yemek of menuItems) {
        root.ele("yemek").txt(yemek).up();
      }

      root = root.end({ prettyPrint: true });
    } else {
      root = create({ version: "1.0" })
        .ele("menu")
        .ele("gun").txt("Günün Menüsü").up()
        .ele("yemekler")
        .ele("yemek").txt("Menü şu anda görüntülenemiyor.").up()
        .end({ prettyPrint: true });
    }

    res.type("application/xml").send(root);
  } catch (err) {
    console.error("❌ Hata:", err.message);
    const xmlError = create({ version: "1.0" })
      .ele("menu")
      .ele("gun").txt("Günün Menüsü").up()
      .ele("yemekler")
      .ele("yemek").txt(`Sunucu hatası: ${err.message}`).up()
      .end({ prettyPrint: true });
    res.type("application/xml").send(xmlError);
  }
});

app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));
