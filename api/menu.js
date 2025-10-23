import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false // SSL sertifika hatalarını yok say
    });

    // JSON endpoint
    const response = await fetch("https://yemek.hacibayram.edu.tr/load-menu", { agent });
    const data = await response.json();

    // XML dönüşümü
    const xml = `
<menu>
  <gun>${data.gun}</gun>
  <yemekler>
    ${data.yemekler.map(y => `<yemek>${y.ad} (${y.kalori} Kcal)</yemek>`).join("\n    ")}
  </yemekler>
</menu>
`.trim();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).send(`<error>${err.message}</error>`);
  }
}
