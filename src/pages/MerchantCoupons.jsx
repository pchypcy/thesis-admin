import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Ticket, CheckCircle2, Search, TrendingUp, Users, Tag, Infinity as InfinityIcon, AlertCircle, Loader2, Sparkles, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

const iconColorMap = {
  emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
  blue:    'bg-blue-50 text-blue-500 border-blue-100',
  amber:   'bg-amber-50 text-amber-500 border-amber-100',
  rose:    'bg-rose-50 text-rose-500 border-rose-100',
};

export default function MerchantCoupons({ data }) {
  const [search, setSearch] = useState('');
  const shopId = localStorage.getItem('merchantId') || '';
  const shopName = localStorage.getItem('merchantName') || '';
  const shops = data?.shops || [];
  const shop = shops.find(s => s.id === shopId);
  const transactions = shop?.transactions || [];

  // ★ SPRINT 5: ดึง rewards + quota ของร้านนี้
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setLoadingCamps(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/rewards`);
      const all = res.data || [];
      // กรองเฉพาะของร้านนี้ (match shopId หรือ shopName)
      const target = shopName.toLowerCase().trim();
      const mine = all.filter(r => {
        if (shopId && r.shopId === shopId) return true;
        const rName = (r.shopName || '').toLowerCase().trim();
        return target && (rName === target || rName.includes(target) || target.includes(rName));
      });
      setMyCampaigns(mine);
    } catch (err) {
      console.error('load merchant campaigns error:', err);
    } finally {
      setLoadingCamps(false);
    }
  }, [shopId, shopName]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const couponMap = {};
  transactions.forEach(txn => {
    const code = txn.couponCode || 'N/A';
    if (!couponMap[code]) couponMap[code] = { code, count: 0, totalAmount: 0, lastUsed: null };
    couponMap[code].count++;
    couponMap[code].totalAmount += txn.totalAmount || 0;
    const d = new Date(txn.redeemedAt || txn.createdAt);
    if (!couponMap[code].lastUsed || d > couponMap[code].lastUsed) couponMap[code].lastUsed = d;
  });

  const coupons = Object.values(couponMap).sort((a, b) => b.count - a.count);
  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  const fmtNum = (n) => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '—';

  // ★ SPRINT 5: KPI quota — รวมจากทุกแคมเปญที่กำลังเปิด
  const activeCamps = myCampaigns.filter(c => c.active !== false);
  let totalIssued = 0;
  let totalUsed = 0;
  let hasUnlimited = false;
  activeCamps.forEach(c => {
    if (!c.quota || c.quota.maxTotal == null) hasUnlimited = true;
    else {
      totalIssued += c.quota.maxTotal;
      totalUsed   += c.quota.usedTotal || 0;
    }
  });
  const totalRemaining = hasUnlimited ? '∞' : Math.max(0, totalIssued - totalUsed);

  const kpis = [
    { label: 'แคมเปญที่กำลังเปิด', value: activeCamps.length + ' แคมเปญ', icon: Sparkles, color: 'amber' },
    { label: 'สิทธิ์คงเหลือรวม',    value: String(totalRemaining) + (hasUnlimited ? '' : ` / ${totalIssued}`), icon: Ticket, color: 'emerald' },
    { label: 'ลูกค้าที่ใช้คูปอง',    value: new Set(transactions.map(t => t.username)).size + ' คน', icon: Users, color: 'blue' },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">คูปองของร้าน</h1>
            <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border border-amber-100">Merchant</span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">สรุปคูปองที่ลูกค้าของคุณเคยนำมาใช้</p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหารหัสคูปอง..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all shadow-sm" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const IconK = kpi.icon;
          return (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconColorMap[kpi.color]}`}>
              <IconK className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
              <p className="text-lg font-bold text-slate-800">{kpi.value}</p>
            </div>
          </div>
          );
        })}
      </div>

      {/* ★ SPRINT 5: แคมเปญของฉัน (rewards + quota) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">แคมเปญของร้าน</h2>
              <p className="text-xs text-slate-400 mt-0.5">โปรโมชั่นที่ลูกค้ามองเห็นและแลกได้ — แอดมินตั้งสิทธิ์ให้</p>
            </div>
          </div>
          <button onClick={loadCampaigns} disabled={loadingCamps} title="โหลดใหม่"
            className="w-8 h-8 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg flex items-center justify-center transition-all disabled:opacity-50">
            <Loader2 className={`w-3.5 h-3.5 ${loadingCamps ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingCamps ? (
          <div className="py-12 flex flex-col items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-amber-500" />
            <p className="text-xs font-medium">กำลังโหลดแคมเปญ...</p>
          </div>
        ) : myCampaigns.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Ticket className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-semibold">ยังไม่มีแคมเปญในร้านนี้</p>
            <p className="text-xs mt-1">ติดต่อทีมแอดมิน InGreen เพื่อสร้างแคมเปญใหม่</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {myCampaigns.map((c, i) => {
              const q = c.quota;
              const hasQuota = q && q.maxTotal != null;
              const percent  = hasQuota ? Math.min(100, Math.round((q.usedTotal / q.maxTotal) * 100)) : 0;
              const remaining = hasQuota ? q.remaining : null;
              const isFull   = hasQuota && q.isFull;
              const isLow    = hasQuota && remaining > 0 && percent >= 80;
              const isActive = c.active !== false;
              return (
                <div key={c._id || i} className={`px-6 py-4 flex items-center gap-4 ${isActive ? '' : 'opacity-60'}`}>
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                    {c.image ? (
                      <img src={c.image} alt={c.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Ticket className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {c.discountValue}
                      </span>
                      {!isActive && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">ปิดอยู่</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">{c.description || '—'}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-slate-500 font-semibold">{c.cost} แต้ม</span>
                    </div>
                  </div>

                  {/* Quota bar */}
                  <div className="w-44 shrink-0">
                    {hasQuota ? (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">สิทธิ์คงเหลือ</span>
                          <span className={`text-xs font-bold ${
                            isFull ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {isFull ? 'หมดแล้ว' : `${remaining}/${q.maxTotal}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${
                            isFull ? 'bg-red-500'
                              : isLow ? 'bg-amber-500'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          }`} style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">ใช้ไป {q.usedTotal} ({percent}%)</p>
                      </>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                        <InfinityIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">ไม่จำกัดสิทธิ์</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note: ถ้าอยากเพิ่ม/แก้แคมเปญ ต้องผ่านแอดมิน */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>การสร้าง/แก้ไขแคมเปญและการตั้งสิทธิ์ ทำผ่านทีม InGreen Admin เท่านั้น</span>
        </div>
      </div>

      {/* Coupon list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
            <Ticket className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">ประวัติคูปองที่ลูกค้านำมาใช้</h2>
            <p className="text-xs text-slate-400 mt-0.5">เรียงตามจำนวนการใช้งาน</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">รหัสคูปอง</th>
                <th className="px-6 py-3.5 text-center">จำนวนครั้งที่ใช้</th>
                <th className="px-6 py-3.5 text-right">ยอดรวม (฿)</th>
                <th className="px-6 py-3.5">ใช้ล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filtered.length > 0 ? filtered.map((c, i) => (
                <tr key={c.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 text-slate-300 text-xs font-bold">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-sm tracking-wider">{c.code}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> {c.count} ครั้ง
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-700">฿ {fmtNum(c.totalAmount)}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-medium">{fmtDate(c.lastUsed)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="py-16 text-center">
                  <Ticket className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium text-sm">ยังไม่มีคูปองที่ถูกใช้งาน</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}