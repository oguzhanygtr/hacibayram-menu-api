import { getMenuData } from "./_shared.js";

export default async function handler(req, res) {
  try {
    const data = await getMenuData();
    const xml = `
<menu>
  <gun>${data.gun}</gun>
  <yemekler>
    ${data.yemekList.map((y) => `<yemek>${y}</yemek>`).join("\n    ")}
  </yemekler>
</menu>`.trim();

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send(`<error>${err.message}</error>`);
  }
}
