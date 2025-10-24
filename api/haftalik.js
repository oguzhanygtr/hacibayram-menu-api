export default async function handler(req, res) {
  const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";

  // 🧩 Yedek statik menü
  const fallbackData = [
    {
      menu_date: "2025-10-20",
      food_list: ["Mercimek Çorbası", "Tavuk Sote", "Pilav", "Ayran"],
    },
    {
      menu_date: "2025-10-21",
      food_list: ["Ezogelin", "Karnıyarık", "Bulgur Pilavı", "Tatlı"],
    },
  ];

  try {
    let data;

    try {
      const response = await fetch(remoteUrl);
      data = await response.json();
    } catch {
      data = fallbackData; // siteye ulaşılamazsa yedek
    }

    // 📅 Haftalık menü (bugün + 6 gün)
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const haftalik = data.filter((item) => {
      const tarih = new Date(item.menu_date);
      return tarih >= today && tarih <= next7;
    });

    // 🧾 Basit HTML çıktı
    const html = `
      <html lang="tr">
      <head><meta charset="utf-8"><title>Haftalık Menü</title></head>
      <body>
        <h2>Haftalık Menü (${today.toLocaleDateString("tr-TR")})</h2>
        <ul>
          ${haftalik
            .map(
              (gun) => `
                <li><strong>${gun.menu_date}</strong>
                  <ul>${gun.food_list.map((y) => `<li>${y}</li>`).join("")}</ul>
                </li>`
            )
            .join("")}
        </ul>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send("<h3>Menü yüklenemedi.</h3>");
  }
}
