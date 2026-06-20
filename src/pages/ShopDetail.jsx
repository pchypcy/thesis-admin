import React, { useState } from 'react';
import {
  ArrowLeft, FileSpreadsheet, Search, GitBranch,
  ArrowRight, CheckCircle2, ShieldCheck, LayoutList, History
} from 'lucide-react';
import CouponRateTimeline from '../components/CouponRateTimeline';

function exportCsv(shop) {
  const BOM = '\uFEFF';
  const header = ['วันที่และเวลา', 'รหัสคูปอง', 'โปรโมชั่นเดิม', 'ใช้จริง', 'ชื่อลูกค้า', 'ยอดชำระ (฿)', 'หัก 5% (฿)', 'ยอดสุทธิ (฿)', 'หมายเหตุ Flow'];
  const rows = (shop.transactions || []).map(txn => {
    const amount = txn.totalAmount || 0;
    const fee = txn.inGreenFee || 0;
    const prev = txn.previousDiscountRate || '';
    const curr = txn.campaignLabel || txn.discountRate || txn.couponDiscount || '';
    const flowNote = prev && prev !== curr ? `เปลี่ยนจาก ${prev} → ${curr}` : '';
    return [
      txn.redeemedAt ? new Date(txn.redeemedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-',
      txn.couponCode || 'N/A', prev, curr, txn.username || 'Unknown',
      amount, fee, amount - fee, flowNote,
    ];
  });
  rows.push(['', '', '', '', 'รวมทั้งหมด', shop.totalAmount || 0, shop.inGreenFee || 0, (shop.totalAmount || 0) - (shop.inGreenFee || 0), '']);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ingreen_${shop.id}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ★ แก้ Badge ให้ใช้ชื่อเต็ม
function AdminFlowBadge({ txn }) {
  const prev = txn.previousDiscountRate;
  const curr = txn.campaignLabel || txn.discountRate || txn.couponDiscount || 'ไม่ระบุ';
  if (!prev || prev === curr) {
    return <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">{curr}</span>;
  }
  return (
    <div className="flex flex-col gap-1 w-max">
      <span className="text-[10px] font-semibold text-red-400 line-through">เปลี่ยนจาก {prev}</span>
      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-md">
        <GitBranch className="w-3 h-3" />เป็น {curr}
      </span>
    </div>
  );
}

export default function ShopDetail({ shopId, shopsData, handleNavClick, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('timeline');
  const fmtNum = (num) => num ? num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  const shop = shopsData?.find(s => s.id === shopId);
  if (!shop) return (
    <div className="p-10 text-center text-red-500 font-bold bg-white rounded-2xl shadow-sm">
      ไม่พบข้อมูลร้านค้านี้ในระบบ
    </div>
  );

  const filteredTransactions = (shop.transactions || []).filter(txn =>
    (txn.couponCode && txn.couponCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (txn.username && txn.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const rateChangedTxns = (shop.transactions || []).filter(txn =>
    txn.previousDiscountRate &&
    txn.previousDiscountRate !== (txn.campaignLabel || txn.discountRate || txn.couponDiscount)
  );

  const hasRateHistory = rateChangedTxns.length > 0 || new Set(
    (shop.transactions || []).map(t => t.campaignLabel || t.discountRate || t.couponDiscount).filter(Boolean)
  ).size > 1;

  const handleExport = () => {
    if (!shop.transactions?.length) { showToast('ยังไม่มีข้อมูลธุรกรรมให้ส่งออก', 'error'); return; }
    exportCsv(shop);
    showToast(`ส่งออกข้อมูล ${shop.transactions.length} รายการสำเร็จ ✓`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => handleNavClick('shops')}
            className="text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin · Shop Dashboard
              </span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-400">{shop.id}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 flex items-center tracking-tight">
              {shop.name}
              <span className="ml-3 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" /> Active
              </span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-sm bg-white border border-slate-200 shadow-sm text-slate-700 font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors flex items-center active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <p className="text-slate-500 text-sm font-semibold mb-1">ยอดคูปองที่ลูกค้าใช้ทั้งหมด (Total Sales)</p>
          <h3 className="text-3xl font-extrabold text-slate-800">฿ {fmtNum(shop.totalAmount)}</h3>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <p className="text-slate-500 text-sm font-semibold mb-1">ค่า GP แพลตฟอร์ม 5% (Platform Fee)</p>
          <h3 className="text-3xl font-extrabold text-red-600">- ฿ {fmtNum(shop.inGreenFee)}</h3>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <p className="text-emerald-700 text-sm font-bold mb-1">ยอดเงินสุทธิที่ร้านได้รับ (Net Settlement)</p>
          <h3 className="text-4xl font-black text-emerald-600">฿ {fmtNum(shop.totalAmount - shop.inGreenFee)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'timeline'
                ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History className="w-4 h-4" />
            Timeline ตามโปรโมชั่น
            {hasRateHistory && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                มีการเปลี่ยนโปร
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'table'
                ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            ตารางรายการทั้งหมด
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {shop.transactions?.length || 0}
            </span>
          </button>
        </div>

        {activeTab === 'timeline' && (
          <div className="p-6">
            {(shop.transactions || []).length > 0 || (shop.campaigns || []).length > 0 ? (
              <CouponRateTimeline
                transactions={shop.transactions || []}
                isAdmin={true}
                shopName={shop.name}
                campaigns={shop.campaigns || []}
              />
            ) : (
              <div className="text-center py-16">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium text-sm">ยังไม่มีประวัติการสแกนคูปอง</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'table' && (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  ทั้งหมด {shop.transactions?.length || 0} รายการ
                  {searchTerm && ` · แสดง ${filteredTransactions.length} รายการ`}
                  {rateChangedTxns.length > 0 && (
                    <span className="ml-2 text-amber-600 font-semibold">
                      · {rateChangedTxns.length} รายการมีการเปลี่ยน Flow
                    </span>
                  )}
                </p>
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="ค้นหารหัสคูปอง หรือ ลูกค้า..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-bold text-slate-500 bg-slate-50 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-7 py-4">วันที่และเวลา</th>
                    <th className="px-7 py-4">รหัสคูปอง / ลูกค้า</th>
                    {/* ★ แก้คอลัมน์จาก อัตราส่วนลด เป็น โปรโมชั่นที่ใช้ */}
                    <th className="px-7 py-4">โปรโมชั่นที่ใช้</th>
                    <th className="px-7 py-4 text-right">ยอดชำระ (฿)</th>
                    <th className="px-7 py-4 text-right text-red-500">หัก 5% (฿)</th>
                    <th className="px-7 py-4 text-right text-emerald-600">ยอดสุทธิ (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredTransactions.map((txn, idx) => {
                    const amount = txn.totalAmount || 0;
                    const fee = txn.inGreenFee || 0;
                    const hasRateChange = txn.previousDiscountRate &&
                      txn.previousDiscountRate !== (txn.campaignLabel || txn.discountRate || txn.couponDiscount);
                    return (
                      <tr key={idx} className={`hover:bg-slate-50 transition-colors ${hasRateChange ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-7 py-4 text-slate-500 font-medium">
                          {txn.redeemedAt ? new Date(txn.redeemedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="px-7 py-4">
                          <div className="font-bold text-slate-800 font-mono">{txn.couponCode || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{txn.username || 'Unknown User'}</div>
                          {hasRateChange && (
                            <span className="inline-flex items-center gap-1 mt-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <GitBranch className="w-3 h-3" /> Flow Change
                            </span>
                          )}
                        </td>
                        <td className="px-7 py-4"><AdminFlowBadge txn={txn} /></td>
                        <td className="px-7 py-4 text-right font-medium">{fmtNum(amount)}</td>
                        <td className="px-7 py-4 text-right font-semibold text-red-500 bg-red-50/30">- {fmtNum(fee)}</td>
                        <td className="px-7 py-4 text-right font-bold text-emerald-600 bg-emerald-50/30">{fmtNum(amount - fee)}</td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                        {searchTerm ? `ไม่พบรายการสำหรับ "${searchTerm}"` : 'ยังไม่มีประวัติการสแกนคูปอง'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {shop.transactions?.length > 0 && !searchTerm && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan="3" className="px-7 py-5 text-right font-bold text-slate-700">รวมทั้งหมด (Total):</td>
                      <td className="px-7 py-5 text-right font-bold text-slate-800 text-base">{fmtNum(shop.totalAmount)}</td>
                      <td className="px-7 py-5 text-right font-bold text-red-600 text-base">- {fmtNum(shop.inGreenFee)}</td>
                      <td className="px-7 py-5 text-right font-black text-emerald-600 text-lg">{fmtNum(shop.totalAmount - shop.inGreenFee)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}