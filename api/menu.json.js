import { getMenuData } from "./_shared.js";

export default async function handler(req, res) {
  try {
    const data = await getMenuData();
    res.status(200).json({
      tarih: data.gun,
      yemekler: data.yemekList,
    });
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
}
