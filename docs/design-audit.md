# Audit Design Token · Voice Chat CRM

Tanggal audit: 15 November 2026
Sumber: `src/styles.css` (1.683 baris), `src/components/Toast.jsx`, `src/icons.jsx`

Tujuan: merapikan nilai desain yang tersebar jadi satu set token, supaya semua screen baru (Live actions, Activity, Contact) memakai nilai yang sama.

> **Status: sudah diterapkan** (15 November 2026) dengan keputusan: kode sebagai sumber kebenaran, sisanya memakai usulan default. Aturan pemakaian ada di [DESIGN.md](../DESIGN.md).
>
> Tiga penyesuaian dari usulan di bawah:
> - `#dde6fb` **tidak** digabung ke `--brand-150`. Nilai itu jadi `--brand-200` (`--accent-tint-hover`), karena tombol mic memakai `#e2ebfd` sebagai latar dan `#dde6fb` sebagai hover. Kalau digabung, hover mic tidak terlihat.
> - Tab di mobile memakai 13px (`--fs-sm`), bukan 14px. Dengan 14px, tombol "+" terdorong keluar layar di lebar 393px.
> - Koreografi toast (morph titik ke pill) tetap memakai durasi literal, karena terikat dengan timer di `Toast.jsx`.

---

## 1. Ringkasan temuan

| Area | Kondisi sekarang | Usulan |
|---|---|---|
| Warna UI (hex) | 18 token + **21 hex tertulis langsung** di CSS | 12 neutral + 9 brand + 8 status |
| Warna di JSX | 5 hex tertulis langsung di `Toast.jsx` (hijau, merah, biru, abu) | Pakai token lewat CSS |
| Warna status | **Belum ada token.** Hijau `#34c759` dan merah `#ff5a4c` hanya ada di Toast | Token success, warning, danger, info (wajib untuk Live actions) |
| Transparansi putih (glass) | 10 level opacity berbeda (0.5 sampai 0.95) | 3 level |
| Ukuran font | **17 ukuran**, termasuk 5 ukuran setengah piksel | 10 level, tanpa setengah piksel |
| Font weight | 7 nilai (450 sampai 800) | 5 nilai |
| Radius | 3 token + 6 nilai lepas (8, 9, 10, 11, 12, 28) | 6 level + full |
| Shadow | 1 token + 10 shadow tertulis langsung | 6 token |
| Spacing | 30+ nilai berbeda, banyak angka ganjil (3, 5, 7, 9, 11, 13, 17, 19) | Skala 2 sampai 48 |
| Durasi animasi | 20+ kombinasi durasi dan easing | 4 durasi + 3 easing |

Yang sudah baik: token warna inti (`--ink`, `--muted`, `--accent`, `--line`) sudah dipakai konsisten (178 pemakaian `var()`), dan `--ease` dipakai di 38 tempat.

---

## 2. Warna

### 2a. Neutral

Semua abu-abu yang ada, diurutkan dari paling terang. Nilai yang perbedaannya tidak terlihat mata digabung.

