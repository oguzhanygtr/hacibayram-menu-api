import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const url = "https://yemek.hacibayram.edu.tr/";

    // SSL doğrulamasını kapatan agent
    const agent = new https.Agent({  
      rejectUnauthorized: false  
    });

    const { data } = await axios.get(url, { httpsAgent: agent });

    const $ = cheerio.load(data);

    const gun = $("h4").first().text().trim();
    const yemekler = [];

    $("li").each((i, el) => {
      yemekler.push($(el).text().trim());
    });

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
