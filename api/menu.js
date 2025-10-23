import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await fetch("https://yemek.hacibayram.edu.tr/load-menu", { agent });
    const data = await response.json().catch(() => ({}));

    const gun = data?.gun || "";
    const yemekler = Array.isArray(data?.yemekler) ? data.yemekler : [];

    const xml = `
<menu>
  <gun>${gun}</gun>
  <yemekler>
    ${yemekler.length > 0
      ? yemekler.map(y => `<yemek>${y.ad || ""} (${y.kalori || ""} Kcal)</yemek>`).join("\n    ")
      : ""}
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
