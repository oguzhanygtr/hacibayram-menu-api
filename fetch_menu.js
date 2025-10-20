const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { JSDOM } = require('jsdom');

async function fetchMenu() {
    const url = 'https://yemek.hacıbayram.edu.tr';

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const listItems = $('ul#list > li').map((i, el) => $(el).text()).get();

        console.log('Yemekler:', listItems);

        // Basit XML oluşturma
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<YemekMenusu>\n';
        listItems.forEach(item => {
            xml += `  <Yemek>${item}</Yemek>\n`;
        });
        xml += '</YemekMenusu>';

        fs.writeFileSync('yemek_menusu.xml', xml);
        console.log('yemek_menusu.xml dosyası oluşturuldu.');
    } catch (error) {
        console.error('Veri çekme sırasında hata:', error);
    }
}

fetchMenu();
