import React, { useState } from 'react';
import {
  GitBranch, ArrowRight, CheckCircle2, Info, ChevronDown, ChevronUp,
  Clock, AlertTriangle, ShieldCheck, TrendingDown, Banknote, Tag,
  Megaphone, History, CalendarDays, Store
} from 'lucide-react';

function safeDate(txn) {
  const raw = txn?.redeemedAt || txn?.createdAt;
  if (!raw) return new Date();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ★ ลอจิกใหม่: สร้าง Era จากประวัติ "การแก้ไขแคมเปญ" ตรงๆ 
// จะดึงชื่อจากช่อง "โปรโมชั่น / ส่วนลด" มาโชว์เป๊ะๆ ไม่มีคำว่าโปรโมชั่นปกติ
function buildEras(transactions = [], campaigns = []) {
  const validTxns = transactions.filter(t => t != null).sort((a, b) => safeDate(a) - safeDate(b));
  
  // ดึงแคมเปญล่าสุดของร้านที่เปิดใช้งานอยู่
  const activeCampaign = campaigns.find(c => c.active) || campaigns[campaigns.length - 1];

  if (!activeCampaign) return []; // ถ้าไม่เคยมีแคมเปญเลย จะไม่แสดง Timeline

  const eras = [];
  const history = activeCampaign.history || [];
  let startTime = new Date(0); // ครอบคลุมอดีตทั้งหมดไว้ที่ Era 1

  // 1. สร้าง Era 1, 2, ... จากประวัติที่มีการกด "แก้ไข"
  history.forEach((h, index) => {
    eras.push({
      rate: h.discountValue,          // ★ ดึงจากช่อง "โปรโมชั่น / ส่วนลด" ตรงๆ
      campaignLabel: h.discountValue, 
      startDate: startTime,
      endDate: new Date(h.changedAt),
      transactions: [],
      previousRate: index > 0 ? history[index-1].discountValue : null,
      isCurrent: false
    });
    startTime = new Date(h.changedAt); // ขยับเวลาเริ่มต้นของ Era ถัดไป
  });

  // 2. สร้าง Era ปัจจุบัน (ล่าสุด)
  eras.push({
    rate: activeCampaign.discountValue,          // ★ ดึงจากแคมเปญปัจจุบัน
    campaignLabel: activeCampaign.discountValue, 
    startDate: startTime,
    endDate: new Date(8640000000000000), // อนาคตไกลๆ (รอรับรายการใหม่)
    transactions: [],
    previousRate: history.length > 0 ? history[history.length - 1].discountValue : null,
    isCurrent: true
  });

  // 3. จับ Transaction ยัดลงกล่อง Era ตาม "เวลาที่ลูกค้าสแกนจริง"
  validTxns.forEach(txn => {
    const tDate = safeDate(txn);
    let targetEra = eras.find(e => tDate >= e.startDate && tDate <= e.endDate);
    if (!targetEra) targetEra = eras[eras.length - 1]; // กันเหนียว

    // เช็คว่าสแกนตอนที่มีการเปลี่ยนโปรหรือยัง (Flow Change)
    let prevLabel = txn.previousDiscountRate || null;
    if (prevLabel) {
       const matched = campaigns.find(c => String(c.discountRate) === String(prevLabel) || String(c.discountValue) === String(prevLabel));
       if (matched) prevLabel = matched.discountValue;
       else {
         const hMatch = history.find(h => String(h.discountRate) === String(prevLabel) || String(h.discountValue) === String(prevLabel));
         if (hMatch) prevLabel = hMatch.discountValue;
       }
    }

    // บังคับใช้ชื่อโปรโมชั่นตาม Era นั้นๆ เสมอ
    const usedLabel = targetEra.campaignLabel; 
    const isFlowChange = !!(prevLabel && String(prevLabel) !== String(usedLabel));

    targetEra.transactions.push({
      ...txn,
      _isFlowChange: isFlowChange,
      _prevRate: prevLabel,
      _usedLabel: usedLabel
    });
  });

  // คืนค่าโดยเรียงให้ ปัจจุบัน (Era ล่าสุด) อยู่ด้านบนเสมอ
  return eras.reverse(); 
}

function getCurrentCampaign(campaigns = []) {
  if (!campaigns.length) return null;
  const active = campaigns
    .filter(c => c.active)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  return active[0] || null;
}

function RateChangeBadge({ prevRate, currRate }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold px-2 py-0.5 rounded-md">
        <TrendingDown className="w-3 h-3" />
        {prevRate} (เดิม)
      </span>
      <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
        <GitBranch className="w-3 h-3" />
        {currRate} (ใช้จริง)
      </span>
    </div>
  );
}

