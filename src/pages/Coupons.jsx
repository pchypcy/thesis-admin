/**
 * Coupons.jsx — InGreen Admin v3
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Ticket, Plus, Tag, CheckCircle2, Search, Clock, Zap,
  Edit3, X, Save, AlertCircle, Trash2, ToggleLeft, ToggleRight,
  Loader2, RefreshCw, WifiOff, History, Store, Infinity as InfinityIcon,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const fmtNum = n => (!isNaN(n) && n !== null) ? Number(n).toLocaleString('th-TH') : '0';

const THEME_STYLES = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200/60'    },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/60'   },
  { bg: 'bg-rose-50',    text: 'text-rose-700',     border: 'border-rose-200/60'    },
];

async function apiCreate(body) {
  const res = await axios.post(`${API_BASE_URL}/api/admin/rewards`, body);
  if (!res.data.success) throw new Error(res.data.message || 'สร้างไม่สำเร็จ');
  return res.data.data;
}
async function apiUpdate(id, body) {
  const res = await axios.patch(`${API_BASE_URL}/api/admin/rewards/${id}`, body);
  if (!res.data.success) throw new Error(res.data.message || 'อัปเดตไม่สำเร็จ');
  return res.data.data;
}

// Soft Delete (PATCH)
async function apiSoftDelete(id) {
  const res = await axios.patch(`${API_BASE_URL}/api/admin/rewards/${id}`, { 
    isDeleted: true, 
    active: false 
  });
  if (!res.data.success) throw new Error(res.data.message || 'ลบไม่สำเร็จ');
  return res.data.data;
}

async function apiToggle(id, active) {
  const res = await axios.patch(`${API_BASE_URL}/api/admin/rewards/${id}/toggle`, { active });
  if (!res.data.success) throw new Error(res.data.message || 'เปลี่ยนสถานะไม่สำเร็จ');
  return res.data.data;
}

function HistoryModal({ campaign, onClose }) {
  const history = campaign.history || [];
  const fmtDate = d => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><History className="w-4 h-4" /> ประวัติการเปลี่ยนแปลง</h2>
            <p className="text-xs text-slate-400 mt-0.5">{campaign.shopName} — {campaign.discountValue}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
              <p className="text-slate-300 text-xs mt-1">ทุกครั้งที่แก้ไขโปรโมชั่น จะบันทึกประวัติไว้ที่นี่อัตโนมัติ</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">ปัจจุบัน</span>
                    <span className="font-semibold text-slate-800">{campaign.discountValue}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtNum(campaign.cost)} แต้ม · {campaign.active ? 'เปิดใช้งาน' : 'ปิดอยู่'}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-slate-200 ml-4 pl-6 space-y-3">
                {[...history].reverse().map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[30px] w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                      <span className="text-[9px] font-bold text-slate-400">{history.length - i}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-600 line-through">{h.discountValue}</span>
                      <span className="text-[10px] text-slate-400">{fmtNum(h.cost)} แต้ม</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(h.changedAt)}{h.changedBy ? ` · by ${h.changedBy}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">ปิด</button>
        </div>
      </div>
    </div>
  );
}

// ★ รับ props shops เพิ่มเข้ามาเพื่อดึงรายชื่อร้านจาก Database
function CampaignModal({ mode, initial, onClose, onSave, shops = [], initialMaxTotal }) {
  // ★ SPRINT 5: เพิ่ม maxTotal — จำนวนสิทธิ์รวมต่อแคมเปญ ('' = ไม่จำกัด, ตัวเลข = จำกัด)
  const empty = { shopId: '', shopName: '', discountValue: '', description: '', cost: '', active: true, maxTotal: '' };
  const [form, setForm]     = useState(() => {
    if (initial) return { ...initial, maxTotal: initialMaxTotal ?? '' };
    return empty;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const discountChanged = mode === 'edit' && initial && form.discountValue !== initial.discountValue;

  const handleShopSelect = (shopId) => {
    // ★ ค้นหาชื่อร้านจากข้อมูล Database จริงๆ
    const shop = shops.find(s => s.id === shopId);
    setForm(f => ({ ...f, shopId, shopName: shop?.name || '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.shopId && !form.shopName.trim()) e.shopId = 'กรุณาเลือกร้านค้า';
    if (!form.discountValue.trim()) e.discountValue = 'กรุณาระบุโปรโมชั่น';
    if (!form.cost || isNaN(form.cost) || Number(form.cost) <= 0) e.cost = 'กรุณาระบุแต้มที่ถูกต้อง (ตัวเลขมากกว่า 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    try {
      const payload = {
        shopId:       form.shopId || undefined,
        shopName:     form.shopName,
        discountValue: form.discountValue.trim(),
        description:  form.description,
        cost:         Number(form.cost),
        active:       form.active,
        // ★ SPRINT 5: ส่ง maxTotal — '' = ไม่จำกัด, ตัวเลข = จำกัด
        maxTotal:     form.maxTotal === '' ? null : Number(form.maxTotal),
      };
      const saved = mode === 'create' ? await apiCreate(payload) : await apiUpdate(initial._id, payload);
      onSave(saved, mode);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อกับ Backend';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">{mode === 'create' ? '➕ สร้างแคมเปญใหม่' : '✏️ แก้ไขแคมเปญ'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">ระบบจะบันทึกให้อัตโนมัติเมื่อกดยืนยัน</p>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {apiError && (
            <div className="p-3.5 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-200">
              <WifiOff className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">บันทึกไม่สำเร็จ</p>
                <p className="text-xs mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {discountChanged && (
            <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl flex items-start text-xs border border-amber-200">
              <History className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">โปรโมชั่นเปลี่ยน → Era ใหม่จะถูกสร้างใน Timeline</p>
                <p className="mt-0.5">ค่าเดิม "{initial.discountValue}" จะถูกบันทึกเข้า History อัตโนมัติ</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              ร้านค้าพาร์ทเนอร์ <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={form.shopId || ''}
                onChange={e => handleShopSelect(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all appearance-none ${errors.shopId ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`}
              >
                <option value="">— เลือกร้านค้า —</option>
                {/* ★ ลูปแสดงรายชื่อร้านค้าจาก Database */}
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
            {errors.shopId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.shopId}</p>}
            {form.shopId && !errors.shopId && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {form.shopName} · {form.shopId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              โปรโมชั่น / ส่วนลด <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ส่วนลด 15%, ฟรี 1 เมนู, ซื้อ 1 แถม 1"
              value={form.discountValue}
              onChange={e => setForm({ ...form, discountValue: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.discountValue ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`}
            />
            {errors.discountValue && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.discountValue}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">คำอธิบายแคมเปญ</label>
            <textarea rows={2} placeholder="เงื่อนไขการใช้งาน..." value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              แต้มที่ใช้แลก <span className="text-red-400">*</span>
            </label>
            <input type="number" min="1" placeholder="เช่น 300" value={form.cost}
              onChange={e => setForm({ ...form, cost: e.target.value })}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${errors.cost ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`}
            />
            {errors.cost && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cost}</p>}
          </div>

          {/* ★ SPRINT 5: จำนวนสิทธิ์รวม (CouponQuota.maxTotal) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Ticket className="w-3 h-3" />
              จำนวนสิทธิ์รวม
              <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400 ml-1">(เว้นว่าง = ไม่จำกัด)</span>
            </label>
            <div className="flex gap-2">
              <input type="number" min="1" placeholder="เช่น 50 = แลกได้ 50 ครั้งเท่านั้น"
                value={form.maxTotal}
                onChange={e => setForm({ ...form, maxTotal: e.target.value })}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all"
              />
              <button type="button" onClick={() => setForm({ ...form, maxTotal: '' })}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 ${form.maxTotal === '' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                <InfinityIcon className="w-3 h-3" /> ไม่จำกัด
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ระบบจะปฏิเสธการแลกเมื่อใช้สิทธิ์ครบ (atomic — กัน race condition)</p>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">สถานะแคมเปญ</p>
              <p className="text-xs text-slate-400 mt-0.5">{form.active ? 'เปิดใช้งาน — ลูกค้าแลกได้' : 'ปิด — ซ่อนจากลูกค้า'}</p>
            </div>
            <button onClick={() => setForm({ ...form, active: !form.active })}>
              {form.active ? <ToggleRight className="w-9 h-9 text-emerald-500" /> : <ToggleLeft className="w-9 h-9 text-slate-300" />}
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-slate-100 pt-4">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 active:scale-95 transition-all">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังบันทึก...</> : <><Save className="w-4 h-4" />{mode === 'create' ? 'สร้างแคมเปญ' : 'บันทึก'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ target, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const handle = async () => {
    setDeleting(true);
    try {
      await apiSoftDelete(target._id);
      onConfirm(target._id);
    } catch (err) {
      setApiError(err?.message || 'ลบไม่สำเร็จ กรุณาลองใหม่');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6">
        <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">ลบแคมเปญนี้?</h3>
        <p className="text-sm text-slate-400 text-center mb-2">
          <strong className="text-slate-700">"{target?.shopName} — {target?.discountValue}"</strong><br/>
          จะถูกซ่อนออกจากระบบ
        </p>
        {apiError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center mb-2">{apiError}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={deleting} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">ยกเลิก</button>
          <button onClick={handle} disabled={deleting}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังลบ...</> : 'ลบออก'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ tpl, index, onEdit, onDelete, onToggle, onHistory, toggling, transactions, quota }) {
  const theme    = THEME_STYLES[index % THEME_STYLES.length];
  const isActive = tpl.active !== false;
  const hasHistory = (tpl.history || []).length > 0;

  const actualUsedCount = (transactions || []).filter(txn => {
    if (txn.campaignId && tpl._id && String(txn.campaignId) === String(tpl._id)) {
      return true;
    }

    const isSameShop = (txn.merchantId === tpl.shopId) || (txn.shopId === tpl.shopId);
    
    if (isSameShop) {
      const cleanStr = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();

      const tplVal = cleanStr(tpl.discountValue);
      const tplRate = cleanStr(tpl.discountRate);
      
      const txnLabel = cleanStr(txn.campaignLabel);
      const txnRate = cleanStr(txn.discountRate) || cleanStr(txn.couponDiscount);

      if (tplVal && (txnLabel === tplVal || txnRate === tplVal)) return true;
      if (tplRate && (txnLabel === tplRate || txnRate === tplRate)) return true;
      
      if (tplVal && txnLabel && (txnLabel.includes(tplVal) || tplVal.includes(txnLabel))) return true;
      if (tplRate && txnRate && (txnRate.includes(tplRate) || tplRate.includes(txnRate))) return true;
    }
    
    return false;
  }).length;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden ${isActive ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
      <div className={`${theme.bg} p-5 border-b ${theme.border}`}>
        <div className="flex justify-between items-start mb-4">
          <span className={`bg-white ${theme.text} shadow-sm text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border ${theme.border}`}>
            <Tag className="w-3 h-3" /> {tpl.discountValue || 'ไม่ระบุโปรโมชั่น'}
          </span>
          <div className="flex items-center gap-1">
            {hasHistory && (
              <button onClick={() => onHistory(tpl)} title="ดูประวัติ"
                className="w-7 h-7 bg-white/60 hover:bg-amber-50 border border-white/50 hover:border-amber-200 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors">
                <History className="w-3 h-3" />
              </button>
            )}
            <button onClick={() => onToggle(tpl)} disabled={toggling === tpl._id}
              className="w-7 h-7 bg-white/60 hover:bg-white border border-white/50 rounded-full flex items-center justify-center transition-colors disabled:opacity-50" title={isActive ? 'ปิดแคมเปญ' : 'เปิดแคมเปญ'}>
              {toggling === tpl._id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                : isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button onClick={() => onEdit(tpl)} title="แก้ไข"
              className="w-7 h-7 bg-white/60 hover:bg-white border border-white/50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <Edit3 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(tpl)} title="ลบ"
              className="w-7 h-7 bg-white/60 hover:bg-red-50 border border-white/50 hover:border-red-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <h3 className="font-semibold text-slate-800 text-base">{tpl.shopName || 'ไม่ระบุร้านค้า'}</h3>
        {tpl.shopId && <p className="text-xs text-slate-400 font-mono mt-0.5">{tpl.shopId}</p>}
        {hasHistory && (
          <button onClick={() => onHistory(tpl)} className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 font-medium">
            <History className="w-3 h-3" /> มีประวัติ {tpl.history.length} ครั้ง
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed flex-1">{tpl.description || 'ไม่มีรายละเอียด'}</p>
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-400 text-xs flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" />แต้มที่ใช้แลก</span>
            <strong className="text-slate-800 text-sm">{fmtNum(tpl.cost)} แต้ม</strong>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400 text-xs flex items-center gap-1.5"><Ticket className="w-3 h-3 text-blue-400" />แลกแล้วทั้งหมด</span>
            <strong className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-0.5 rounded-md">{fmtNum(actualUsedCount)} ครั้ง</strong>
          </div>

          {/* ★ SPRINT 5: Quota / สิทธิ์คงเหลือ */}
          {quota ? (
            quota.maxTotal == null ? (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-400 text-xs flex items-center gap-1.5"><InfinityIcon className="w-3 h-3 text-emerald-500" />สิทธิ์รวม</span>
                <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-md">ไม่จำกัด</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Ticket className="w-3 h-3 text-emerald-500" />สิทธิ์คงเหลือ
                  </span>
                  <strong className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    quota.isFull
                      ? 'text-red-600 bg-red-50'
                      : quota.percent >= 80
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-emerald-600 bg-emerald-50'
                  }`}>
                    {quota.isFull ? 'หมดแล้ว' : `${fmtNum(quota.remaining)}/${fmtNum(quota.maxTotal)}`}
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      quota.isFull
                        ? 'bg-red-500'
                        : quota.percent >= 80
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, quota.percent)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">ใช้ไป {fmtNum(quota.usedTotal)} จาก {fmtNum(quota.maxTotal)} ({quota.percent}%)</p>
              </div>
            )
          ) : (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-slate-300" />สิทธิ์รวม</span>
              <span className="text-slate-400 text-xs">ยังไม่ตั้งค่า</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-slate-50 flex justify-between items-center">
        <span className={`flex items-center text-[11px] font-medium px-2 py-1 rounded-lg border ${isActive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />{isActive ? 'เปิดใช้งาน' : 'ปิดอยู่'}
        </span>
        <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />ไม่มีวันหมดอายุ
        </span>
      </div>
    </div>
  );
}

export default function Coupons({ showToast, data, refreshData }) {
  const [searchTerm, setSearchTerm]       = useState('');
  const [modal, setModal]                 = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [toggling, setToggling]           = useState(null);
  const [localCampaigns, setLocalCampaigns] = useState(null);
  // ★ SPRINT 5: quota state — fetch จาก /api/admin/quotas
  const [quotas, setQuotas] = useState([]);
  const [seedingQuotas, setSeedingQuotas] = useState(false);

  // โหลด quotas + reload เมื่อแคมเปญเปลี่ยน
  const loadQuotas = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/quotas`);
      if (res.data?.success) setQuotas(res.data.data || []);
    } catch (err) {
      console.error('load quotas error', err);
    }
  }, []);

  useEffect(() => { loadQuotas(); }, [loadQuotas]);

  // Map quota by rewardId เพื่อ lookup เร็วใน card
  const quotaByReward = useMemo(() => {
    const m = {};
    quotas.forEach(q => { m[String(q.rewardId)] = q; });
    return m;
  }, [quotas]);

  // ★ SPRINT 5: ปุ่ม seed quota (สำหรับ admin demo)
  const handleSeedQuotas = async () => {
    setSeedingQuotas(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/quotas/seed`);
      if (res.data?.success) {
        showToast(`สร้างสิทธิ์เริ่มต้นสำเร็จ: เพิ่มใหม่ ${res.data.created} (ข้าม ${res.data.skipped})`, 'success');
        loadQuotas();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'สร้างสิทธิ์ไม่สำเร็จ', 'error');
    } finally {
      setSeedingQuotas(false);
    }
  };

  const sourceCampaigns = Array.isArray(data?.rewards) ? data.rewards : [];
  const campaigns = localCampaigns !== null ? localCampaigns : sourceCampaigns;
  
  const activeCampaigns = campaigns.filter(c => !c.isDeleted);
  
  const filtered  = activeCampaigns.filter(t =>
    (t?.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t?.discountValue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t?.shopId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTransactions = useMemo(() => {
    if (!data?.shops || !Array.isArray(data.shops)) return [];
    let list = [];
    data.shops.forEach(shop => {
      if (Array.isArray(shop.transactions)) {
        list = list.concat(shop.transactions);
      }
    });
    return list;
  }, [data?.shops]);

  const handleSaved = useCallback((saved, mode) => {
    setLocalCampaigns(prev => {
      const base = prev ?? sourceCampaigns;
      return mode === 'create' ? [saved, ...base] : base.map(c => c._id === saved._id ? saved : c);
    });
    refreshData?.();
    loadQuotas(); // ★ SPRINT 5: refresh quota (อาจเปลี่ยน maxTotal)
    showToast(mode === 'create' ? `สร้างแคมเปญ "${saved.discountValue}" สำเร็จ ✓` : `อัปเดต "${saved.discountValue}" สำเร็จ ✓`, 'success');
    setModal(null);
  }, [sourceCampaigns, showToast, refreshData, loadQuotas]);

  const handleDeleted = useCallback((id) => {
    setLocalCampaigns(prev => {
      const base = prev ?? sourceCampaigns;
      return base.map(c => c._id === id ? { ...c, isDeleted: true, active: false } : c);
    });
    refreshData?.();
    showToast('ลบแคมเปญออกแล้ว', 'success');
    setDeleteTarget(null);
  }, [sourceCampaigns, showToast, refreshData]);

  const handleToggle = useCallback(async (tpl) => {
    const next = !tpl.active;
    setToggling(tpl._id);
    setLocalCampaigns(prev => (prev ?? sourceCampaigns).map(c => c._id === tpl._id ? { ...c, active: next } : c));
    try {
      const saved = await apiToggle(tpl._id, next);
      setLocalCampaigns(prev => (prev ?? sourceCampaigns).map(c => c._id === saved._id ? saved : c));
      refreshData?.();
      showToast(next ? `เปิด "${tpl.discountValue}" แล้ว ✓` : `ปิด "${tpl.discountValue}" แล้ว`, 'success');
    } catch (err) {
      setLocalCampaigns(prev => (prev ?? sourceCampaigns).map(c => c._id === tpl._id ? { ...c, active: tpl.active } : c));
      showToast(err?.message || 'เปลี่ยนสถานะล้มเหลว', 'error');
    } finally {
      setToggling(null);
    }
  }, [sourceCampaigns, showToast, refreshData]);

  const handleSync = () => {
    setLocalCampaigns(null);
    refreshData?.();
    showToast('ซิงค์ข้อมูลจาก MongoDB แล้ว ✓', 'success');
  };

  if (!data && localCampaigns === null) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูลแคมเปญ...</p>
      </div>
    );
  }

  return (
    <>
      {/* ★ ส่งข้อมูลร้านค้าจาก data.shops ไปให้ CampaignModal ด้วย */}
      {/* ★ SPRINT 5: ส่ง initialMaxTotal จาก quotaByReward[modal.data._id]?.maxTotal */}
      {modal && <CampaignModal
        mode={modal.mode}
        initial={modal.data}
        initialMaxTotal={modal.data?._id ? quotaByReward[String(modal.data._id)]?.maxTotal : undefined}
        onClose={() => setModal(null)}
        onSave={handleSaved}
        shops={data?.shops || []}
      />}
      {deleteTarget && <DeleteModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleted} />}
      {historyTarget && <HistoryModal campaign={historyTarget} onClose={() => setHistoryTarget(null)} />}

      <div className="space-y-5 font-sans max-w-7xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">คูปองและรางวัล</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              จัดการแคมเปญ — <span className="font-semibold text-slate-600">{activeCampaigns.length}</span> แคมเปญ
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-2.5">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="text" placeholder="ค้นหาแคมเปญ..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 shadow-sm transition-all"
              />
            </div>
            <button onClick={handleSync} title="ซิงค์จาก MongoDB"
              className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95">
              <RefreshCw className="w-4 h-4" />
            </button>
            {/* ★ SPRINT 5: ปุ่ม seed quotas (สำหรับ demo/init) */}
            <button onClick={handleSeedQuotas} disabled={seedingQuotas} title="สร้างสิทธิ์เริ่มต้นให้แคมเปญที่ยังไม่มี"
              className="h-11 px-3 bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
              {seedingQuotas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
              สร้างสิทธิ์เริ่มต้น
            </button>
            <button onClick={() => setModal({ mode: 'create' })}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /> สร้างแคมเปญ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-600">ไม่พบแคมเปญ</h3>
              <p className="text-sm mt-1 text-slate-400">{searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'กด "สร้างแคมเปญ" เพื่อเริ่มต้น'}</p>
            </div>
          ) : filtered.map((tpl, i) => (
            <CampaignCard key={tpl._id || i} tpl={tpl} index={i}
              onEdit={t => setModal({ mode: 'edit', data: t })}
              onDelete={setDeleteTarget}
              onToggle={handleToggle}
              onHistory={setHistoryTarget}
              toggling={toggling}
              transactions={allTransactions}
              quota={quotaByReward[String(tpl._id)]}  /* ★ SPRINT 5 */
            />
          ))}
        </div>
      </div>
    </>
  );
}