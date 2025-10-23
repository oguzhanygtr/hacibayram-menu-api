import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // JSON verisini çek
    const response = await fetch("https://yemek.hacibayram.edu.tr/load-menu");
    const data = await response.json();

    // JSON'dan XML formatına dönüştür
    const xml = `
<menu>
  <gun>${data.gun}</gun>
  <yemekler>
    ${data.yemekler.map(y => `
      <yemek>
        <ad>${y.ad}</ad>
        <kalori>${y.kalori}</kalori>
      </yemek>
    `).join("\n    ")}
  </yemekler>
</menu>
`.trim();

    // XML'i döndür
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).send(`<error>${err.message}</error>`);
  }
}
