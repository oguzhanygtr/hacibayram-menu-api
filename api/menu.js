import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  let browser;

  try {
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto("https://yemek.hacibayram.edu.tr", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Menü bilgisini al
    const data = await page.evaluate(() => {
      const gun =
        document.querySelector(".event-header p")?.textContent.trim() || "";
      const yemekler = Array.from(
        document.querySelectorAll(".event-list li")
      )
        .map((el) => el.textContent.trim())
        .filter(Boolean);
      return { gun, yemekler };
    });

    if (!data.yemekler.length) {
      throw new Error("Menü bulunamadı. Site yapısı değişmiş olabilir.");
    }

    const xml = `
<menu>
  <gun>${data.gun}</gun>
  <yemekler>
    ${data.yemekler.map((y) => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`.trim();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Scraper hatası:", error);
    res.status(500).send(`<error>${error.message}</error>`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* boş */
      }
    }
  }
}
