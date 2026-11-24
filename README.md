# Voice Chat · CRM Concept

Implementasi web dari screen "Voice Chat" yang didesain di Figma: asisten suara untuk seller online
UMKM Indonesia yang berjualan di Shopee dan TikTok Shop sekaligus. Data demo memakai toko fiktif
**Nara Wear** (hoodie, kaos, hijab).
Dibangun dengan React + Vite, tanpa library UI tambahan. Semua ikon berupa SVG inline dan
orb gradien dibuat murni dengan CSS.

## Fitur interaktif

**Voice chat sungguhan** (Web Speech API bawaan browser, tanpa API key):

- Tap mic untuk mulai: browser meminta izin mikrofon, assistant membacakan briefing toko sesuai tab, lalu mendengarkan
- Bahasa percakapan: English atau Bahasa Indonesia (Assistant settings, "Language"). Pilihan ini mengatur pengenalan suara (`en-US` / `id-ID`), suara assistant, briefing, dan caption. UI tetap bahasa Inggris. Bahasa bisa diganti di tengah call: mic langsung mendengar bahasa baru, assistant mengonfirmasi singkat lalu mengulang pertanyaan yang menunggu dalam bahasa baru
- Pengenalan suara real-time: ucapanmu tampil sebagai caption ("You"), lalu dijawab dan diucapkan ("Assistant") dengan teks tersorot kata per kata
- Orb bereaksi pada suara: membesar dan menyala sesuai volume mic saat kamu bicara, berdenyut mengikuti ritme saat assistant bicara, bergerak pelan saat berpikir
- AI Mode mengubah gaya jawaban: Brief answers (ringkas), Think it through (menimbang opsi lalu bertanya balik), Guide me (langkah demi langkah), Listen only (diam dan mencatat)
- Assistant proaktif: setiap jawaban ditutup rekomendasi dan tawaran bantuan ("Want me to get shipping labels ready for the 4 orders due by 2 PM?"). Jawab ya atau tidak, lalu ia menindaklanjuti dan menawarkan hal penting berikutnya
- Lima skenario toko: pesanan mendesak (label pengiriman), chat soal ukuran (balas pakai size chart), stok menipis (sinkron stok di dua toko), komplain warna (tawarkan tukar, lalu label retur), dan rekap penjualan kemarin (informasi saja)
- Ask Me First: aksi internal (label, sinkron stok) mengikuti toggle ini. Aksi yang terlihat pembeli (membalas chat, menawarkan tukar) **selalu** minta persetujuan, apa pun posisi toggle
- Mute/unmute, akhiri sesi, mulai ulang, timer sesi, dan ucapan seperti "goodbye" juga mengakhiri sesi
- Ringkasan sesi saat selesai: durasi, Actions taken, Still waiting (yang belum ditangani lewat aksi), Check tomorrow, transkrip, salin, unduh, dan rating
- Toast beranimasi di atas area konten (titik turun lalu mekar menjadi pill). Aksi assistant bisa dibatalkan lewat tombol Undo atau dengan mengucapkan "undo that" / "batalin"

Contoh yang bisa diucapkan:

- **English:** "What orders are due today?", "Any unanswered chats?", "How's the black hoodie stock?", "Tell me about the complaint", "How were sales yesterday?", "Reply to the size questions", "Sync the stock", "Offer an exchange", "Undo that", "Goodbye". Saat ditawari bantuan: "yes", "sure", "not now".
- **Bahasa Indonesia:** "Pesanan hari ini gimana?", "Ada chat apa aja?", "Gimana stok hoodie?", "Ada komplain?", "Rekap omzet kemarin dong", "Balas chat yang nanya ukuran", "Samakan stok", "Tawarkan tukar ke pembeli", "Batalin", "Udah dulu". Saat ditawari bantuan: "iya", "gas", "gaskeun", "oke gas", "ya kerjakan", "kerjain aja", "langsung aja", "boleh", "sip", "yaudah", "gak papa", atau menolak dengan "nanti aja", "nggak usah", "ya nggak usah", "jangan dulu", "lain kali". Penolakan dicek lebih dulu, jadi "iya, nanti aja" dianggap menolak. Kalau ucapan pendek salah dengar, assistant memeriksa beberapa kemungkinan hasil dengar dari browser sebelum menyerah.

