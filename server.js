import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  let browser;
  try {
    // Chromium başlat
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Siteye git
    await page.goto("https://yemek.hacibayram.edu.tr/", {
      waitUntil: "networkidle0",
    });

    // Sayfadaki yemekleri çek
    const result = await page.evaluate(() => {
      const gunEl = document.querySelector(".calendar-active");
      const gun = gunEl ? gunEl.textContent.trim() : "";

      const yemekList = [];
      const lis = document.querySelectorAll("#list li");
      lis.forEach(li => yemekList.push(li.textContent.trim()));

      return { gun, yemekList };
    });

    // XML oluştur
    const xml = `
<menu>
  <gun>${result.gun}</gun>
  <yemekler>
    ${result.yemekList.map(y => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send(`<error>${err.message}</error>`);
  } finally {
    if (browser) await browser.close();
  }
}
