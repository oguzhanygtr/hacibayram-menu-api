const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { create } = require('xmlbuilder2');
const https = require('https'); // SSL hatası için

const app = express();
const PORT = process.env.PORT || 3000;
const YEMEK_URL = 'https://yemek.hacibayram.edu.tr/';

// SSL/TLS doğrulamasını atlamak için (unable to verify the first certificate hatası için)
const agent = new https.Agent({  
  rejectUnauthorized: false
});

app.get('/menu.xml', async (req, res) => {
  try {
    // 1. Üniversitenin sitesinden HTML'i çek (SSL doğrulamasını atlayarak)
    const { data } = await axios.get(YEMEK_URL, { httpsAgent: agent });

    // 2. HTML'i Cheerio ile yükle
    const $ = cheerio.load(data);

    // 3. YENİ VE DOĞRU SEÇİCİLERİ KULLAN
    
    // Tarihi al (.event-header içindeki p etiketi)
    const tarih = $('.event-header p').first().text().trim();

    // Yemekleri al (ul id="list" içindeki li etiketleri)
    const menuItems = [];
    $('ul#list li').each((i, el) => {
      const itemText = $(el).text().trim();
      if (itemText) {
        menuItems.push(itemText);
      }
    });

    // Eğer menü bulunamadıysa hata fırlat (önemli)
    if (menuItems.length === 0) {
        throw new Error('Menü listesi (ul#list li) bulunamadı veya boş. HTML yapısı değişmiş olabilir.');
    }

    // 4. Veriyi XML formatına dönüştür
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('yemekMenusu');
    
    root.ele('tarih').txt(tarih || 'Tarih Bulunamadı'); // Tarih boşsa diye önlem
    const ogun = root.ele('ogun');
    
    menuItems.forEach(item => {
      ogun.ele('yemek').txt(item);
    });

    const xmlString = root.end({ prettyPrint: true });

    // 5. XML olarak sun
    res.type('application/xml');
    res.send(xmlString);

  } catch (error) {
    console.error(error); // Hata olursa logla
    res.status(500).type('application/xml').send('<error><mesaj>Menü alınamadı.</mesaj><detay>' + error.message + '</detay></error>');
  }
});

// Ana sayfa için basit bir mesaj
app.get('/', (req, res) => {
  res.send('Yemek Menüsü XML servisi. /menu.xml adresine gidin.');
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
