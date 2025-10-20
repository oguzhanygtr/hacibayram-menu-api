const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));  // public klasöründe HTML ve XML dosyaları bulunacak

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor.`);
});
