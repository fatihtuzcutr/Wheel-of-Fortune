# 🎡 Çarkıfelek Oyunu

Modern web teknolojileri ile geliştirilmiş, klasik televizyon yarışması formatında interaktif **Çarkıfelek** web oyunu.

---

## 🎮 Oyun Özellikleri

- **2 Kişilik Dinamik Rekabet:** Sen ve rastgele belirlenen yapay zeka rakip (Ahmet, Fatma, Burak, Ayşe, Mehmet vb.).
- **3 Tur + Final Turu:** 
  - 3 ana tur boyunca en çok puanı toplayan oyuncu finale yükselir.
  - Final turunda **R, L, N, E** harfleri otomatik açılır; 3 sessiz ve 1 sesli harf seçerek 15 saniyede bulmacayı çözüp büyük ödülü kazanmaya çalışırsın.
- **HTML5 Canvas Çark:** Gerçekçi dönme fiziği, sesli mandal tıklaması, puan dilimleri, **İflas** ve **Pas** bölümleri.
- **Zengin Kategori Havuzu:** Atasözleri, Deyimler, Şehirler, Spor, Sinema & Dizi vb. yüzlerce Türkçe bulmaca.
- **3 Zorluk Seviyesi:** Kolay, Normal ve Zor bot zeka seviyeleri.
- **Web Audio API Ses Efektleri:** Harf açılma (ding), çark çevirme, iflas, alkış ve süre sayacı sesleri (harici ses dosyası gerekmez, tarayıcıda sentezlenir).
- **Mobil ve Masaüstü Uyumlu (Responsive):** Yatay ve dikey ekran düzenlerine otomatik uyum sağlayan arayüz ve sanal klavye.

---

## 🕹️ Nasıl Oynanır?

1. **Çarkı Çevir:** Çarka tıkla veya **ÇEVİR** butonuna bas.
2. **Sessiz Harf Söyle:** Çarkın durduğu puana göre bulmacada olduğunu düşündüğün bir sessiz harf seç. Harf sayısı kadar puan kazanırsın.
3. **Sesli Harf Satın Al:** Yeterli puanın (200 puan) varsa **SESLİ AL** butonuna basarak sesli harf açtırabilirsin.
4. **Tahmin Et:** Bulmacanın tamamını çözdüysen **TAHMİN ET** butonuna basarak eksik harfleri doldur ve turu kazan!
5. **Dikkat Et:** 
   - Yanlış harf seçersen sıra rakibe geçer.
   - **PAS** gelirse sıranı kaybedersin.
   - **İFLAS** gelirse o turdaki tüm puanın sıfırlanır!

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5 & CSS3:** Responsive grid tahtası, modern animasyonlar ve neon efektler.
- **JavaScript (ES6+):** Modüler oyun mimarisi, yapay zeka bot karar algoritmaları.
- **HTML5 Canvas:** Vektörel çark çizimi ve fiziksel dönme simülasyonu.
- **Web Audio API:** Sentetik ses üretimi.
- **Vite:** Hızlı geliştirme ve derleme ortamı.

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

### 1. Projeyi İndirin
```bash
https://github.com/fatihtuzcutr/Wheel-of-Fortune.git
cd carkifelek
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:4173` (veya terminalde belirtilen port) adresine gidin.

### 4. Canlı Sürüm (Build) Üretme
```bash
npm run build
```
Derlenen dosyalar `dist/` klasörüne aktarılır ve herhangi bir statik sunucuda (GitHub Pages, Vercel, Netlify vb.) çalıştırılabilir.

---

## 📁 Proje Yapısı

```text
├── index.html          # Ana HTML yapısı ve tahta yerleşimi
├── package.json        # Bağımlılıklar ve npm script'leri
├── vite.config.js      # Vite yapılandırma dosyası
├── .gitignore          # Git hariç tutma kuralları
├── README.md           # Proje tanıtım ve kullanım kılavuzu
└── src/
    ├── main.js         # Uygulama giriş noktası
    ├── game.js         # Oyun motoru, bot mantığı, kurallar ve durum yönetimi
    ├── wheel.js        # Canvas çark çizimi ve dönme animasyonu
    ├── audio.js        # Web Audio API ses motoru
    ├── categories.js   # Kategori ve bulmaca veritabanı
    └── style.css       # Tasarım, tahta ızgarası ve responsive stiller
```

---

## 📄 Lisans

Bu proje açık kaynaklıdır ve [MIT Lisansı](LICENSE) kapsamında kullanılabilir.
