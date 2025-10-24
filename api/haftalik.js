import https from "https";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";
    const agent = new https.Agent({ rejectUnauthorized: false });

    let data;
    try {
      // 🌐 Uzaktan çek
      const response = await fetch(remoteUrl, { agent });
      data = await response.json();
    } catch {
      // 💾 Ulaşamazsa yerel menu.json'dan oku
      const filePath = path.join(process.cwd(), "public", "menu.json");
      const local = fs.readFileSync(filePath, "utf8");
      data = JSON.parse(local);
    }

    // 📅 Bugün ve sonraki 7 gün aralığı
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    // 📋 Haftalık filtre
    const haftalikMenu = data.filter((item) => {
      const tarih = new Date(item.menu_date);
      return tarih >= today && tarih <= next7;
    });

    // 🔤 Basit HTML çıktı (CSS yok)
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Haftalık Menü</title>
      </head>
      <body>
        <h2>Haftalık Menü (${today.toLocaleDateString("tr-TR")})<
