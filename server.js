const express = require('express');
const puppeteer = require('puppeteer');
const { Builder } = require('xml2js');

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/yemekxml', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://yemek.hacıbayram.edu.tr', { waitUntil: 'networkidle2' });

    const yemekler = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#list > li'))
        .map(el => el.innerText.trim());
    });

    await browser.close();

    if (!yemekler.length) throw new Error('Menü elemanı bulunamadı');

    const builder = new Builder({ headless: true, rootName: 'YemekMenusu' });
    const xml = builder.buildObject({ Yemek: yemekler });

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Menü çekilemedi:', error.message);
    res.status(500).send('<error>Menü bilgisi alınamadı.</error>');
  }
});

app.listen(port, () => console.log(`Sunucu ${port} portunda çalışıyor.`));
