import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  resolve: {
    alias: {
      // ✅ FIX: Stub out Node.js "stream" for browser
      stream: 'stream-browserify',
    },
  },
})
