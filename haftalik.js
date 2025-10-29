import fetch from "node-fetch";
import fs from "fs";
import https from "https";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const remoteUrl = "https://yemek.hacibayram.edu.tr/load-menu";
    let data;

    // Uzaktan veri çek, hata olursa yerel menu.json'dan oku
    try {
      const response = await fetch(remoteUrl, { agent });
      data = await response.json();
    } catch {
      const local = fs.readFileSync("./data/menu.json", "utf8");
      data = JSON.parse(local);
    }

    if (!Array.isArray(data)) throw new Error("Veri geçersiz.");

    // Haftalık filtre (bugünden +7 güne kadar)
    const today = new Date();
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    const haftalikMenu = data.filter((m) => {
      const d = new Date(m.menu_date);
      return d >= today && d <= n
