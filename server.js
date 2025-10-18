// server.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import { create } from 'xmlbuilder2';
import cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;

// Ana sayfa endpoint
app.get('/', (req, res) => {
  res.send('Hacı Bayram Menü Proxy çalışıyor. Menü için /menu endpointini kullanın.');
});

// Menü endpoint
app.get('/menu', async (req, res) => {
  try {
    // SSL doğrulamasını kapatmak için httpsAgent oluştur
    const agent = new https.Agent({ rejectUnauthorized: false });

    // Menü sitesinden veri çek
    const response = await axios.get('https://yemek.hacibayram.edu.tr/', { httpsAgent: agent });

    // HTML verisini parse et
    const $ = cheerio.load(response.data);

    // Günlük menüyü çek
    const gun = $('h2').first().text().trim();
    const yemekler = [];
    $('table tbody tr').each((i, row) => {
      const yemek = $(row).find('td').eq(1).text().trim();
      if (yemek) yemekler.push(yemek);
    });

    // XML formatında menüyü oluştur
    const doc = create({ version: '1.0' })
      .ele('menu')
        .ele('gun').txt(gun).up()
        .ele('yemekler')
          .ele('yemek').txt(yemekler.join(', ')).up()
        .up()
      .up();

    // XML olarak gönder
    res.setHeader('Content-Type', 'application/xml');
    res.send(doc.end({ prettyPrint: true }));

  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
