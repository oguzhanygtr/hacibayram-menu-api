import express from "express";
import puppeteer from "puppeteer";

const app = express();

// Menü verisini çekecek URL (örnek)
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

app.get("/menu.xml", async (req, res) => {
  res.set("Content-Type", "application/xml");

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(MENU_URL, { waitUntil: "networkidle2", timeout: 60000 });

    // Sayfadan menü elemanlarını çek
    const yemekListesi = await page.evaluate(() => {
      const gun = document.querySelector("h2")?.innerText?.trim() || "Günün Menüsü";
      const yemekler = Array.from(document.querySelectorAll("ul#list li"))
        .map(li => li.innerText.trim());
      return { gun, yemekler };
    });

    await browser.close();

    // XML formatında döndür
    const xml = `
<menu>
  <gun>${yemekListesi.gun}</gun>
  <yemekler>
    ${yemekListesi.yemekler.map(y => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>
    `.trim();

    res.send(xml);
  } catch (err) {
    const hata = `
<menu>
  <gun>Günün Menüsü</gun>
  <yemekler>
    <yemek>Sunucu hatası: ${err.message}</yemek>
  </yemekler>
</menu>
    `.trim();

    res.status(500).send(hata);
  }
});

// Vercel için export
export default app;

// Lokal test için (opsiyonel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✅ Local server running on http://localhost:${PORT}`));
}