**Mode Chat** (switch Chat | Voice di kiri baris tab, atau di tengah header di HP):

- Ketik pertanyaan atau perintah yang sama dengan yang diucapkan. Jawabannya dari "otak" yang sama, aksi tampil di Live actions dan bisa di-undo
- Jawaban dipisah jadi dua paragraf: yang sudah dikerjakan, lalu tawaran berikutnya dengan chip jawaban ("Create labels" / "Not now") di bawahnya
- Satu percakapan untuk dua mode: transkrip call masuk ke chat sebagai bubble, dan yang sudah dikerjakan tetap diingat
- Jawaban assistant ditulis kata demi kata setelah titik "mengetik". Saat call berjalan, bubble jawaban mengikuti suara yang sedang diucapkan
- Pindah ke Voice setelah mengobrol di chat: layar Voice menampilkan pertanyaan terakhir ("Continuing from chat"), dan call dibuka dengan "Picking up from chat." tanpa membacakan briefing ulang
- Call tetap berjalan saat pindah ke Chat. Penanda call di atas percakapan menampilkan durasi dan status, dengan tombol Mute dan End. Pesan yang diketik saat call dijawab dengan suara juga
- Ganti tab saat chat: percakapan diberi pemisah nama tab dan briefing singkat tab itu. Kalau user pindah tab lagi sebelum menjawab apa pun, briefing sebelumnya diganti, jadi teksnya tidak menumpuk
- Di HP, aksi tampil langsung di percakapan: langkahnya dicentang satu per satu, lalu menyusut jadi satu baris yang bisa diketuk untuk melihat detail, Open, dan Undo

**UI lainnya:**


- Live actions: panel kanan pindah ke tab Actions saat sesi dimulai. Setiap aksi tampil langkah demi langkah, tawaran yang menunggu jawaban muncul sebagai kartu "Needs your OK" (bisa dijawab lewat suara atau tombol), dan hasilnya bisa di-undo. Toast hasil aksi (dengan Undo) selalu muncul. Pertanyaan yang menunggu jawaban tampil sebagai toast yang tetap ada sampai dijawab (kecuali feed Actions sedang terlihat, karena tombolnya sudah ada di sana), dan muncul lagi setelah toast lain selesai
- Tab konteks (Everything / Orders / Chats / Stock) mengganti briefing pembuka dan tawaran pertama. Kalau diganti di tengah call, assistant langsung membacakan briefing tab baru
- Custom context (tombol "+"): pilih fokus (Orders, Chats, Stock, Complaints, Sales), toko, dan produk, atau mulai dari template. Pratinjau menunjukkan kalimat pembuka assistant. Maksimal 3, tersimpan di browser. Klik tab custom yang aktif untuk mengedit atau menghapus
- Semua tab bisa di-drag untuk mengubah urutan (di HP: tekan lama). Tab custom bisa dilepas di zona merah di bawah layar untuk dihapus, lalu dikembalikan lewat Undo
- Toggle Live Captions (menyembunyikan caption) dan Ask Me First
- Search di menu kiri memfilter item navigasi
- Assistant settings: Language, AI Mode, dan Ask Me First berlaku untuk kedua mode. Listen only, Live Captions, dan pratinjau suara hanya tampil di mode Voice atau saat call berjalan
- Responsif: di tablet Assistant settings ditumpuk di bawah kartu dan sidebar jadi drawer. Drawer dibuka di panel AI; tombol "‹ AI" membuka menu utama (Home, Orders, Products, dan seterusnya) sebagai pengganti icon rail. Di mobile voice chat tampil layar penuh dengan caption 3 baris yang bergulir sendiri, dan Assistant settings serta Live actions dibuka sebagai bottom sheet (ikon gear atau ketuk toast persetujuan)

## Catatan teknis voice

