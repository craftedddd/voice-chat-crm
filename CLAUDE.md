# Voice Chat CRM

Vite + React. Live di GitHub Pages, deploy otomatis lewat GitHub Actions saat push ke `main`.

## Wajib sebelum mendesain atau mengubah UI

1. Baca [DESIGN.md](DESIGN.md). Kode (`src/styles.css`, blok `:root`) adalah sumber kebenaran design system.
2. Pakai hanya token semantik. Jangan menulis hex, rgba, ukuran font, weight, radius, shadow, atau durasi secara langsung.
3. Butuh nilai yang belum ada? Tambahkan token di `:root` dan catat di `DESIGN.md` dalam perubahan yang sama. Sebutkan penambahan itu ke user.
4. Pakai ulang komponen yang sudah ada (daftar di `DESIGN.md` bagian 3) sebelum membuat yang baru.
5. Spacing komponen baru memakai skala `--s-*`.
6. Cek tampilan di 1440, 900, dan 393px sebelum melaporkan selesai.

## Cara kerja dengan user

- User sering minta diskusi dulu ("jangan dieksekusi dulu"). Tunggu "gas" sebelum implementasi.
- Jangan push sebelum user bilang "push".
