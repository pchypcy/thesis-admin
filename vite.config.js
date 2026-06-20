import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  // 🟢 เพิ่มตัวเชื่อม Backend (Proxy) เข้ามาตรงนี้ครับ
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001', // ชี้ไปที่ Backend ของคุณ
        changeOrigin: true,
        secure: false,
      }
    }
  }
})