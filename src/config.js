// API base URL
//   - dev:        ปล่อยว่าง → ใช้ Vite proxy (/api → 127.0.0.1:5001) ใน vite.config.js
//   - production: ตั้ง VITE_API_BASE_URL ใน Vercel → ชี้ไป backend ที่ deploy (เช่น Render)
//
// ★ ห้าม hardcode localhost (มือถือ/เครื่องอื่นจะเข้าไม่ได้) — ใช้ env แทน
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
