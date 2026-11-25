# Design System · Voice Chat CRM

Sumber kebenaran: **kode** (`src/styles.css`, blok `:root`).
Figma mengikuti kode. Kalau token berubah, ubah di sini dulu, lalu sinkronkan ke Figma Variables.

Riwayat audit dan alasan setiap penggabungan nilai: [docs/design-audit.md](docs/design-audit.md).

---

## 1. Aturan utama

1. **Komponen hanya memakai token semantik** (`--text`, `--surface`, `--border`, `--accent`, `--success`, dan seterusnya). Palet mentah (`--n-*`, `--brand-*`, `--green-*`, dll.) hanya dipakai di dalam `:root` untuk mendefinisikan token semantik.
2. **Tidak ada hex, rgba, atau angka px baru** untuk warna, ukuran font, weight, radius, shadow, atau durasi. Kalau butuh nilai yang belum ada, tambahkan token dulu di `:root`, lalu catat di file ini.
3. **Spacing memakai skala `--s-*`** untuk semua komponen baru. Nilai `clamp()` di layout mobile adalah pengecualian karena hasil penyesuaian dengan desain Figma.
4. **Status selalu berpasangan**: warna utama untuk ikon atau titik, `-soft` untuk latar, `-text` untuk teks di atas latar `-soft`.
5. Warna orb dan `--grad-mobile` adalah **ilustrasi**. Jangan dipakai untuk komponen. `--grad-mobile` hanya untuk mode Voice di ≤ 640px. `--grad-mobile-end` (warna terakhir gradien itu) hanya dipakai sebagai latar `html`/`body` mode Voice di ≤ 640px, supaya area di belakang toolbar Safari iOS menyambung dengan gradien.

---

## 2. Token

### Warna semantik

| Token | Dipakai untuk |
|---|---|
| `--surface` | Latar kartu, panel, tombol putih |
| `--surface-subtle` | Latar area utama |
| `--surface-field` | Field, item terpilih |
| `--surface-hover` | Hover item netral |
| `--surface-active` | Item aktif di rail, avatar |
| `--border` | Garis default |
| `--border-strong` | Garis tegas, border tombol |
| `--text` | Teks utama |
| `--text-2` | Teks sekunder |
| `--text-3` | Teks tersier (tab tidak aktif) |
| `--text-muted` | Teks pendukung, meta |
| `--text-faint` | Placeholder, disabled, chevron |
| `--icon` | Ikon sekunder |
| `--on-accent` | Teks dan ikon di atas warna solid |
| `--on-warning` | Teks di atas `--warning` solid (badge) |
| `--control-off` | Toggle off, handle sheet |
| `--accent` / `--accent-hover` | Aksi utama dan hover-nya |
| `--accent-soft` / `--accent-softer` | Latar lembut brand |
| `--accent-tint` / `--accent-tint-hover` | Tombol kontrol (mic) dan hover-nya |
| `--accent-tint-weak` | Hover tombol putih di mobile |
| `--accent-wash` | Hover tombol teks di atas glass |
| `--link` | Link, tanda centang |
| `--wave` / `--wave-hover` | Tombol wave (ungu) |

### Status

| Status | Utama | Latar | Teks | Contoh label |
|---|---|---|---|---|
| Sukses | `--success` | `--success-soft` | `--success-text` | Selesai |
| Peringatan | `--warning` | `--warning-soft` | `--warning-text` | Butuh persetujuan |
| Bahaya | `--danger` | `--danger-soft` | `--danger-text` | Gagal |

`--danger-fade` dan `--danger-fade-strong`: warna awal gradien merah zona hapus (biasa dan saat tab berada di atasnya). Hanya untuk zona hapus.
| Info | `--info` | `--info-soft` | `--info-text` | Berjalan |

### Overlay dan glass

`--scrim` (backdrop sheet), `--scrim-strong` (backdrop drawer), `--glass-weak`, `--glass`, `--glass-strong`, `--hairline-on-glass`.

### Tipografi

| Token | Ukuran | Untuk |
|---|---|---|
| `--fs-2xs` | 11px | Counter, label kapital |
| `--fs-xs` | 12px | Chip, meta, segmented |
| `--fs-sm` | 13px | Label, tombol, toast, tab mobile |
| `--fs-md` | 14px | Body, item navigasi, list |
| `--fs-lg` | 15px | Judul panel |
| `--fs-xl` | 17px | Judul section |
| `--fs-2xl` | 20px | Angka statistik, caption live, judul mobile |
| `--fs-3xl` | 22px | Caption utama |
| `--fs-4xl` | 24px | Judul halaman (tablet) |
| `--fs-5xl` | 29px | Judul halaman (desktop) |

