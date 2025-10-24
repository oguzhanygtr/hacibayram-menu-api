import fetch from "node-fetch";
import fs from "fs";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";
    let data;

    try {
      const response = await fetch(remoteUrl, { agent });
      data = await response.json();
    } catch {
      const local = fs.readFileSync("./public/menu.json", "utf8");
      data = JSON.parse(local);
    }

    if (!Array.isArray(data)) throw new Error("Veri geçersiz.");

    // Haftalık menü (bugünden 7 gün sonrası)
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const haftalikMenu = data.filter((m) => {
      const d = new Date(m.menu_date);
      return d >= today && d <= next7;
    });

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Haftalık Yemek Menüsü</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #fafafa;
      margin: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #2a4d69;
    }
    .menu-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .menu-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      padding: 20px;
      transition: transform 0.2s ease;
    }
    .menu-card:hover {
      transform: translateY(-5px);
    }
    .date {
      font-weight: bold;
      margin-bottom: 10px;
      color: #1d3557;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      background: #f1f1f1;
      margin-bottom: 5px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 15px;
    }
  </style>
</head>
<body>
  <h1>Haftalık Yemek Menüsü</h1>
  <div class="menu-container">
    ${
      haftalikMenu
        .map(
          (m) => `
      <div class="menu-card">
        <div class="date">${m.menu_date}</div>
        <ul>
          ${m.food_list.map((y) => `<li>${y}</li>`).join("")}
        </ul>
      </div>`
        )
        .join("")
    }
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).send("<h2>Menü yüklenemedi.</h2>");
  }
}
