import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  let browser = null;

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
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const data = await page.evaluate(() => {
      const gun = document.querySelector(".event-header p")?.textContent.trim() || "";
      const yemekler = Array.from(document.querySelectorAll("#list li")).map((li) =>
        li.textContent.trim()
      );
      return { gun, yemekler };
    });

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
    res
      .status(500)
      .send(`<error>${error.message}</error>`);
  } finally {
    if (browser) await browser.close();
  }
}
