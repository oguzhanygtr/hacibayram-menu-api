import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

export async function getMenuData() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
    headless: true,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.goto("https://yemek.hacibayram.edu.tr", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  const data = await page.evaluate(() => {
    const gunEl = document.querySelector(".event-header p");
    const gun = gunEl ? gunEl.textContent.trim() : "";

    const yemekList = [];
    const lis = document.querySelectorAll("#list li");
    lis.forEach((li) => {
      const text = li.textContent.trim();
      if (text) yemekList.push(text);
    });

    return { gun, yemekList };
  });

  await browser.close();
  return data;
}
