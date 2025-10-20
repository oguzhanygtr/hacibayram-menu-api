const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { Builder } = require('xml2js');

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/yemekxml', async (req, res) => {
  try {
    // Site HTML'sini çek
    const { data } = await axios.get('https://yemek.hacıbayram.edu.tr');

    // HTML'i yükle
    const $ = cheerio.load(data);

    // ul#list altındaki li elementlerini al
    const yemekler = [];
    $('#list > li').each((_, el) => {
      const yemek = $(el).text().trim();
      if(yemek) yemekler.push(yemek);
    });

    if(yemekler.length === 0) {
      throw new Error('Menü öğeleri bulunamadı');
    }

    // Menü öğelerini XML formatına dönüştür
    const builder = new Builder({ headless: true, rootName: 'YemekMenusu' });
    const xmlObj = { Yemek: yemekler };
    const xml = builder.buildObject(xmlObj);

    // XML yanıtı gönder
    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    // Hata logu ve kullanıcıya dönülüş
    console.error('Menü çekilemedi:', error.message);
    res.status(500).send('<error>Menü bilgisi alınamadı.</error>');
  }
});

app.listen(port, () => console.log(`Sunucu ${port} portunda çalışıyor.`));
