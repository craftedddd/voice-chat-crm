# Voice Chat · CRM Concept

Implementasi web dari screen "Voice Chat" (AI voice assistant untuk CRM) yang didesain di Figma.
Dibangun dengan React + Vite, tanpa library UI tambahan. Semua ikon berupa SVG inline dan
orb gradien dibuat murni dengan CSS.

## Fitur interaktif

- Tab konteks (Everything / Deals / Contacts / Tasks) mengganti isi transcript
- Pemilihan AI Mode (Brief answers, Think it through, Guide me, Listen only)
- Toggle Live Captions (menyembunyikan transcript) dan Ask Me First
- Tombol mic untuk mute/unmute, tombol X untuk mengakhiri sesi, lalu bisa mulai ulang
- Timer sesi berjalan real-time
- Search di menu kiri memfilter item navigasi
- Responsif: panel kanan dan sidebar berubah jadi drawer di layar kecil

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
  components/
    NavSide.jsx            # icon rail kiri + panel navigasi AI
    VoiceCard.jsx          # kartu sesi voice chat (orb, transcript, kontrol)
    SettingsPanel.jsx      # panel Voice Settings (AI Mode + Quick Settings)
```