- "Otak" jawabannya berbasis aturan dengan data toko contoh dalam dua bahasa (`src/voice/brain.js`), bukan model AI. Konten percakapan (briefing, pertanyaan, jawaban, topik) punya versi EN dan ID; judul langkah di feed dan toast persetujuan tetap bahasa Inggris karena bagian dari UI. Mau pakai AI sungguhan? Ganti fungsi `respond()` agar memanggil backend (jangan taruh API key di kode frontend).
- Butuh browser dengan `SpeechRecognition`: Chrome, Edge, Safari. Firefox belum didukung (akan muncul pesan).
- Butuh HTTPS atau localhost agar mic bisa dipakai.
- Privasi: pada Chrome dan Edge, audio untuk pengenalan suara diproses oleh layanan speech milik browser (server Google, Microsoft, atau Apple tergantung browser), bukan oleh proyek ini. Tidak ada audio atau teks yang dikirim ke server lain dan tidak ada yang disimpan.
- Suara balasan memakai `speechSynthesis`; suara yang terdengar bergantung pada voice yang terpasang di perangkat. Untuk Bahasa Indonesia urutan pilihannya: voice neural ("Natural"/"Online", misalnya Microsoft Gadis di Edge), versi Enhanced/Premium, Google Bahasa Indonesia (Chrome), lalu Damayanti. Kalau tidak ada, browser memakai suara bawaannya untuk `id-ID`. Di Mac, Damayanti versi Enhanced bisa diunduh lewat System Settings > Accessibility > Spoken Content > System Voice > Manage Voices.
- Kata serapan dan merek dieja ulang khusus untuk suara Indonesia ("Shopee" diucapkan "Syopi", "hoodie" jadi "hudi", "size chart" jadi "saiz cart"), daftarnya ada di `SAY_AS_ID` di `src/voice/speech.js`. Caption tetap menampilkan ejaan asli dan sorotan kata tetap pas.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Build produksi

```bash
npm run build
```

Hasilnya ada di folder `dist/` sebagai situs statis murni (sudah memakai path relatif),
jadi bisa di-host di mana saja.

## Cara publish

Pilih salah satu:

1. **Netlify Drop** (paling cepat, tanpa akun git): buka https://app.netlify.com/drop
   lalu seret folder `dist/` ke halamannya.
2. **Vercel**: `npx vercel` dari folder proyek ini, atau hubungkan repo GitHub-nya
   di dashboard Vercel (framework preset: Vite).
3. **GitHub Pages**: buat repo baru, push proyek ini, lalu aktifkan Pages dengan
   GitHub Actions (workflow "Deploy static content") yang mem-build `npm run build`
   dan mempublish folder `dist/`.

## Struktur

```
src/
  main.jsx                 # entry point
  App.jsx                  # state utama + layout + drawer + toast
  styles.css               # seluruh styling (design tokens di :root)
  icons.jsx                # kumpulan ikon SVG
  voice/
    useVoiceChat.js        # mesin status voice chat (mic, recognition, speaking)
    speech.js              # pembungkus Web Speech API + meter volume mic
    brain.js               # jawaban demo berbasis aturan (EN + ID) + data toko Nara Wear
  components/
    NavSide.jsx            # icon rail kiri, panel navigasi AI, menu utama di drawer
    VoiceCard.jsx          # kartu sesi voice chat (orb, caption, kontrol)
    ChatCard.jsx           # mode Chat: percakapan bersama, chip jawaban, kolom ketik, penanda call, kartu aksi lipat
    Orb.jsx                # orb kaca yang mengikuti level suara
    SettingsPanel.jsx      # panel Assistant settings (Language + AI Mode + Quick Settings)
    SessionSummary.jsx     # ringkasan sesi setelah voice chat selesai
    Toast.jsx              # toast beranimasi (satu pill, dengan Undo)
    BottomSheet.jsx        # bottom sheet untuk panel kanan di mobile
    SidePanel.jsx          # panel kanan bertab: Settings | Actions
    ActionFeed.jsx         # Live actions: aksi assistant langkah demi langkah
    ContextTabs.jsx        # deretan tab context: drag urutan, zona hapus, popover editor
    ContextEditor.jsx      # form custom context (template, fokus, toko, produk, pratinjau)
```
