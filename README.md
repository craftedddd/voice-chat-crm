# Voice Chat · CRM Concept

Implementasi web dari screen "Voice Chat" (AI voice assistant untuk CRM) yang didesain di Figma.
Dibangun dengan React + Vite, tanpa library UI tambahan. Semua ikon berupa SVG inline dan
orb gradien dibuat murni dengan CSS.

## Fitur interaktif

**Voice chat sungguhan** (Web Speech API bawaan browser, tanpa API key):

- Tap mic untuk mulai: browser meminta izin mikrofon, assistant membacakan briefing sesuai tab, lalu mendengarkan
- Pengenalan suara real-time: ucapanmu tampil sebagai caption ("You"), lalu dijawab dan diucapkan ("Assistant") dengan teks tersorot kata per kata
- Orb bereaksi pada suara: membesar dan menyala sesuai volume mic saat kamu bicara, berdenyut mengikuti ritme saat assistant bicara, bergerak pelan saat berpikir
- AI Mode mengubah gaya jawaban: Brief answers (ringkas), Think it through (menimbang opsi lalu bertanya balik), Guide me (langkah demi langkah), Listen only (diam dan mencatat)
- Assistant proaktif: setiap jawaban ditutup rekomendasi dan tawaran bantuan ("Want me to draft a check-in to Acme Co.?"). Jawab "yes" atau "no", lalu ia menindaklanjuti dengan langkah berikutnya (draft, kirim atau simpan, pengingat) dan menawarkan hal penting berikutnya
- Ask Me First: saat kamu meminta aksi langsung ("send a follow up email"), assistant mengonfirmasi dulu. Jika dimatikan, aksi langsung dijalankan tanpa bertanya
- Mute/unmute, akhiri sesi, mulai ulang, timer sesi, dan ucapan seperti "goodbye" juga mengakhiri sesi
- Ringkasan sesi saat selesai: durasi, aksi, catatan, topik, rekomendasi berikutnya, transkrip, salin, unduh, dan rating
- Toast beranimasi di atas area konten (titik turun lalu mekar menjadi pill). Aksi assistant bisa dibatalkan lewat tombol Undo atau dengan mengucapkan "undo that"

Contoh yang bisa diucapkan: "Which deals are waiting on a reply?", "Tell me about Acme", "What is due today?", "What should I do next?", "Send a follow up email", "Schedule a call with Globex", "Undo that". Saat ditawari bantuan, jawab "yes", "not now", atau pilihan seperti "send it now" / "keep it in drafts".

**UI lainnya:**

- Tab konteks (Everything / Deals / Contacts / Tasks) mengganti briefing pembuka
- Toggle Live Captions (menyembunyikan caption) dan Ask Me First
- Search di menu kiri memfilter item navigasi
- Responsif: Voice Settings ditumpuk di bawah kartu pada layar kecil, sidebar jadi drawer

## Catatan teknis voice

- "Otak" jawabannya berbasis aturan dengan data CRM contoh (`src/voice/brain.js`), bukan model AI. Mau pakai AI sungguhan? Ganti fungsi `respond()` agar memanggil backend (jangan taruh API key di kode frontend).
- Butuh browser dengan `SpeechRecognition`: Chrome, Edge, Safari. Firefox belum didukung (akan muncul pesan).
- Butuh HTTPS atau localhost agar mic bisa dipakai.
- Privasi: pada Chrome dan Edge, audio untuk pengenalan suara diproses oleh layanan speech milik browser (server Google, Microsoft, atau Apple tergantung browser), bukan oleh proyek ini. Tidak ada audio atau teks yang dikirim ke server lain dan tidak ada yang disimpan.
- Suara balasan memakai `speechSynthesis`; suara yang terdengar bergantung pada voice yang terpasang di perangkat.

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
    brain.js               # jawaban demo berbasis aturan + data CRM contoh
  components/
    NavSide.jsx            # icon rail kiri + panel navigasi AI
    VoiceCard.jsx          # kartu sesi voice chat (orb, caption, kontrol)
    Orb.jsx                # orb kaca yang mengikuti level suara
    SettingsPanel.jsx      # panel Voice Settings (AI Mode + Quick Settings)
```
