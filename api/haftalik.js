export default async function handler(req, res) {
  const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";

  // Statik fallback (bugünden itibaren 7 gün)
  const today = new Date();
  const fallbackData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      menu_date: date.toISOString().split("T")[0],
      food_list: ["Çorba", "Ana Yemek", "Pilav", "Tatlı"],
    };
  });

  try {
    let data = fallbackData;
    try {
      const response = await fetch(remoteUrl);
      const text = await response.text();
      console.log("Gelen veri:", text.slice(0, 300)); // kontrol için ilk 300 karakter
      try {
        data = JSON.parse(text);
      } catch {
        console.warn("Veri JSON değil, fallback kullanılacak.");
      }
    } catch {
      console.warn("Siteye erişilemedi, fallback kullanılacak.");
    }

    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const haftalik = data.filter((item) => {
      const tarih = new Date(item.menu_date);
      return tarih >= today && tarih <= next7;
    });

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"><title>Haftalık Menü</title></head>
      <body>
        <h2>Haftalık Menü (${today.toLocaleDateString("tr-TR")})</h2>
        <ul>
          ${
            haftalik.length
              ? haftalik
                  .map(
                    (gun) => `
                    <li><strong>${gun.menu_date}</strong>
                      <ul>${gun.food_list
                        .map((y) => `<li>${y}</li>`)
                        .join("")}</ul>
                    </li>`
                  )
                  .join("")
              : "<li>Menü bulunamadı.</li>"
          }
        </ul>
      </bod