| Token baru | Nilai | Menggantikan | Dipakai untuk |
|---|---|---|---|
| `--n-0` | `#ffffff` | `--bg`, `#fff`, `#ffffff` | Latar kartu, panel |
| `--n-25` | `#fafafc` | `--bg-main`, `--bg-soft` (#fbfbfd) | Latar area utama |
| `--n-50` | `#f3f4f8` | `--bg-field`, `--selected` (#f3f5fa), `#f0f1f5` | Field, hover, item terpilih |
| `--n-100` | `#ececf1` | `--line`, `#eef0f6`, `#eceef3` | Garis, item aktif di rail, avatar |
| `--n-200` | `#e3e4ea` | `--line-2` | Garis tegas |
| `--n-300` | `#d9dbe3` | `#d9dbe3` (toggle), `#dcdde3` (handle sheet) | Toggle off, handle |
| `--n-400` | `#b9bcc7` | `--muted-2`, `#b0b3bf` | Teks disabled, chevron |
| `--n-500` | `#9a9daa` | `#a6a9b5`, `#9a9daa`, `#989ba8` | Ikon sekunder |
| `--n-600` | `#8c8f9b` | `--muted` | Teks muted |
| `--n-700` | `#5d606c` | `#5d606c` (tab) | Teks tersier |
| `--n-800` | `#41434d` | `--ink-2` | Teks sekunder |
| `--n-900` | `#17181c` | `--ink` | Teks utama |

> **Perlu kamu cek:** `#7f8a95` (status "ended" di mobile) agak kebiruan dan tidak cocok dengan skala lain. Usulanku digabung ke `--n-600`. Kalau warna itu dari Figma dan memang disengaja, kita jadikan token sendiri.

### 2b. Brand

| Token baru | Nilai | Menggantikan | Dipakai untuk |
|---|---|---|---|
| `--brand-25` | `#f6f9ff` | `#f6f9ff` | Hover tombol putih (mobile) |
| `--brand-50` | `#f1f5fe` | `--accent-softer` | Latar lembut |
| `--brand-100` | `#e9eefc` | `--accent-soft` | Chip, item terpilih |
| `--brand-150` | `#e2ebfd` | `#e2ebfd`, `#dde6fb` | Tombol mic, hover kontrol |
| `--brand-500` | `#4b5ae4` | `--accent` | Warna utama |
| `--brand-600` | `#3a49d0` | `--accent-deep` | Hover, pressed |
| `--brand-link` | `#4a6cf7` | `--accent-text` | Link, tanda centang |
| `--violet-500` | `#5b55dd` | `--violet` | Tombol wave |
| `--violet-600` | `#4f49d1` | `#4f49d1` | Hover tombol wave |

> **Perlu kamu putuskan:** ada dua biru yang mirip, `#4b5ae4` (accent) dan `#4a6cf7` (accent-text). Apakah memang disengaja dua biru berbeda, atau link cukup memakai `--brand-500` saja?

### 2c. Status (baru, dibutuhkan untuk Live actions)

| Token | Nilai | Asal |
|---|---|---|
| `--success` | `#34c759` | Sudah ada di Toast |
| `--success-soft` | `#e8f8ed` | Usulan baru |
| `--warning` | `#f5a524` | **Usulan baru**, untuk "butuh persetujuan" |
| `--warning-soft` | `#fef4e2` | Usulan baru |
| `--danger` | `#ff5a4c` | Sudah ada di Toast |
| `--danger-soft` | `#ffecea` | Usulan baru |
| `--info` | `var(--brand-500)` | Memakai brand |
| `--info-soft` | `var(--brand-100)` | Memakai brand |

### 2d. Overlay dan glass

| Token | Nilai | Menggantikan |
|---|---|---|
| `--scrim` | `rgba(23,24,28,.22)` | Backdrop sheet dan drawer |
| `--glass-weak` | `rgba(255,255,255,.55)` | Opacity .5, .55, .6 |
| `--glass` | `rgba(255,255,255,.7)` | Opacity .65, .68, .7, .72 |
| `--glass-strong` | `rgba(255,255,255,.92)` | Opacity .9, .92, .95 |

### 2e. Ilustrasi (tidak diubah)

Warna orb (ungu, pink, biru) dan gradien latar mobile (`#f3fbff` sampai `#ebf5ff`) adalah ilustrasi, bukan warna UI. Usulanku: tetap seperti sekarang, cukup dikelompokkan jadi token `--orb-*` dan `--grad-mobile` supaya tidak dipakai ulang sembarangan untuk komponen.

---

## 3. Tipografi

### 3a. Ukuran font

| Token | Ukuran | Menggantikan | Contoh pemakaian |
|---|---|---|---|
| `--fs-2xs` | 11px | 11 | Nama pembicara, counter |
| `--fs-xs` | 12px | 12, **11.5**, **12.5** | Chip, meta, label kecil, segmented |
| `--fs-sm` | 13px | 13 | Label, tombol, toast, timer |
| `--fs-md` | 14px | 14, **13.5** | Body, item navigasi, list |
| `--fs-lg` | 15px | 15, **16** | Judul panel |
| `--fs-xl` | 17px | 17 | Judul summary |
| `--fs-2xl` | 20px | 20, **19**, **18.5** | Angka statistik, caption live |
| `--fs-3xl` | 22px | 22, **23** | Caption utama |
| `--fs-4xl` | 24px | 24 | Judul halaman (tablet) |
| `--fs-5xl` | 29px | 29 | Judul halaman (desktop) |

Yang dicetak tebal akan berubah ukuran. Yang perubahannya terasa (1px atau lebih):

| Elemen | Sekarang | Jadi |
|---|---|---|
| `.settings__title` | 16 | 15 (sama dengan judul panel navigasi) |
| `.stat dd` (angka statistik) | 19 | 20 |
| `.voicecard__captions` (desktop) | 23 | 22 |
| `.voicecard__captions` (≤1220px) | 18.5 | 20 |

### 3b. Font weight

| Token | Nilai | Menggantikan |
|---|---|---|
| `--fw-regular` | 450 | 450 |
| `--fw-medium` | 500 | 500, **550** |
| `--fw-semibold` | 600 | 600 |
| `--fw-title` | 650 | 650 |
| `--fw-bold` | 700 | 700, **800** |

### 3c. Lainnya

- Line height: `--lh-tight 1.33`, `--lh-base 1.45`, `--lh-relaxed 1.5` (1.55 digabung ke 1.5).
- Letter spacing: `--ls-tight -0.01em` (menggabungkan -0.005 sampai -0.02), `--ls-caps 0.09em` untuk label huruf kapital.

---

## 4. Radius

| Token | Nilai | Menggantikan | Contoh |
|---|---|---|---|
| `--r-xs` | 8px | 8 | Tombol kecil |
| `--r-sm` | 10px | 10, **9**, **11** | Item navigasi, field |
| `--r-md` | 12px | 12 | Kartu kecil, chip besar |
| `--r-lg` | 14px | `--r-md` lama | Panel |
| `--r-xl` | 20px | `--r-lg` lama | Kartu utama |
| `--r-2xl` | 28px | 28 | Bottom sheet |
| `--r-full` | 999px | 999px, 50% | Pill, avatar, tombol bulat |

Catatan: nama `--r-md` dan `--r-lg` bergeser. Semua pemakaiannya akan ikut diperbarui, jadi tampilan tidak berubah.

---

## 5. Shadow

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(23,24,28,.06)` | Tab aktif, chip (menggabungkan .05 dan .08) |
| `--shadow-sm` | `0 1px 3px rgba(23,24,28,.08), 0 0 0 1px rgba(23,24,28,.03)` | Segmented aktif |
| `--shadow-knob` | `0 1px 3px rgba(23,24,28,.25)` | Kenop toggle |
| `--shadow-card` | (tetap) | Kartu utama |
| `--shadow-float` | `0 8px 22px -12px rgba(48,84,160,.35)` | Tombol putih mengambang (mobile) |
| `--shadow-brand` | `0 8px 18px -10px rgba(75,90,228,.7)` | Tombol utama (mic, CTA) |
| `--shadow-sheet` | `0 -6px 40px -14px rgba(23,24,28,.28)` | Bottom sheet |

Shadow ungu tombol wave (`rgba(91,85,221,.6)`) digabung ke `--shadow-brand`.

---

## 6. Spacing

Skala usulan (basis 2 dan 4):

`--s-0.5: 2px` · `--s-1: 4px` · `--s-1.5: 6px` · `--s-2: 8px` · `--s-2.5: 10px` · `--s-3: 12px` · `--s-3.5: 14px` · `--s-4: 16px` · `--s-5: 20px` · `--s-6: 24px` · `--s-7: 28px` · `--s-8: 32px` · `--s-10: 40px` · `--s-12: 48px`

Strategi yang aku sarankan:
- **Komponen baru wajib memakai skala ini.**
- Komponen lama: nilai ganjil (3, 5, 7, 9, 11, 13, 17, 19) dibulatkan hanya kalau selisihnya 1px dan tidak menggeser layout. Nilai `clamp()` di layout mobile tetap, karena itu hasil penyesuaian dengan desain Figma.

---

## 7. Motion

| Token | Nilai | Menggantikan |
|---|---|---|
| `--dur-fast` | 160ms | .16s, .18s (hover, warna) |
| `--dur-base` | 240ms | .2s sampai .26s (transisi kecil, sheet menutup) |
| `--dur-slow` | 400ms | .3s sampai .45s (sheet membuka, toast) |
| `--dur-slower` | 600ms | .52s, .6s |
| `--ease` | (tetap) | Termasuk `cubic-bezier(.22,1,.36,1)` yang ditulis ulang di sheet |
| `--ease-in` | `cubic-bezier(.4,0,1,1)` | Animasi keluar (sheet, toast) |
| `--spring` | (tetap, dipindah ke `:root`) | Efek pantul |

Animasi orb yang lambat (7s sampai 19s) tidak disentuh karena itu ilustrasi.

---

## 8. Temuan lain

1. **`Toast.jsx` memakai warna hardcode di SVG** (`#34c759`, `#ff5a4c`, `#4b5ae4`, `#8c8f9b`). Usulan: pindahkan ke CSS memakai token status.
2. **`--spring` didefinisikan di tengah file**, bukan di `:root`. Akan dipindah.
3. **Nama token campur aduk** (`--violet`, `--accent-text`, `--selected`, `--bg-soft`). Penamaan baru memakai dua lapis:
   - lapis dasar: `--n-*`, `--brand-*` (palet mentah)
   - lapis semantik: `--text`, `--text-muted`, `--surface`, `--border`, `--icon` (yang dipakai komponen)

   Komponen hanya boleh memakai lapis semantik. Dengan begitu, kalau nanti ganti warna brand atau menambah dark mode, cukup ubah satu tempat.

---

## 9. Yang perlu kamu putuskan sebelum aku terapkan

1. **Sumber kebenaran:** Figma atau kode? Kalau Figma, token ini kita samakan dengan Figma Variables.
2. **`#7f8a95`:** digabung ke `--n-600`, atau memang warna khusus dari desainmu?
3. **Dua biru** (`#4b5ae4` dan `#4a6cf7`): pertahankan keduanya, atau satukan?
4. **Warna warning baru** `#f5a524`: oke, atau kamu punya pilihan sendiri?
5. **4 perubahan ukuran font** di bagian 3a: setuju?

Setelah itu, langkah penerapannya:
1. Tulis token baru di `:root`.
2. Ganti semua nilai hardcode dengan token (tampilan dijaga sama, kecuali poin yang kamu setujui di atas).
3. Cek visual di 1440, 960, dan 393px.
4. Tulis `DESIGN.md` dan `CLAUDE.md` berisi aturan pemakaian token dan komponen.
