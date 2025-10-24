# 🍽️ Günlük Yemek Menüsü (HBVÜ XML/HTML API)

Bu proje, **Ankara Hacı Bayram Veli Üniversitesi** yemek listesini otomatik olarak XML ve HTML formatlarında sunar.  
Amaç; üniversite sitesindeki menüleri manuel olarak kopyalamak yerine, her gün güncel biçimde yayınlayan bir servis oluşturmaktır.

---

## 🚀 Özellikler

- 📅 Günlük menüleri **otomatik olarak JSON** dosyasından okur.  
- 🧩 `/menu` endpoint’i → XML çıktısı (uygulamalar için).  
- 💅 `/menu-html` endpoint’i → CSS ile tasarlanmış şık HTML görünümü.  
- ⏰ Bilgisayar tarihine göre **yalnızca bugünün menüsünü** gösterir.  
- ☁️ **Vercel** üzerinde barındırılabilir, Node.js ile çalışır.

---
## 📁 Klasör Yapısı
├── api/
│ ├── menu.js # XML çıktısı veren API endpoint
│ └── menu-html.js # CSS tasarımlı HTML çıktısı
├── data/
│ └── menu.json # Günlük menülerin JSON formatında verisi
├── vercel.json # Yönlendirmeler ve build ayarları
└── README.md
---
| 🗓️ Günlük Geliştirme Süreci |
| Tarih | Geliştirme Notu |
|-------|-----------------|
|  **17 Ekim 2025 **	| Proje oluşturuldu. Express.js tabanlı temel API yapısı kuruldu. |
|  **18 Ekim 2025 ** |	Puppeteer entegrasyonu yapıldı. Menü verileri HTML üzerinden test edildi. |
|  **19 Ekim 2025 ** |	XML formatı eklendi, hata yakalama ve düzenli çıktı sağlandı. |
|  **20 Ekim 2025 ** |	Render deploy tamamlandı, gerçek menü verisi çekildi. chrome-aws-lambda uyumu sağlandı. |
|  **21 Ekim 2025 ** |	Günlük menülerin güncellenmesi test edildi. Menü çekme hızı optimize edildi.
|  **22 Ekim 2025 ** |	README eklendi, proje yapısı temizlendi. |
|  **23 Ekim 2025 ** | Yayında otomatik XML çıktısı sağlandı, menüde eksik veri durumları için fallback metin eklendi. Proje Vercel deploy taşındı. |
|  **24 Ekim 2025 **	| Puppeteer sürüm hataları giderildi, stabil sürüm deploy edildi. |
---

## 🛠️ Teknolojiler

- **Node.js** (veri işleme ve API)
- **Vercel** (barındırma)
- **JSON / XML** dönüşümü
- **Basit CSS tasarımı**

---

## 📌 Gelecek Planları

- ✅ Menülerin web’den otomatik çekilmesi (scraper entegrasyonu)
- 🌙 Karanlık tema desteği (HTML sürümü)
- 🔁 Haftalık menü arşivleme sistemi
- 📱 Flutter / Kotlin uygulamalarıyla entegrasyon

---

## 👨‍💻 Geliştirici
**Oğuzhan Yiğiter**  
Proje geliştirme, API entegrasyonu ve otomasyon üzerine çalışıyor.

---
