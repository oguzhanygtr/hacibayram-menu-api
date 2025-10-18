import express from 'express';
import axios from 'axios';
import https from 'https';
import { create } from 'xmlbuilder2';
import { load } from 'cheerio';  // <- değiştirildi

const app = express();
const PORT = process.env.PORT || 3000;

// ... / ve /menu endpoint'leri aynı

app.get('/menu', async (req, res) => {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get('https://yemek.hacibayram.edu.tr/', { httpsAgent: agent });

    const $ = load(response.data);  // <- değiştirildi

    // HTML parsing
    const gun = $('h2').first().text().trim();
    const yemekler = [];
    $('table tbody tr').each((i, row) => {
      const yemek = $(row).find('td').eq(1).text().trim();
      if (yemek) yemekler.push(yemek);
    });

    const doc = create({ version: '1.0' })
      .ele('menu')
        .ele('gun').txt(gun).up()
        .ele('yemekler')
          .ele('yemek').txt(yemekler.join(', ')).up()
        .up()
      .up();

    res.setHeader('Content-Type', 'application/xml');
    res.send(doc.end({ prettyPrint: true }));

  } catch (err) {
    res.status(500).send('Hata: ' + err.message);
  }
});