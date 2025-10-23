import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const url = "https://yemek.hacibayram.edu.tr/";

    // SSL hatası için
    const agent = new https.Agent({ rejectUnauthorized: false });

    const { data } = await axios.get(url, { httpsAgent: agent });
    const $ = cheerio.load(data);

    // Gün tarihi
    const gun = $(".calendar-active").text().trim(); // aktif gün div'i

    // Yemek listesi
    const yemekler = [];
    $("#list li").each((i, el) => {
      yemekler.push($(el).text().trim());
    });

    // XML oluştur
    const xml = `
<menu>
  <gun>${gun}</gun>
  <yemekler>
    ${yemekler.map(y => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);

  } catch (error) {
    res.status(500).send(`<error>${error.message}</error>`);
  }
}
