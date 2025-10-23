import express from "express";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const app = express();
const PORT = process.env.PORT || 3000;
const MENU_URL = "https://yemek.hacibayram.edu.tr/";

app.get("/menu.xml", async (req, res) => {
  res.set("Content-Type", "application/xml");

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:
        process.env.CHROME_EXECUTABLE_PATH ||
        (await chromium.executablePath()),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(MENU_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const data = await page.evaluate(() => {
      const gun =
        document.querySelector("h2")?.innerText?.trim() || "Günün Menüsü";
      const yemekler = Array.from(document.querySelectorAll("ul#list li")).map(
        (li) => li.innerText.trim()
      );
      return { gun, yemekler };
    });

    await browser.close();

    const xml = `
<menu>
  <gun>${data.gun}</gun>
  <yemekler>
    ${data.yemekler.map((y) => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`.trim();

    res.send(xml);
  } catch (err) {
    res.status(500).send(`
<menu>
  <gun>Günün Menüsü</gun>
  <yemekler>
    <yemek>Sunucu hatası: ${err.message}</yemek>
  </yemekler>
</menu>`);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

export default app;
