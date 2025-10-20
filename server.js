const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/yemekxml', async (req, res) => {
  try {
    const { data } = await axios.get('https://yemek.hacıbayram.edu.tr');
    const $ = cheerio.load(data);
    const yemekler = [];
    $('ul#list > li').each((i, el) => {
      yemekler.push({ Yemek: $(el).text() });
    });
    const builder = new Builder();
    const xml = builder.buildObject({ YemekMenusu: { Yemek: yemekler.map(y => y.Yemek) } });

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Menü bilgisi alınamadı.');
  }
});

app.listen(port, () => console.log(`Sunucu ${port} portunda.`));
