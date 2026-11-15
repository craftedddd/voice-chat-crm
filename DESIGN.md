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
5. Warna orb dan `--grad-mobile` adalah **ilustrasi**. Jangan dipakai untuk komponen.

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
| `--spring` | | Efek pantul (toast) |

Pengecualian: koreografi toast (morph titik ke pill) memakai durasi literal karena terikat dengan timer di `Toast.jsx` (`T_DOT`, `T_CLOSE`, `T_LEAVE`). Ubah keduanya bersamaan.

---

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
| Item navigasi | `.navlist__item` | |
| Kartu | `.voicecard` | Kartu utama dengan `--shadow-card` |
| Statistik | `.stat` | Angka di summary |
| Bottom sheet | `BottomSheet.jsx` | Panel dari bawah di mobile |
| Toast | `Toast.jsx` | Satu pill, berbagai jenis |

---

## 4. Breakpoint

| Lebar | Perilaku |
|---|---|
| > 1220px | Tiga kolom: navigasi, konten, Voice Settings |
| ≤ 1220px | Konten dan Voice Settings ditumpuk |
| ≤ 960px | Panel navigasi jadi drawer |
| ≤ 640px | Rail disembunyikan, voice chat layar penuh, Voice Settings di bottom sheet |

Setiap screen baru dicek minimal di 1440, 900, dan 393px.
