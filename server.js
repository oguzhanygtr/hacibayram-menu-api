import express from "express";
import puppeteer from "puppeteer";
import { create } from "xmlbuilder2";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🍽️ Hacıbayram Menü API Çalışıyor!");
});

app.get("/menu", async (req, res) => {
  try {
    // Puppeteer tarayıcısını başlat
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
      // 🔥 Önemli: Bundled Chromium'u kullan
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || (await puppeteer.executablePath())
    });

    const page = await browser.newPage();
    await page.goto("https://yemek.hacibayram.edu.tr/", {
      waitUntil: "domcontentloaded"
    });

    // HTML yapısına göre gün ve yemekleri çek
    const data = await page.evaluate(() => {
      const gun = document.querySelector(".event-header p")?.textContent?.trim() || "Günün Menüsü";
      const yemekler = Array.from(document.querySelectorAll(".event-info ul li")).map(li =>
        li.textContent.trim()
      );
      return { gun, yemekler };
    });

    await browser.close();

    // XML çıktısını oluştur
    const xml = create({ version: "1.0", encoding: "UTF-8" })
      .ele("menu")
      .ele("gun")
      .txt(data.gun)
      .up()
      .ele("yemekler");

    if (data.yemekler.length > 0) {
      data.yemekler.forEach(yemek => xml.ele("yemek").txt(yemek).up());
    } else {
      xml.ele("yemek").txt("Menü şu anda görüntülenemiyor.").up();
    }

    res.set("Content-Type", "application/xml");
    res.send(xml.end({ prettyPrint: true }));

  } catch (err) {
    console.error("❌ Hata:", err);
    const xml = create({ version: "1.0", encoding: "UTF-8" })
      .ele("menu")
      .ele("gun")
      .txt("Günün Menüsü")
      .up()
      .ele("yemekler")
      .ele("yemek")
      .txt(`Sunucu hatası: ${err.message}`)
      .up()
      .up();

    res.set("Content-Type", "application/xml");
    res.send(xml.end({ prettyPrint: true }));
  }
});

app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} üzerinde çalışıyor`));
