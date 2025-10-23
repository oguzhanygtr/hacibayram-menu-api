import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    // menu.json dosyasını oku
    const filePath = path.join(process.cwd(), "data", "menu.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const menuData = JSON.parse(raw);

    // XML oluştur
    const xml = `<menu>
  ${menuData.map(gun => `
  <gun tarih="${gun.menu_date}">
    <yemekler>
      ${gun.food_list.map(y => `<yemek>${y}</yemek>`).join("\n      ")}
    </yemekler>
  </gun>`).join("")}
</menu>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