function CampaignBanner({ campaigns, isAdmin }) {
  const [showHistory, setShowHistory] = useState(false);
  if (!campaigns || campaigns.length === 0) return null;

  const current = getCurrentCampaign(campaigns);
  const allHistory = [];

  campaigns.forEach(c => {
    if (!c.active) {
      allHistory.push({ label: c.discountValue, rate: c.discountRate, date: c.updatedAt || c.createdAt, source: 'campaign_inactive' });
    }
    (c.history || []).forEach(h => {
      allHistory.push({ label: h.discountValue, rate: h.discountRate, date: h.changedAt, source: 'history', changedBy: h.changedBy });
    });
  });

  allHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '—';

  return (
    <div className="rounded-2xl border-2 border-emerald-300 overflow-hidden mb-4 shadow-sm">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200 shrink-0 mt-0.5 shadow-inner">
            <Megaphone className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                โปรโมชั่นปัจจุบัน
              </span>
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            {current ? (
              <>
                <p className="text-2xl font-black text-slate-800 mt-1.5 tracking-tight">
                  {current.discountValue}
                </p>
                {current.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{current.description}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-1">ไม่มีแคมเปญที่เปิดใช้งานอยู่</p>
            )}
          </div>
        </div>

        {allHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(s => !s)}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <History className="w-3.5 h-3.5" />
            ประวัติการแก้ไข {allHistory.length} ครั้ง
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showHistory && allHistory.length > 0 && (
        <div className="border-t border-emerald-200 bg-white divide-y divide-slate-50 animate-fade-in">
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <History className="w-3 h-3" /> ประวัติการเปลี่ยนแปลงแคมเปญ (Timeline Era)
            </p>
          </div>
          {allHistory.map((h, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-slate-400">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-600 line-through text-sm">{h.label || '?'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmtDate(h.date)}
                  {h.changedBy && ` · แก้ไขโดย ${h.changedBy}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EraCard({ era, eraIndex, totalEras, isAdmin, fmtNum, fmtDate }) {
  const [expanded, setExpanded] = useState(eraIndex === 0);

  const txns = era.transactions;
  const totalSales = txns.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const totalFee   = txns.reduce((s, t) => s + (t.inGreenFee || 0), 0);
  const netAmount  = totalSales - totalFee;
  const flowChangeTxns = txns.filter(t => t._isFlowChange);
  const isCurrentEra = era.isCurrent;

  const eraColors = [
    { border: 'border-emerald-300', bg: 'bg-emerald-50',    badge: 'bg-emerald-500', text: 'text-emerald-700', badgeText: 'ปัจจุบัน' },
    { border: 'border-blue-300',    bg: 'bg-blue-50/60',    badge: 'bg-blue-500',    text: 'text-blue-700',    badgeText: 'ก่อนหน้า' },
    { border: 'border-slate-300',   bg: 'bg-slate-50',      badge: 'bg-slate-500',   text: 'text-slate-600',   badgeText: 'อดีต'  },
  ];
  const color = eraColors[Math.min(eraIndex, 2)];

  return (
    <div className={`rounded-2xl border-2 ${color.border} overflow-hidden shadow-sm transition-all duration-300`}>
      <div className={`${color.bg} px-5 py-4 cursor-pointer hover:opacity-90 transition-opacity`} onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`${color.badge} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm`}>
              Era {totalEras - eraIndex}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${isCurrentEra ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}>
              {isCurrentEra ? 'ปัจจุบัน' : color.badgeText}
            </span>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-sm font-black text-slate-800">{era.campaignLabel}</span>
              </div>
            </div>

            {era.previousRate && (
              <div className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-xl px-3 py-1 shadow-sm">
                <span className="text-[10px] text-slate-400 font-medium">เปลี่ยนมาจาก</span>
                <span className="text-sm font-bold text-red-500 line-through">{era.previousRate}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">{txns.length} รายการ</p>
              <p className="text-sm font-bold text-slate-700">฿ {fmtNum(totalSales)}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm ${expanded ? 'rotate-180' : ''} transition-transform`}>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in bg-white">
          <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50">
            <div className="px-5 py-4 border-r border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ยอดขายรวม</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">฿ {fmtNum(totalSales)}</p>
            </div>
            <div className="px-5 py-4 border-r border-slate-100">
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">หัก GP 5%</p>
              <p className="text-lg font-black text-red-500 mt-0.5">- ฿ {fmtNum(totalFee)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">สุทธิ (Net)</p>
              <p className="text-lg font-black text-emerald-600 mt-0.5">฿ {fmtNum(netAmount)}</p>
            </div>
          </div>

          {flowChangeTxns.length > 0 && (
            <div className="mx-4 my-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                   <Info className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    พบ {flowChangeTxns.length} รายการ — สแกนในช่วงที่โปรโมชั่นเปลี่ยนไปแล้ว
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    ระบบจะใช้โปรโมชั่น <strong className="bg-amber-100 px-1 rounded">{era.campaignLabel}</strong> ตาม Era นี้โดยอัตโนมัติ
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50">
            {txns.length > 0 ? txns.map((txn, i) => {
              const amount = txn.totalAmount || 0;
              const fee    = txn.inGreenFee || 0;
              const net    = amount - fee;
              const dateStr = txn.redeemedAt || txn.createdAt;
              
              return (
                <div
                  key={txn._id || i}
                  className={`px-5 py-4 ${txn._isFlowChange ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'} transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {txn._isFlowChange && (
                          <span className="flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 shadow-sm">
                            <GitBranch className="w-3 h-3" /> Flow Change
                          </span>
                        )}
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-sm tracking-wider">
                          {txn.couponCode || 'N/A'}
                        </span>
                        <span className="text-sm font-medium text-slate-600">{txn.username || 'Unknown'}</span>
                        <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          {dateStr ? new Date(dateStr).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        {txn._isFlowChange ? (
                          <RateChangeBadge prevRate={txn._prevRate} currRate={txn._usedLabel} />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            โปรโมชั่นที่ใช้: <strong className="text-slate-700">{txn._usedLabel}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-medium">ยอดชำระ</p>
                        <p className="text-sm font-bold text-slate-700">฿{fmtNum(amount)}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div className="text-right">
                        <p className="text-[10px] text-red-400 font-medium">GP 5%</p>
                        <p className="text-sm font-bold text-red-500">-฿{fmtNum(fee)}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 min-w-[80px] text-right">
                        <p className="text-[10px] text-emerald-600 font-bold">สุทธิ</p>
                        <p className="text-sm font-black text-emerald-700">฿{fmtNum(net)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center text-slate-400 text-sm">ยังไม่มีรายการสแกนใน Era นี้</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CouponRateTimeline({ transactions, campaigns = [], isAdmin = false, shopName = '' }) {
  const fmtNum  = n => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = d => {
    if (!d) return '—';
    const parsed = d instanceof Date ? d : new Date(d);
    return isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('th-TH', { dateStyle: 'medium' });
  };

  const safeTxns = Array.isArray(transactions) ? transactions.filter(t => t != null) : [];
  const eras = buildEras(safeTxns, campaigns);

  const hasCampaigns = Array.isArray(campaigns) && campaigns.length > 0;

  if (!eras.length && !hasCampaigns) return null;

  const totalEras = eras.length;
  const hasMultipleEras = totalEras > 1;

  const allSales = safeTxns.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const allFee   = safeTxns.reduce((s, t) => s + (t.inGreenFee || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${isAdmin ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <GitBranch className={`w-5 h-5 ${isAdmin ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Timeline ตามโปรโมชั่น (Era)</h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              {isAdmin ? <ShieldCheck className="w-3 h-3 text-emerald-500"/> : <Store className="w-3 h-3 text-amber-500"/>}
              {isAdmin ? 'Admin View · ' : 'Merchant View · '}
              ระบบจะแสดง Era ใหม่ให้โปร่งใสเมื่อมีการเปลี่ยนแปลง
            </p>
          </div>
        </div>
      </div>

      {hasCampaigns && (
        <CampaignBanner campaigns={campaigns} isAdmin={isAdmin} />
      )}

      {eras.length > 0 && (
        <div className="space-y-4 mt-6">
          {eras.map((era, i) => (
            <EraCard
              key={i}
              era={era}
              eraIndex={i}
              totalEras={totalEras}
              isAdmin={isAdmin}
              fmtNum={fmtNum}
              fmtDate={fmtDate}
            />
          ))}
        </div>
      )}

      {eras.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md mt-6">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">ยืนยันความถูกต้อง — ผลรวมทุก Era</p>
          </div>
          <div className="px-5 py-5 flex flex-wrap gap-8 items-center">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">ยอดขายรวมทั้งหมด</p>
              <p className="text-2xl font-black text-slate-800">฿ {fmtNum(allSales)}</p>
            </div>
            <div className="text-slate-300 text-2xl font-light">-</div>
            <div>
              <p className="text-xs text-red-400 font-medium mb-1">หัก GP 5% รวม</p>
              <p className="text-2xl font-black text-red-500">฿ {fmtNum(allFee)}</p>
            </div>
            <div className="text-slate-300 text-2xl font-light">=</div>
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl">
              <p className="text-xs text-emerald-600 font-bold mb-0.5">
                ยอดสุทธิ{shopName ? `ที่ ${shopName}` : ''} ได้รับ
              </p>
              <p className="text-3xl font-black text-emerald-600">฿ {fmtNum(allSales - allFee)}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 self-center bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">ตรวจสอบโดย InGreen</p>
                <p className="text-[10px] text-slate-400">100% Verified</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}