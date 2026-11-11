import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' agar hasil build bisa dibuka dari sub-path mana pun
// (GitHub Pages, Netlify, Vercel, atau sekadar dibuka dari folder dist)
export default defineConfig({
  plugins: [react()],
  base: './',
})
