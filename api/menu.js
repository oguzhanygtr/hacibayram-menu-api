import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "data", "menu.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const menu = JSON.parse(raw);

    const xml = `<menu>
  <gun>${menu.gun}</gun>
  <yemekler>
    ${menu.yemekler.map(y => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
