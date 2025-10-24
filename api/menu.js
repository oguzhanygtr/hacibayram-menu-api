import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "data", "https://yemek.hacibayram.edu.tr/load-menu");
    const raw = fs.readFileSync(filePath, "utf8");
    const menuData = JSON.parse(raw);

    // Bilgisayar tarihini yyyy-mm-dd formatında al
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Bugünün menüsünü bul
    const todayMenu = menuData.find((m) => m.menu_date === todayStr);

    // XML formatında döndür
    let xml;
    if (todayMenu) {
      xml = `<menu>
  <gun tarih="${todayMenu.menu_date}">
    <yemekler>
${todayMenu.food_list.map((y) => `      <yemek>${y}</yemek>`).join("\n")}
    </yemekler>
  </gun>
</menu>`;
    } else {
      xml = `<menu>
  <gun tarih="${todayStr}"/>
  <yemekler>
    <yemek>Bugün için menü bulunamadı.</yemek>
  </yemekler>
</menu>`;
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
