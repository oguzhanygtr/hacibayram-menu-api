import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const url = "https://yemek.hacibayram.edu.tr/load-menu";

    // Cache'i engelle
    const response = await fetch(url + `?t=${Date.now()}`, { agent, cache: "no-store" });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("JSON parse hatası, ham veri:");
      console.error(raw.slice(0, 500));
      data = [];
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Veri boş veya geçersiz formatta döndü.");
    }

    // Tüm günleri XML formatında sırala
    const xmlItems = data
      .map((menu) => {
        const yemekler =
          Array.isArray(menu.food_list) && menu.food_list.length > 0
            ? menu.food_list.map((y) => `      <yemek>${y}</yemek>`).join("\n")
            : "      <yemek>Veri bulunamadı</yemek>";

        return `  <gun tarih="${menu.menu_date}">
    <yemekler>
${yemekler}
    </yemekler>
  </gun>`;
      })
      .join("\n");

    const xml = `<menu>\n${xmlItems}\n</menu>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Hata:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<menu>
  <gun/>
  <yemekler>
    <yemek>Sunucu hatası veya veri kaynağına erişilemedi.</yemek>
  </yemekler>
</menu>`);
  }
}
