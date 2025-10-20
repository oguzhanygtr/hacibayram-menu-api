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
    const $ = cheerio.load(data);
    
    // Menü liste elemanlarını seç
    const yemekler = [];
    $('ul#list > li').each((i, el) => {
      const yemekAdi = $(el).text().trim();
      if (yemekAdi) {
        yemekler.push(yemekAdi);
      }
    });
    
    // Menü boşsa hata dön
    if (yemekler.length === 0) {
      throw new Error('Menü öğeleri bulunamadı');
    }
    
    // XML oluşturucu ile veriyi XML'e çevir
    const builder = new Builder({ headless: true, rootName: 'YemekMenusu' });
    const xmlObj = { Yemek: yemekler };
    const xml = builder.buildObject(xmlObj);
    
    // XML içerik tipini ayarla ve gönder
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    // Hata loglama ve kullanıcıya dönüş
    console.error('Yemek menüsü alınırken hata:', error.message);
    res.status(500).send('<error>Menü bilgisi alınamadı.</error>');
  }
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor.`);
});
