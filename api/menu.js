import fetch from "node-fetch";
import * as cheerio from "cheerio";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false // SSL sertifika hatalarını yok say
    });

    const response = await fetch("https://yemek.hacibayram.edu.tr", { agent });
    const html = await response.text();

    const $ = cheerio.load(html);

    const gun = $(".event-header p").first().text().trim();
    const yemekler = $(".event-list li")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    if (!yemekler.length) {
      throw new Error("Menü bulunamadı. Site yapısı değişmiş olabilir.");
    }

    const xml = `
<menu>
  <gun>${gun}</gun>
  <yemekler>
    ${yemekler.map((y) => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`.trim();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<error>${err.message}</error>`);
  }
}
