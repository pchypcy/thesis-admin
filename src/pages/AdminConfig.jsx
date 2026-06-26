// pages/AdminConfig.jsx — InGreen Sprint 5
//
// Admin UI for Dynamic AppConfig
// - List configs grouped by category (health/vip/gamification/system)
// - Inline edit value (Number/String/Boolean auto-detect)
// - PATCH /api/config/:key — บันทึก DB ทันที, ระบบไม่ต้อง deploy ใหม่
// - แสดง isEditable: false → lock icon (เช่น INGREEN_FEE_PERCENT — ต้องแก้ผ่าน code review)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Settings, Heart, Crown, Trophy, Server, Save, X, Loader2,
  Edit3, Lock, AlertCircle, CheckCircle2, RefreshCw, Sparkles,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const CATEGORY_META = {
  health:       { label: 'สุขภาพ (WHO)',    icon: Heart,   color: 'rose'    },
  vip:          { label: 'VIP / Subscription', icon: Crown,   color: 'amber'   },
  gamification: { label: 'แต้ม / Gamification', icon: Trophy,  color: 'emerald' },
  system:       { label: 'ระบบ',              icon: Server,  color: 'blue'    },
};

const COLOR_CLASSES = {
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    iconBg: 'bg-rose-100'    },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   iconBg: 'bg-amber-100'   },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', iconBg: 'bg-emerald-100' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    iconBg: 'bg-blue-100'    },
};

function ConfigRow({ config, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(config.value));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Reset draft เมื่อ config เปลี่ยน (หลัง save success)
  useEffect(() => {
    setDraft(String(config.value));
    setEditing(false);
    setError('');
  }, [config.value]);

  const startEdit = () => {
    if (!config.isEditable) return;
    setDraft(String(config.value));
    setEditing(true);
    setError('');
  };

  const cancelEdit = () => {
    setDraft(String(config.value));
    setEditing(false);
    setError('');
  };

  const save = async () => {
    setError('');
    let parsed = draft.trim();
    // auto-parse type ตาม original value
    if (typeof config.value === 'number') {
      const n = Number(parsed);
      if (Number.isNaN(n)) { setError('กรุณาระบุตัวเลข'); return; }
      parsed = n;
    } else if (typeof config.value === 'boolean') {
      parsed = parsed === 'true';
    }
    setSaving(true);
    try {
      await onSave(config.key, parsed);
      setEditing(false);
    } catch (err) {
      setError(err?.message || 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{config.key}</code>
            {!config.isEditable && (
              <span title="แก้ไขผ่าน code review เท่านั้น" className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5" /> READ-ONLY
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-800">{config.label}</h4>
          {config.description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{config.description}</p>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 mt-2">
        {editing ? (
          <>
            <div className="flex items-center gap-2 flex-1">
              {typeof config.value === 'boolean' ? (
                <select value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                  className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/30">
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  type={typeof config.value === 'number' ? 'number' : 'text'}
                  step="any"
                  value={draft}
                  onChange={e => { setDraft(e.target.value); setError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancelEdit(); }}
                  autoFocus
                  disabled={saving}
                  className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
                />
              )}
              {config.unit && <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">{config.unit}</span>}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={cancelEdit} disabled={saving}
                className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 rounded-lg flex items-center justify-center transition-all disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
              <button onClick={save} disabled={saving}
                className="px-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'กำลังบันทึก' : 'บันทึก'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-800">
                {typeof config.value === 'boolean' ? (config.value ? 'true' : 'false') : String(config.value)}
              </span>
              {config.unit && <span className="text-xs text-slate-500 font-semibold">{config.unit}</span>}
            </div>
            <button onClick={startEdit} disabled={!config.isEditable}
              className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                config.isEditable
                  ? 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}>
              <Edit3 className="w-3 h-3" /> แก้ไข
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-semibold">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  );
}

export default function AdminConfig({ showToast }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch]   = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/config`);
      if (res.data?.success) setConfigs(res.data.data || []);
    } catch (err) {
      console.error('load configs error:', err);
      showToast?.('โหลด config ล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/config/seed`);
      if (res.data?.success) {
        showToast?.(`โหลดค่าเริ่มต้นสำเร็จ: ${res.data.message}`);
        await load();
      }
    } catch (err) {
      showToast?.(err?.response?.data?.message || 'โหลดค่าเริ่มต้นไม่สำเร็จ', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveConfig = async (key, value) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/config/${key}`, { value });
      if (res.data?.success) {
        showToast?.(`✅ อัปเดต ${key} = ${value}`);
        await load();
      } else {
        throw new Error(res.data?.message || 'ล้มเหลว');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'บันทึกล้มเหลว';
      showToast?.(msg, 'error');
      throw new Error(msg);
    }
  };

  // Filter + group
  const filtered = configs.filter(c => {
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = !search ||
      c.key.toLowerCase().includes(search.toLowerCase()) ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filtered.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  const categories = Object.keys(CATEGORY_META);
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = configs.filter(c => c.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ตั้งค่าระบบ</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            ปรับค่าการทำงานต่างๆ ของระบบได้จากที่นี่ บันทึกแล้วมีผลกับการใช้งานทันที
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={load} disabled={loading} title="โหลดใหม่"
            className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSeed} disabled={seeding}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            โหลดค่าเริ่มต้น
          </button>
        </div>
      </div>

      {/* Banner: how it works */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-emerald-900">เปลี่ยนค่าแล้วมีผลกับระบบทันที</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            ปรับค่าสำคัญต่างๆ ได้จากที่นี่ เช่น เกณฑ์น้ำตาลตามมาตรฐาน WHO, ราคาสมาชิก VIP, แต้มต่อการสแกน, ค่าธรรมเนียมร้านค้า
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Settings className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="text" placeholder="ค้นหา key, label, หรือ description..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 shadow-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}>
            ทั้งหมด ({configs.length})
          </button>
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            const colors = COLOR_CLASSES[meta.color];
            const isActive = activeCategory === cat;
            const Icon = meta.icon;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border} shadow-sm`
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {meta.label} ({categoryCounts[cat] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center text-slate-400">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-medium">กำลังโหลด config...</p>
        </div>
      ) : configs.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <Settings className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-600">ยังไม่มี config ในระบบ</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">กดปุ่ม "โหลดค่าเริ่มต้น" เพื่อเพิ่มค่าเริ่มต้นทั้งหมด</p>
          <button onClick={handleSeed} disabled={seeding}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Seed Default
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-sm text-slate-500 font-medium">ไม่พบ config ที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.filter(cat => grouped[cat]?.length).map(cat => {
            const meta = CATEGORY_META[cat];
            const colors = COLOR_CLASSES[meta.color];
            const Icon = meta.icon;
            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 ${colors.iconBg} ${colors.text} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-black text-slate-800">{meta.label}</h2>
                  <span className={`text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border} px-2 py-0.5 rounded-md uppercase tracking-wider`}>
                    {grouped[cat].length} ค่า
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grouped[cat].map(config => (
                    <ConfigRow key={config.key} config={config} onSave={handleSaveConfig} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