Weight: `--fw-regular` 450, `--fw-medium` 500, `--fw-semibold` 600, `--fw-title` 650, `--fw-bold` 700.
Line height: `--lh-tight` 1.33, `--lh-base` 1.45, `--lh-relaxed` 1.5.
Letter spacing: `--ls-tight` untuk judul dan teks besar, `--ls-caps` untuk label huruf kapital.

### Radius

`--r-xs` 8 · `--r-sm` 10 · `--r-md` 12 · `--r-lg` 14 · `--r-xl` 20 · `--r-2xl` 28 · `--r-full` 999

### Shadow

| Token | Untuk |
|---|---|
| `--shadow-xs` | Tab aktif, chip |
| `--shadow-sm` | Segmented aktif |
| `--shadow-knob` | Kenop toggle |
| `--shadow-card` | Kartu utama |
| `--shadow-float` | Tombol putih mengambang (mobile) |
| `--shadow-brand` | Tombol utama berwarna |
| `--shadow-toast` | Toast |
| `--shadow-sheet` | Bottom sheet |
| `--shadow-popover` | Popover editor context, tab yang sedang di-drag |

### Spacing

`--s-0-5` 2 · `--s-1` 4 · `--s-1-5` 6 · `--s-2` 8 · `--s-2-5` 10 · `--s-3` 12 · `--s-3-5` 14 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-7` 28 · `--s-8` 32 · `--s-10` 40 · `--s-12` 48

### Motion

| Token | Nilai | Untuk |
|---|---|---|
| `--dur-fast` | 160ms | Hover, perubahan warna |
| `--dur-base` | 240ms | Transisi kecil, elemen menutup |
| `--dur-slow` | 400ms | Elemen membuka, caption masuk |
| `--dur-slower` | 600ms | Perubahan suasana (orb) |
| `--ease` | | Default untuk hampir semua transisi |
| `--ease-in` | | Elemen keluar |
| `--spring` | | Efek pantul (toast, centang, badge) |
| `--dur-spin` | 900ms | Satu putaran spinner |
| `--dur-pulse` | 1600ms | Denyut indikator live dan status menunggu |

### Pola animasi Live actions

- Item baru: tinggi baris membuka dari 0 (`afeed-open`) supaya item lain turun mulus, isi masuk dengan geser 4px dan fade (`afeed-enter`).
- Status dibedakan lewat bentuk titik: cincin biru putus-putus berputar (berjalan), cincin biru (menunggu jawaban), titik hitam solid (selesai), cincin pudar (dibatalkan). Titik selesai muncul dengan `--spring` (`afeed-pop`).
- Langkah kerja dilipat 1,1 detik setelah selesai.
- Item yang sudah ada saat panel dibuka tidak dianimasikan ulang (`.is-static`).
- Tanpa ikon di dalam kotak berwarna, tanpa label huruf kapital berwarna, tanpa glow, gradien bergerak, atau shimmer. Biru accent hanya untuk yang butuh perhatian. Semua animasi mati di `prefers-reduced-motion`, kecuali spinner yang diperlambat.

### Pola caption live

- Jendela tetap 3 baris. Baris yang sedang diucapkan dijaga di baris kedua, baris ketiga berisi teks berikutnya (abu).
- Saat suara pindah baris, teks naik satu baris (`--dur-slow`, `--ease`) dan baris teratas memudar lewat mask.
- Ucapan baru langsung tampil dari atas tanpa animasi turun.

### Pola toast persetujuan

- Tampil selama ada tawaran yang menunggu jawaban dan feed Actions tidak terlihat (di mobile: sheet tertutup atau di tab Settings).
- Toast lain boleh menggantikannya; setelah toast itu selesai, pertanyaannya muncul lagi.
- Tombol = jawaban "ya". Mengetuk teks membuka tab Actions. Menolak cukup lewat suara atau di feed.
- Toast hasil aksi ("4 shipping labels ready" + Undo) dan toast undo lewat suara selalu tampil, termasuk saat feed terlihat. Undo yang diklik langsung di feed tidak memunculkan toast.
- Pengecualian: di mode Chat ≤ 640px, toast hasil aksi dan toast undo tidak muncul, karena kartu aksinya sudah terlihat di percakapan.

Pengecualian: koreografi toast (morph titik ke pill) memakai durasi literal karena terikat dengan timer di `Toast.jsx` (`T_DOT`, `T_CLOSE`, `T_LEAVE`). Ubah keduanya bersamaan.

---

### Pola drawer navigasi (≤ 960px)

- Drawer selalu dibuka di panel AI. Judulnya tombol "‹ AI" (`.navpanel__back`) yang membuka menu utama.
- Menu utama berjudul "Nara Wear" dan berisi item rail dengan label, memakai `.navlist__item`. AI ditandai aktif dengan chevron kanan (`.navlist__go`) dan membuka panel AI lagi.
- Item lain menutup drawer lalu memunculkan toast "… coming soon".
- Pergantian isi drawer: geser pendek `--s-6` dan fade (`--dur-base`, `--ease`), arahnya mengikuti navigasi. Mati di `prefers-reduced-motion`.

### Pola mode Chat dan Voice

- Halaman Assistant punya dua mode, Chat dan Voice, dipilih lewat switch (`.seg.modeswitch`). Pilihan terakhir disimpan di localStorage (`nara.mode`).
- Desktop dan tablet: switch di kiri baris tab context, lalu garis pemisah (`.ctxbar__divider`), lalu tab. Dibaca kiri ke kanan: cara bicara dulu, baru topiknya. Switch tidak ikut di-drag atau di-scroll bersama tab.
- ≤ 640px: switch menggantikan judul di tengah header (`.main__mode`), di antara menu dan gear.
- Warna di ≤ 640px mengikuti mode (`.app.is-chat` dan `html[data-mode]`):
  - **Voice:** gradien `--grad-mobile` sebagai latar orb, seperti sebelumnya.
  - **Chat:** latar putih `--surface` (termasuk `html`/`body` di belakang toolbar Safari), switch `--surface-field`, dan kolom ketik `--surface-field` tanpa bayangan. Sama dengan kartu chat di desktop, supaya bubble user dan chip kontras.
- Dua mode memakai satu percakapan. Transkrip call masuk ke chat sebagai bubble, dengan pemisah "Voice call" / "Chat" (`.chatdiv`) saat percakapan berpindah. Yang sudah dikerjakan di satu mode diingat di mode lain.
- Chat memakai bingkai kartu yang sama dengan voice (`.voicecard.chatcard`). Pesan assistant berupa teks biasa, pesan user berupa bubble kanan (`.chatmsg--user`), catatan Listen only berupa `.chatmsg--note`.
- Jawaban assistant di chat dipisah jadi dua paragraf berjarak `--s-3` (`.aimsg`, data dari `parts` di `brain.js`): yang sudah dikerjakan atau informasinya, lalu tawaran berikutnya. Warna dan ukurannya sama, hanya jarak yang membedakan.
  - Chip jawaban (`.chip--toggle`) ada di bawah paragraf kedua, hanya pada pesan terakhir yang masih menunggu jawaban.
  - Kata sambung ("Next up:", "One more thing:") tidak ditulis di chat karena paragraf baru sudah memisahkannya. Di Voice tetap diucapkan.
  - Undo untuk aksi ada di Live actions dan toast (desktop dan tablet) atau di kartu aksi (≤ 640px), tidak di dalam pesan.
  - Transkrip call tetap teks utuh seperti yang diucapkan. Kalau pertanyaannya datang dari call, chip tampil di bawah percakapan.
- Toast persetujuan tidak dimunculkan di mode Chat, karena chip jawabannya sudah ada di percakapan.
- **Kartu aksi di percakapan (≤ 640px).** Di HP feed Actions tersembunyi di sheet, jadi aksi ditampilkan langsung di chat (`.chatact`, pesan `who: 'action'` yang membaca isinya dari feed lewat `actionId`). Di layar lebih besar kartu ini tidak tampil karena feed ada di samping.
  - Tempatnya tepat setelah pesan yang memicunya, sebelum balasan assistant. Assistant baru melapor setelah aksinya selesai. Ini juga berlaku untuk aksi dari call.
  - Tanpa bingkai. Memakai titik timeline (`.tnode`), judul (`.tev__title`), jam (`.tev__time`), langkah (`.tstep`), dan link (`.tlink`) yang sama dengan feed, tanpa garis vertikal.
  - Berjalan: langkah dicentang satu per satu, titik loading chat disembunyikan karena kartunya sudah menunjukkan proses.
  - Selesai: langkah tetap terlihat sebentar (`COLLAPSE_MS`), lalu kartu menyusut jadi satu baris: titik, judul hasil, chevron bawah (`.chatact__chev`), dan jam. Seluruh baris adalah tombol (`aria-expanded`) dengan ruang sentuh `--s-1` atas dan bawah. Saat dibuka, chevron berputar 180° (`--dur-base`) dan tampil langkah, detail, Open, dan Undo.
  - Undo: judul dicoret, titik jadi cincin abu-abu, isi lipatan "Undone".
  - Pola lipat ini khusus chat. Feed Actions tidak berubah.
- Kolom ketik (`.composer`): tombol mic untuk pindah ke Voice dan tombol kirim bulat aksen.
- Call tetap berjalan saat pindah ke Chat. Penandanya `.callbar` di atas percakapan: titik berdenyut, "Voice call", durasi, status, Mute, dan End. Ketuk penanda untuk kembali ke Voice. Pesan yang diketik saat call dijawab dengan suara juga.
- Ganti bahasa saat chat: konfirmasinya masuk ke percakapan, sama seperti saat call.
- **Ganti tab saat chat (tanpa call):**
  - Perpindahan ditandai pemisah nama tab (pesan `who: 'tab'`, gaya `.chatdiv` yang sama dengan pemisah Voice call / Chat). Kalimat "Okay, switching to …" tidak ditulis di chat. Saat call kalimat itu tetap diucapkan, karena di sana tidak ada penanda visual.
  - Tab yang sudah beres cukup satu kalimat bernama tab ("Nothing urgent left in Orders."). Kalau tawaran dari tab lain sama dengan pertanyaan yang masih menunggu, ditulis sebagai pengingat singkat (`REMIND` di `brain.js`), tidak diulang utuh. Chip pindah ke pesan ini.
  - Pindah tab lagi sebelum ada pesan baru (belum mengetik, belum menjawab): pemisah dan briefing tab sebelumnya memudar (`.chatcard__item.is-leaving`, `--dur-fast`) lalu diganti. Begitu ada interaksi, briefing itu tetap di percakapan. Durasi pudar di CSS dan `BRIEF_FADE_MS` di `useVoiceChat.js` harus sama.
  - Kembali ke tab asal sebelum ada interaksi (misalnya Everything lalu Orders lalu Everything): briefing yang belum disentuh dihapus tanpa pemisah baru, dan chip kembali ke pertanyaan terakhir di tab asal.
- Animasi chat:
  - Pesan baru (bubble user, catatan) naik halus `--dur-base`.
  - Jawaban assistant didahului indikator mengetik gooey (`.chatdots`): titik `--accent` yang membelah jadi dua lalu menyatu lagi seperti cairan, satu putaran `--dur-spin`, memakai filter SVG (blur lalu dipertajam). Di `prefers-reduced-motion` titiknya diam. Setelah itu jawaban ditulis kata demi kata (`.sword`: fade, naik 3px, blur tipis, `--dur-slow`). Paling lama 40 ms per kata dan sekitar 1,5 detik total.
  - Chip jawaban muncul setelah teks selesai.
  - Mengirim pesan baru atau menekan chip langsung menampilkan sisa teks.
  - Hanya pesan baru yang beranimasi. Pindah mode tidak memutar ulang animasi.
  - Screen reader membaca teks utuh sekali. Di `prefers-reduced-motion`, teks langsung tampil penuh.
- Saat call berjalan dan user di mode Chat, bubble jawaban muncul mengikuti suara yang diucapkan. Bagian yang belum diucapkan transparan (`.chatmsg__unspoken`), jadi bubble tidak melompat.
- Pindah dari Chat ke Voice setelah mengobrol:
  - Layar Voice sebelum call menampilkan label "Continuing from chat" dan pertanyaan terakhir dari chat, bukan briefing tab.
  - Call dibuka dengan "Picking up from chat." lalu pertanyaan yang menunggu, tanpa briefing ulang. Tanpa tombol "Start fresh": ganti tab sudah memicu briefing baru.

### Assistant settings

- Panel kanan berjudul "Assistant settings" dan dikelompokkan menurut berlaku untuk mode apa.
- Berlaku untuk Chat dan Voice: Language, AI Mode (Brief answers, Think it through, Guide me), dan Ask Me First.
- Khusus Voice, tampil di mode Voice atau saat call berjalan: Listen only (di daftar AI Mode), Live Captions, dan tombol pratinjau suara. Di mode Chat, Listen only dibaca sebagai Brief answers.

### Pola custom context

- Tombol "+" di deretan tab membuka editor: popover di bawah tombol (desktop, `.ctxpop`) atau bottom sheet (≤ 640px). Maksimal 3 custom context, disimpan di localStorage.
- Isi editor (`ContextEditor.jsx`): template ("Complaints & returns", "TikTok only", "Hijabs") yang mengisi form sekaligus, Name (terisi otomatis dari pilihan), Focus on (chip), Shop (`.seg`), Products (chip), dan pratinjau "Assistant opens with" yang memakai bahasa percakapan.
- Chip pilihan memakai `.chip--toggle`; terpilih = pill gelap dengan centang (`.is-on`).
- Tab custom yang aktif punya chevron. Klik tab itu lagi untuk membuka editor yang sama, dengan Save dan Delete (`.tlink--danger`).
- Briefing custom context disusun dari fakta toko di `brain.js` (`FACTS`) yang cocok dengan fokus, toko, dan produk. Kalau tidak ada yang cocok, assistant bilang tidak ada yang perlu diurus lalu menawarkan hal penting di luar tampilan itu.
- Tab diganti saat call: assistant berhenti, bilang "Okay, switching to …", lalu membacakan briefing tab baru tanpa hal yang sudah ditangani. Kalau sedang berpikir, briefing dibacakan setelah jawabannya selesai.

### Pola drag tab

- Semua tab bisa di-drag untuk mengubah urutan. Mouse: tekan lalu geser. Layar sentuh: tekan lama 0,4 detik (geser lebih cepat dari itu tetap scroll biasa). Keyboard: Alt + panah kiri/kanan.
- Saat drag, tab tampil sebagai bayangan (`.tab--ghost`) di atas halaman, slotnya di deretan jadi kosong, dan tab lain bergeser mulus (`--dur-base`, `--ease`).
- Hanya tab custom yang bisa dihapus. Saat tab custom di-drag, zona hapus (`.delzone`) muncul dari bawah layar: gradien merah dan ikon tempat sampah polos. Di atas zona, gradien menebal, ikon membesar, dan teks berubah jadi "Release to delete".
- Tab bawaan hanya bisa diangkat sedikit dan tidak memunculkan zona hapus.
- Hapus (lewat drag atau tombol Delete) tidak memakai dialog konfirmasi. Toast "… deleted" dengan Undo mengembalikan context ke posisi semula.

### Aturan persetujuan aksi

- **Aksi yang terlihat pembeli** (membalas chat, menawarkan tukar barang) **selalu** minta persetujuan dulu, apa pun posisi toggle Ask Me First. Detail kartunya menyebut "Buyer will see this".
- **Label pengiriman** juga **selalu** minta persetujuan, karena label memesan penjemputan kurir. Sebelum dibuat, user melihat daftar pesanannya (`OrderPick`) dan bisa melepas centang pesanan yang belum siap. Tombolnya menyebut jumlah ("Create 3 labels"). Di toast persetujuan, tombolnya "Review" dan membuka feed Actions, bukan langsung membuat label.
- **Aksi internal lainnya** (sinkron stok, label retur) mengikuti toggle Ask Me First.
- Semua aksi bisa dibatalkan, lewat Undo di feed atau toast, atau lewat suara ("undo that" / "batalin").
- Penandanya ada di `brain.js`: langkah dengan `buyer: true` (terlihat pembeli) atau `review: true` (daftarnya harus dilihat dulu).

### Bahasa

- UI (label, tab, feed, toast, summary) selalu bahasa Inggris.
- Bahasa percakapan (chat, ucapan, briefing, caption) dipilih di Assistant settings, "Language": English atau Bahasa Indonesia, memakai `.seg`.
- Bahasa bisa diganti di tengah call. Assistant berhenti, mengonfirmasi singkat dalam bahasa baru, lalu mengulang pertanyaan yang menunggu. Kalau sedang berpikir atau menjalankan aksi, jawaban berikutnya langsung memakai bahasa baru dan diawali konfirmasi itu.
- Ucapan Indonesia memakai gaya lisan ("siapin", "udah", "nggak", "buat"), bukan bahasa tulis.
- Merek dan kata serapan dieja ulang hanya untuk suara (`SAY_AS_ID` di `speech.js`). Caption tetap menampilkan ejaan asli.
- Nominal di UI memakai format "Rp 4.2M" / "Rp 740K"; di ucapan Indonesia "4,2 juta", di ucapan Inggris "4.2 million rupiah".
- Asal toko ditulis sebagai teks netral "Shopee" atau "TikTok", tanpa logo atau warna brand.

## 3. Komponen yang sudah ada

Pakai ulang komponen ini sebelum membuat yang baru.

| Komponen | Class | Catatan |
|---|---|---|
| Icon button | `.iconbtn` | Tombol ikon 40px berbingkai |
| Segmented control | `.seg`, `.seg__btn` | Pilihan 2 sampai 3 opsi dalam satu panel |
| Tab | `.tab` | Tab pill di header |
| Chip | `.chip`, `.quick__chip` | Label kecil dan saran cepat |
| Tombol utama | `.pbtn`, `.ctl--primary` | Satu per tampilan |
| Kontrol voice | `.ctl`, `.ctl--mic` | Tombol bulat di bawah orb |
| Toggle | `.toggle`, `.toggle__knob` | |
| Item navigasi | `.navlist__item` | Juga dipakai di menu utama drawer (`MainMenu`) |
| Kartu | `.voicecard` | Kartu utama dengan `--shadow-card` |
| Statistik | `.stat` | Angka di summary |
| Bottom sheet | `BottomSheet.jsx` | Panel dari bawah di mobile |
| Panel kanan | `SidePanel.jsx` | Tab Settings dan Actions, dipakai di kolom kanan dan di bottom sheet |
| Live actions | `ActionFeed.jsx` | Garis waktu (`.tev`), titik status (`.tnode`), langkah kerja (`.tstep`) |
| Tombol pill gelap | `.tbtn` | Satu jawaban utama di feed |
| Link teks | `.tlink`, `.tlink--accent` | Jawaban kedua, Open, Undo |
| Toast | `Toast.jsx` | Satu pill, berbagai jenis. `setSticky()` untuk pertanyaan yang menunggu jawaban (ikon cincin biru, sama dengan titik "menunggu" di feed) |
| Caption live | `LiveCaption` di `VoiceCard.jsx` | Jendela 3 baris tanpa scroll (`.capwin`) |
| Tab context | `ContextTabs.jsx` | Deretan tab dengan drag, zona hapus, dan popover editor |
| Switch mode | `ModeSwitch` di `App.jsx`, `.modeswitch` | Chat atau Voice, memakai `.seg` |
| Kartu chat | `ChatCard.jsx` | Percakapan (`.chatmsg`, jawaban dua paragraf `.aimsg`), chip jawaban, `.composer`, `.callbar` saat call berjalan, dan kartu aksi lipat `.chatact` (≤ 640px) |
| Daftar pesanan | `OrderPick.jsx` | Daftar bercentang sebelum label pengiriman dibuat (`.opick`). Centangnya lingkaran bergaris tanpa isi warna; baris yang dilepas dicoret dan memudar. `compact` untuk feed Actions. Setelah dijawab, daftarnya tetap tampil sebagai catatan (`frozen`): di chat di bawah pertanyaannya, dan di item hasil aksi pada feed. Kalau dijawab "Not now", ditinggal, atau di-undo, semua baris memudar (`declined`) |
| Editor context | `ContextEditor.jsx` | Form custom context, dipakai di popover dan bottom sheet |
| Chip pilihan | `.chip--toggle` | Chip yang bisa dipilih, `.is-on` saat terpilih |

---

## 4. Breakpoint

| Lebar | Perilaku |
|---|---|
| > 1220px | Tiga kolom: navigasi, konten, Assistant settings |
| ≤ 1220px | Konten dan Assistant settings ditumpuk |
| ≤ 960px | Panel navigasi jadi drawer, dengan menu utama di balik tombol "‹ AI" |
| ≤ 640px | Rail disembunyikan, chat dan voice layar penuh, switch Chat dan Voice di tengah header, Assistant settings di bottom sheet. Latar `html`/`body` memakai `--grad-mobile-end` di mode Voice dan `--surface` di mode Chat, karena toolbar browser HP mengambang di atas halaman |

Setiap screen baru dicek minimal di 1440, 900, dan 393px.
