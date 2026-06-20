import React, { useState } from 'react';
import axios from 'axios';
import { Search, Plus, Store, X, Save, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import ShopTable from '../components/ShopTable';
import { API_BASE_URL } from '../config';

function AddShopModal({ onClose, onSave }) {
  const [form, setForm] = useState({ id: '', name: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.id.trim()) e.id = 'กรุณาระบุรหัสร้านค้า';
    else if (!/^[a-zA-Z0-9_-]+$/.test(form.id)) e.id = 'ใช้ได้เฉพาะ a-z, 0-9, _ และ -';
    if (!form.name.trim()) e.name = 'กรุณาระบุชื่อร้านค้า';
    if (!form.password || form.password.length < 6) e.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // ★ ส่งรหัสผ่านไปให้ฟังก์ชันแม่ด้วย
    await onSave({ id: form.id.trim(), name: form.name.trim(), password: form.password });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white">🏪 เพิ่มร้านค้าพาร์ทเนอร์ใหม่</h2>
            <p className="text-xs text-emerald-200 mt-0.5">ตั้งค่าบัญชีร้านค้าและข้อมูลการเข้าสู่ระบบ</p>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">รหัสร้านค้า (Shop ID)</label>
            <input type="text" placeholder="เช่น shop_cafe_amazon" value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.id ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`} />
            {errors.id ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.id}</p>
              : <p className="text-[11px] text-slate-400 mt-1">ใช้เป็น Username ตอนล็อกอินหน้า Merchant (ใช้ภาษาอังกฤษ, ตัวเลข, _ หรือ - เท่านั้น)</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อร้านค้า</label>
            <input type="text" placeholder="เช่น Café Amazon สาขาสุขุมวิท" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`} />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">รหัสผ่านสำหรับเข้าสู่ระบบ</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ยืนยันรหัสผ่าน</label>
            <input type={showPw ? 'text' : 'password'} placeholder="กรอกรหัสผ่านอีกครั้ง" value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`} />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-70">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> เพิ่มร้านค้า</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shops({ data, openShopDetail, showToast, refreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const shopsList = data?.shops || [];
  const filteredShops = shopsList.filter(shop =>
    (shop.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ★ ยิง API ไปบันทึกลง Database จริงๆ
  const handleAddShop = async (newShop) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/shops`, newShop);
      if (res.data.success) {
        showToast(`เพิ่มร้านค้า "${newShop.name}" สำเร็จ ✓ ข้อมูลถูกบันทึกลงระบบแล้ว`, 'success');
        setShowAddModal(false);
        refreshData?.(); // ดึงข้อมูลจาก Backend ใหม่
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกร้านค้า', 'error');
    }
  };

  return (
    <>
      {showAddModal && <AddShopModal onClose={() => setShowAddModal(false)} onSave={handleAddShop} />}

      <div className="space-y-5 animate-fade-in font-sans pb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><Store className="w-6 h-6 text-slate-500" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">จัดการร้านค้าพาร์ทเนอร์</h2>
              <p className="text-xs text-slate-400 mt-0.5">ทั้งหมด <span className="font-semibold text-slate-600">{shopsList.length}</span> ร้านค้า{searchTerm && ` · แสดง ${filteredShops.length} รายการ`}</p>
            </div>
          </div>
          <div className="flex w-full lg:w-auto gap-2.5">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="text" placeholder="ค้นหาชื่อร้านหรือรหัสร้านค้า..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all" />
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /><span className="hidden lg:inline">เพิ่มร้านค้า</span>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <ShopTable shops={filteredShops} openShopDetail={openShopDetail} isDashboard={false} />
        </div>
      </div>
    </>
  );
}