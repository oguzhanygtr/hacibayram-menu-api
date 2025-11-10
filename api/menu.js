import fetch from "node-fetch";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const url = "https://yemek.hacibayram.edu.tr/load-menu";

    // Cache veya eski response'ları engelle
    const response = await fetch(url + `?t=${Date.now()}`, { agent, cache: "no-store" });

    // Text olarak al, sonra JSON parse et (bazı durumlarda response JSON header'sız geliyor)
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Uyarı: JSON parse edilemedi, ham veri döndürüldü.");
      data = [];
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Veri boş veya geçersiz formatta döndü.");
    }

    // Günün tarihini belirle
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Veriden bugünün menüsünü bul
    const todayMenu = data.find((m) => m.menu_date === todayStr);

    // XML formatı oluştur
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
      // Eğer Kasım’da veri var ama bugüne ait yoksa en yakın gelecekteki günü göster
      const futureMenu = data.find((m) => new Date(m.menu_date) > today);
      if (futureMenu) {
        xml = `<menu>
  <gun tarih="${futureMenu.menu_date}">
    <yemekler>
${futureMenu.food_list.map((y) => `      <yemek>${y}</yemek>`).join("\n")}
    </yemekler>
  </gun>
</menu>`;
      } else {
        xml = `<menu>
  <gun tarih="${todayStr}"/>
  <yemekler>
    <yemek>Bugün veya gelecek tarihler için menü bulunamadı.</yemek>
  </yemekler>
</menu>`;
      }
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Hata:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(500).send(`<menu>
  <gun/>
  <yemekler>
    <yemek>Sunucu hatası veya veri kaynağı geçici olarak kullanılamıyor.</yemek>
  </yemekler>
</menu>`);
  }
}
