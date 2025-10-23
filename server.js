import puppeteer from "puppeteer";
import fs from "fs-extra";

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  console.log("🔗 Siteye gidiliyor...");
  await page.goto("https://yemek.hacibayram.edu.tr/", {
    waitUntil: "networkidle0",
    timeout: 60000
  });

  // Dinamik JS ile yüklenen yemekleri al
  const result = await page.evaluate(() => {
    const gunEl = document.querySelector(".calendar-active");
    const gun = gunEl ? gunEl.textContent.trim() : "";

    const yemekList = [];
    const lis = document.querySelectorAll("#list li");
    lis.forEach(li => {
      const text = li.textContent.trim();
      if (text) yemekList.push(text);
    });

    return { gun, yemekList };
  });

  await browser.close();

  if (!result.yemekList.length) {
    console.warn("⚠️ Yemek listesi bulunamadı. Site yapısı değişmiş olabilir.");
  }

  const xml = `
<menu>
  <gun>${result.gun}</gun>
  <yemekler>
    ${result.yemekList.map(y => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`;

  // XML dosyasına kaydet
  await fs.outputFile("menu.xml", xml.trim(), "utf8");

  console.log("✅ menu.xml dosyası oluşturuldu.");
}

run().catch(err => {
  console.error("❌ Hata oluştu:", err);
});
