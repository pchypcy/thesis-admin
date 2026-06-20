// pages/AdminAllergenGroups.jsx — InGreen Sprint 6
//
// Admin CRUD สำหรับ "กลุ่มอาหารแพ้" (AllergenGroup)
//   - List: เรียง builtin ก่อน + filter active/inactive + search
//   - Create: id + labels + severity + keywords (เพิ่ม-ลบเป็น chip)
//   - Edit: inline modal
//   - Soft delete (builtin) / hard delete (custom)
//   - Seed default จาก hardcoded ALLERGEN_DB (idempotent)
//
// ★ จำกัดสิทธิ์: admin only — App.jsx จะ render หน้านี้เมื่อ userRole === 'admin' เท่านั้น

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert, Plus, X, Save, Loader2, Trash2, Edit3, Search,
  AlertCircle, CheckCircle2, RefreshCw, Sparkles, Lock, EyeOff, Eye,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const SEVERITY_OPTIONS = [
  { key: 'critical', label: 'Critical', color: 'bg-red-700 text-white',     dot: 'bg-red-700' },
  { key: 'high',     label: 'High',     color: 'bg-red-500 text-white',     dot: 'bg-red-500' },
  { key: 'medium',   label: 'Medium',   color: 'bg-orange-500 text-white',  dot: 'bg-orange-500' },
  { key: 'low',      label: 'Low',      color: 'bg-yellow-500 text-white',  dot: 'bg-yellow-500' },
];

function severityBadge(sev) {
  const opt = SEVERITY_OPTIONS.find(s => s.key === sev) || SEVERITY_OPTIONS[2];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${opt.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {opt.label}
    </span>
  );
}

