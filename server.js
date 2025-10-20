const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { create } = require('xmlbuilder2');
const https = require('https'); // <-- BU SATIRI EKLEYİN

const app = express();
const PORT = process.env.PORT || 3000;
const YEMEK_URL = 'https://yemek.hacibayram.edu.tr/';

// SSL/TLS doğrulamasını atlamak için bir "agent" oluşturun
const agent = new https.Agent({  
  rejectUnauthorized: false
});

app.get('/menu.xml', async (req, res) => {
  try {
    // 1. Üniversitenin sitesinden HTML'i çek
    // İsteğe oluşturduğumuz agent'ı "httpsAgent" olarak ekleyin
    const { data } = await axios.get(YEMEK_URL, { httpsAgent: agent });

    // 2. HTML'i Cheerio ile yükle
    const $ = cheerio.load(data);

    // 3. İlgili 'ul' ve 'li' etiketlerini bul
    // (Önceki cevaptaki seçici uyarıları hala geçerlidir)
    const menuItems = [];
    
    // Sitenin güncel yapısına göre (p etiketleri kullanılıyor)
    // .card-body içindeki p'leri aramak daha doğru sonuç verebilir
    const $menuContainer = $('.card-body').first();
    const tarih = $menuContainer.find('h5.card-title').text().trim() || 'Tarih Bulunamadı';

    $menuContainer.find('p').each((i, el) => { // 'ul li' yerine 'p' etiketlerini arıyoruz
      const itemText = $(el).text().trim();
      if (itemText && itemText.length > 2) { // Boş paragrafları alma
        menuItems.push(itemText);
      }
    });

    // Eğer 'p' etiketleri çalışmazsa, sizin istediğiniz 'ul li' yöntemine dönün:
    if (menuItems.length === 0) {
        $('ul').first().find('li').each((i, el) => {
            const itemText = $(el).text().trim();
            if (itemText) {
                menuItems.push(itemText);
            }
        });
    }

    // 4. Veriyi XML formatına dönüştür
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('yemekMenusu');
    
    root.ele('tarih').txt(tarih);
    const ogun = root.ele('ogun');
    
    menuItems.forEach(item => {
      ogun.ele('yemek').txt(item);
    });

    const xmlString = root.end({ prettyPrint: true });

    // 5. XML olarak sun
    res.type('application/xml');
    res.send(xmlString);

  } catch (error) {
    console.error(error);
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
