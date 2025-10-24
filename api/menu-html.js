import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "data", "menu.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const menuData = JSON.parse(raw);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const todayMenu = menuData.find((m) => m.menu_date === todayStr);

    let html;
    if (todayMenu) {
      html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Günün Menüsü - ${todayMenu.menu_date}</title>
<style>
  body {
    font-family: "Poppins", sans-serif;
    background: #f6f8fa;
    color: #333;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
  }
  h1 {
    margin-top: 40px;
    color: #444;
    font-weight: 600;
  }
  .card {
    background: #fff;
    padding: 24px;
    margin-top: 20px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    width: 90%;
    max-width: 400px;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  li:last-child {
    border-bottom: none;
  }
  footer {
    margin-top: auto;
    padding: 20px;
    font-size: 0.9rem;
    color: #888;
  }
</style>
</head>
<body>
  <h1>Günün Menüsü (${todayMenu.menu_date})</h1>
  <div class="card">
    <ul>
      ${todayMenu.food_list.map((y) => `<li>${y}</li>`).join("")}
    </ul>
  </div>
  <footer>© Ankara Hacı Bayram Veli Üniversi
