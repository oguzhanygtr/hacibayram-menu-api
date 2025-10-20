const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { create } = require('xmlbuilder2');

const app = express();
const PORT = process.env.PORT || 3000; // OnRender portu otomatik atar

const YEMEK_URL = 'https://yemek.hacibayram.edu.tr/';

app.get('/menu.xml', async (req, res) => {
  try {
    // 1. Üniversitenin sitesinden HTML'i çek
    const { data } = await axios.get(YEMEK_URL);

    // 2. HTML'i Cheerio ile yükle
    const $ = cheerio.load(data);

    // 3. İlgili 'ul' ve 'li' etiketlerini bul
    // !!! UYARI: Bu seçiciler sitenin tasarımına bağlıdır ve değişebilir.
    // Sizin ifadenize göre (ul li) ilk bulduğu listeyi alacak şekilde ayarlandı.
    // Güncel site yapısında bu seçici 'p' etiketleri veya '.card-body p' gibi farklı olabilir.
    
    const menuItems = [];
    
    // Örnek olarak sitedeki ".card-body" içindeki ilk "ul" etiketini arayalım
    // Eğer doğrudan 'ul li' istiyorsanız: $('ul').first().find('li').each(...) kullanın
    // Güncel site yapısına göre (Ekim 2025 itibariyle) '.card-body p' daha doğru görünüyor.
    // Biz sizin talebinizdeki 'ul li' varsayımına sadık kalalım:
    const $menuList = $('ul').first(); // Sitedeki ilk 'ul' etiketini bul
    
    if ($menuList.length === 0) {
        throw new Error('Menü listesi (ul) bulunamadı. Sitenin HTML yapısı değişmiş olabilir.');
    }

    $menuList.find('li').each((i, el) => {
      const itemText = $(el).text().trim();
      if (itemText) {
        menuItems.push(itemText);
      }
    });

    // Günün tarihini de bulmaya çalışalım (Örnek: ilk 'h5' etiketi)
    const tarih = $('h5.card-title').first().text().trim() || 'Tarih Bulunamadı';

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