import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const url = "https://yemek.hacibayram.edu.tr/load-menu";

    const response = await fetch(url, { agent });
    const data = await response.json().catch(() => null);

    if (!Array.isArray(data)) {
      throw new Error("Geçersiz veya boş JSON verisi alındı.");
    }

    // Bugünün tarihi ve haftalık aralık
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 6);

    // Haftalık menüleri filtrele
    const weeklyMenus = data.filter((item) => {
      const date = new Date(item.menu_date);
      return date >= today && date <= endOfWeek;
    });

    // XML çıktısı hazırla
    let xml;
    if (weeklyMenus.length > 0) {
      const menuList = weeklyMenus
        .map((m) => {
          const yemekler = Array.isArray(m.food_list)
            ? m.food_list.map((y) => `      <yemek>${y}</yemek>`).join("\n")
            : "      <yemek>Menü bulunamadı.</yemek>";

          return `  <gun tarih="${m.menu_date}">
    <yemekler>
${yemekler}
    </yemekler>
  </gun>`;
        })
        .join("\n");

      xml = `<menu>
${menuList}
</menu>`;
    } else {
      xml = `<menu>
  <gun/>
  <yemekler>
    <yemek>Bu haftaya ait menü bulunamadı.</yemek>
  </yemekler>
</menu>`;
    }

    // Yanıt
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("❌ Haftalık menü hatası:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<menu>
  <gun/>
  <yemekler></yemekler>
</menu>`);
  }
}
