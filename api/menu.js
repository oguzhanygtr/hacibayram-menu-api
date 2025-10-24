import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const url = "https://yemek.hacibayram.edu.tr/load-menu";

    const response = await fetch(url, { agent });
    const data = await response.json().catch(() => null);

    if (!data) {
      throw new Error("JSON verisi alınamadı.");
    }

    // Yapı örnek: data = [{ menu_date: "...", food_list: [...] }, ...]
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const todayMenu = Array.isArray(data)
      ? data.find((m) => m.menu_date === todayStr)
      : null;

    let xml;
    if (todayMenu && Array.isArray(todayMenu.food_list)) {
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
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
