import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://yemek.hacibayram.edu.tr/", { waitUntil: "networkidle0" });

    const result = await page.evaluate(() => {
      const gunEl = document.querySelector(".calendar-active");
      const gun = gunEl ? gunEl.textContent.trim() : "";

      const yemekList = [];
      const lis = document.querySelectorAll("#list li");
      lis.forEach(li => yemekList.push(li.textContent.trim()));

      return { gun, yemekList };
    });

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
    res.status(500).send(`<error>${err.message}</error>`);
  } finally {
    if (browser) await browser.close();
  }
}
