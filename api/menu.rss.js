import { getMenuData } from "./_shared.js";

export default async function handler(req, res) {
  try {
    const data = await getMenuData();

    const rssItems = data.yemekList
      .map(
        (y) => `
      <item>
        <title>${y}</title>
        <description>${y}</description>
      </item>`
      )
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Hacı Bayram Veli Üniversitesi Günlük Yemek Menüsü</title>
  <link>https://yemek.hacibayram.edu.tr</link>
  <description>${data.gun}</description>
  ${rssItems}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.status(200).send(rss);
  } catch (err) {
    res
      .status(500)
      .send(`<error>RSS oluşturulamadı: ${err.message}</error>`);
  }
}
