// server.js
import express from 'express';
import axios from 'axios';
import { create } from 'xmlbuilder2';

const app = express();
const PORT = process.env.PORT || 3000;

// Ana sayfa endpoint
app.get('/', (req, res) => {
  res.send('Hacı Bayram Menü Proxy çalışıyor. Menü için /menu endpointini kullanın.');
});

// Menü endpoint
app.get('/menu', async (req, res) => {
  try {
    // Hacı Bayram yemek sitesinden veri çek
    const response = await axios.get('https://yemek.hacibayram.edu.tr/');

    // Mevcut parsing fonksiyonunu kullan
    // (mevcut server.js kodundan alındığı gibi)
    const menuXml = parseMenuFromHTML(response.data);

    res.setHeader('Content-Type', 'application/xml');
    res.send(menuXml);

  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});

// --- Mevcut server.js’den parsing fonksiyonunu buraya al ---
// Örnek:
function parseMenuFromHTML(html) {
  // Buraya senin mevcut HTML parsing ve xmlbuilder2 kodun gelecek
  // Örneğin günleri ve yemekleri çekip XML oluşturuyor olmalı
  const doc = create({ version: '1.0' })
    .ele('menu')
      .ele('gun').txt('Pazartesi').up()
      .ele('yemek').txt('Mercimek Çorbası').up()
    .up();
  return doc.end({ prettyPrint: true });
}