// ── Editor Modal ─────────────────────────────────────────────────────────────
function GroupEditor({ group, onClose, onSaved, showToast }) {
  const isNew = !group;
  const [form, setForm] = useState({
    id: group?.id || '',
    labelTH: group?.labelTH || '',
    labelEN: group?.labelEN || '',
    icon: group?.icon || 'mdi:alert-circle',
    severity_default: group?.severity_default || 'medium',
    crossContaminationWarning: !!group?.crossContaminationWarning,
    isActive: group?.isActive !== false,
  });
  const [keywords, setKeywords] = useState(group?.keywords || []);
  const [kwDraft, setKwDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addKeyword = () => {
    const v = kwDraft.trim();
    if (!v) return;
    if (keywords.includes(v)) { setKwDraft(''); return; }
    setKeywords([...keywords, v]);
    setKwDraft('');
  };

  const removeKeyword = (kw) => setKeywords(keywords.filter(k => k !== kw));

  const handleSave = async () => {
    setError('');
    if (!form.labelTH.trim() || !form.labelEN.trim()) {
      setError('กรุณาระบุ label ทั้งภาษาไทยและอังกฤษ');
      return;
    }
    if (isNew && !/^[A-Za-z][A-Za-z0-9_]{1,31}$/.test(form.id)) {
      setError('id ต้องเริ่มด้วยตัวอักษร, ความยาว 2–32 ตัว, ใช้ตัวอักษร/ตัวเลข/ขีดล่างเท่านั้น');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, keywords };
      const res = isNew
        ? await axios.post(`${API_BASE_URL}/api/admin/allergen-groups`, payload)
        : await axios.patch(`${API_BASE_URL}/api/admin/allergen-groups/${group.id}`, payload);
      if (res.data?.success) {
        showToast?.(isNew ? '✅ สร้างกลุ่มสำเร็จ' : '✅ บันทึกการเปลี่ยนแปลงแล้ว');
        onSaved?.();
        onClose();
      } else {
        setError(res.data?.message || 'บันทึกล้มเหลว');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {isNew ? 'เพิ่มกลุ่มอาหารแพ้ใหม่' : `แก้ไข: ${form.labelTH}`}
              </h3>
              <p className="text-rose-100 text-xs mt-0.5">
                {isNew ? 'กลุ่มที่สร้างจะมีให้ user เลือกได้ทันที' : (group.isBuiltin ? 'Built-in (EU 14) — ลบถาวรไม่ได้' : 'Custom group')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-lg flex items-center justify-center transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
          {/* id */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              ID (PascalCase) {!isNew && <span className="ml-2 text-amber-600 font-semibold normal-case">เปลี่ยน id ไม่ได้หลังสร้างแล้ว</span>}
            </label>
            <input
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              disabled={!isNew}
              placeholder="เช่น Milk, Peanuts, MyCustomGroup"
              className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          {/* labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Label (TH)</label>
              <input
                value={form.labelTH}
                onChange={e => setForm({ ...form, labelTH: e.target.value })}
                placeholder="ชื่อภาษาไทย"
                className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Label (EN)</label>
              <input
                value={form.labelEN}
                onChange={e => setForm({ ...form, labelEN: e.target.value })}
                placeholder="English label"
                className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* icon + severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Iconify icon name</label>
              <input
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="เช่น ph:cow, mdi:peanut"
                className="mt-1.5 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Base risk (Layer 1)</label>
              <div className="mt-1.5 flex gap-1.5">
                {SEVERITY_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setForm({ ...form, severity_default: opt.key })}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                      form.severity_default === opt.key
                        ? `${opt.color} border-transparent`
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* keywords */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              Keywords (ใช้ตรวจส่วนผสม)
              <span className="font-medium normal-case text-slate-400">{keywords.length} คำ</span>
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={kwDraft}
                onChange={e => setKwDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="พิมพ์แล้วกด Enter (เช่น milk, นม, lactose)"
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button onClick={addKeyword}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 transition-all">
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="mt-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-wrap gap-1.5">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="ml-0.5 text-slate-300 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* flags */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2.5 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg p-3">
              <input type="checkbox"
                checked={form.crossContaminationWarning}
                onChange={e => setForm({ ...form, crossContaminationWarning: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-amber-500" />
              <div>
                <div className="text-sm font-bold text-amber-900">เตือน Cross-contamination</div>
                <div className="text-xs text-amber-700 mt-0.5">แจ้ง "อาจมีสารผสมแฝง" — ใช้กับ allergen ที่ปนเปื้อนได้ในไลน์ผลิต</div>
              </div>
            </label>
            {!isNew && (
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-3">
                <input type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-emerald-500" />
                <div>
                  <div className="text-sm font-bold text-slate-700">เปิดใช้งาน (Active)</div>
                  <div className="text-xs text-slate-500 mt-0.5">ถ้าปิด → user จะไม่เห็นในรายการเลือก allergen</div>
                </div>
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'สร้างกลุ่ม' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminAllergenGroups({ showToast, userRole }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);   // group object or undefined
  const [creating, setCreating] = useState(false);

  // ★ Admin guard — ถ้าไม่ใช่ admin → block
  if (userRole && userRole !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700">ต้องเป็น Admin เท่านั้น</h3>
        <p className="text-sm text-slate-500 mt-1">หน้านี้เปิดเฉพาะผู้ดูแลระบบ</p>
      </div>
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/allergen-groups`, {
        params: { includeInactive: 'true' },
      });
      if (res.data?.success) setGroups(res.data.data || []);
    } catch (err) {
      console.error('load allergen-groups error:', err);
      showToast?.('โหลดกลุ่มอาหารแพ้ล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    if (!window.confirm('Seed default จาก EU 14 list? (idempotent — ไม่ทับของที่แก้แล้ว)')) return;
    setSeeding(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/allergen-groups/seed`);
      if (res.data?.success) {
        showToast?.(res.data.message || 'Seed สำเร็จ');
        await load();
      }
    } catch (err) {
      showToast?.(err?.response?.data?.message || 'Seed ล้มเหลว', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (group) => {
    const msg = group.isBuiltin
      ? `ปิดใช้งาน "${group.labelTH}"? (built-in ลบถาวรไม่ได้ จะ set isActive=false)`
      : `ลบ "${group.labelTH}" ถาวร?`;
    if (!window.confirm(msg)) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/allergen-groups/${group.id}`);
      if (res.data?.success) {
        showToast?.(res.data.message || 'ดำเนินการสำเร็จ');
        await load();
      }
    } catch (err) {
      showToast?.(err?.response?.data?.message || 'ลบล้มเหลว', 'error');
    }
  };

  const filtered = groups.filter(g => {
    if (!showInactive && !g.isActive) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return g.id.toLowerCase().includes(s)
      || g.labelTH.toLowerCase().includes(s)
      || g.labelEN.toLowerCase().includes(s)
      || (g.keywords || []).some(k => k.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">กลุ่มอาหารแพ้ (Allergen Groups)</h1>
            <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border border-rose-100">Sprint 6</span>
          </div>
          <p className="text-sm text-slate-400">
            จัดการรายการสารก่อภูมิแพ้ที่ user เลือกได้ใน Allergy Profile — แก้แล้วผลทันที (ไม่ต้อง deploy)
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={load} disabled={loading} title="โหลดใหม่"
            className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSeed} disabled={seeding}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Seed EU 14
          </button>
          <button onClick={() => setCreating(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" /> เพิ่มกลุ่ม
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" placeholder="ค้นหา id, label, หรือ keyword..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-300/20 focus:border-rose-400 shadow-sm" />
        </div>
        <button onClick={() => setShowInactive(v => !v)}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            showInactive
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
          }`}>
          {showInactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showInactive ? 'แสดงทั้งหมด' : 'ซ่อน inactive'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-3" />
          <p className="text-sm font-medium">กำลังโหลด...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-600">ยังไม่มีกลุ่มอาหารแพ้ในระบบ</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">กด "Seed EU 14" เพื่อเพิ่มกลุ่มมาตรฐาน 14 ชนิด</p>
          <button onClick={handleSeed} disabled={seeding}
            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Seed EU 14
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-sm text-slate-500 font-medium">ไม่พบกลุ่มที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(g => (
            <div key={g.id} className={`bg-white border rounded-xl p-4 transition-all ${
              g.isActive ? 'border-slate-200 hover:border-rose-200 hover:shadow-md' : 'border-slate-100 bg-slate-50/60 opacity-75'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{g.id}</code>
                    {severityBadge(g.severity_default)}
                    {g.isBuiltin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Built-in
                      </span>
                    )}
                    {!g.isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        <EyeOff className="w-2.5 h-2.5" /> Inactive
                      </span>
                    )}
                    {g.crossContaminationWarning && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Cross-contam
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">{g.labelTH}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{g.labelEN}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(g)}
                    className="w-8 h-8 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-lg flex items-center justify-center transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(g)}
                    title={g.isBuiltin ? 'ปิดใช้งาน (ลบถาวรไม่ได้)' : 'ลบถาวร'}
                    className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-lg flex items-center justify-center transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(g.keywords || []).length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 flex flex-wrap gap-1">
                  {(g.keywords || []).slice(0, 8).map(kw => (
                    <span key={kw} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                  {g.keywords.length > 8 && (
                    <span className="text-[10px] font-bold text-slate-400 px-1">+{g.keywords.length - 8}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {creating && (
        <GroupEditor group={null} onClose={() => setCreating(false)} onSaved={load} showToast={showToast} />
      )}
      {editing && (
        <GroupEditor group={editing} onClose={() => setEditing(null)} onSaved={load} showToast={showToast} />
      )}
    </div>
  );
}
