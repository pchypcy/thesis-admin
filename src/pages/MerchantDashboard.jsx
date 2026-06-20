import React, { useState, useMemo } from 'react';
import {
  Store, QrCode, History, Download, ArrowLeft, Search,
  CheckCircle2, AlertCircle, TrendingUp, Clock, BarChart2,
  Zap, ArrowRight, GitBranch, LayoutList
} from 'lucide-react';
import CouponRateTimeline from '../components/CouponRateTimeline';

function exportCsv(transactions, shopName) {
  const BOM = '\uFEFF';
  const header = ['สถานะ', 'วันที่และเวลา', 'รหัสคูปอง', 'คูปองเดิม', 'ใช้จริง', 'ชื่อลูกค้า', 'ยอดชำระ (฿)', 'GP 5% (฿)', 'ยอดสุทธิ (฿)', 'หมายเหตุ Flow'];
  const rows = transactions.map(txn => {
    const amount = txn.totalAmount || 0;
    const fee = txn.inGreenFee || 0;
    const prev = txn.previousDiscountRate || '';
    const curr = txn.campaignLabel || txn.discountRate || txn.couponDiscount || '';
    const flowNote = prev && prev !== curr ? `เปลี่ยนจาก ${prev} → ${curr}` : '';
    return ['Success',
      txn.redeemedAt ? new Date(txn.redeemedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-',
      txn.couponCode || 'N/A', prev, curr, txn.username || 'Unknown',
      amount, fee, amount - fee, flowNote];
  });
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(shopName || 'merchant').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ★ แก้ Badge ให้ใช้ชื่อเต็มแบบไม่มี %
function FlowBadge({ txn }) {
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

export default function MerchantDashboard({ data, handleNavClick, userRole, shopCi }) {
  const isAdmin = userRole === 'admin';
  const activeMerchantId = isAdmin ? null : localStorage.getItem('merchantId');
  const activeMerchantName = isAdmin ? '' : (localStorage.getItem('merchantName') || 'ร้านค้าพาร์ทเนอร์');

  const shops = data?.shops || [];
  const currentShop = shops.find(s => s.id === activeMerchantId)
    || { id: activeMerchantId, name: activeMerchantName, totalAmount: 0, inGreenFee: 0, transactions: [] };

  const [searchTxn, setSearchTxn] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  const ci = shopCi || {
    headerGrad: 'from-amber-500 to-orange-500',
    activeText: 'text-amber-600',
    activeBg: 'bg-amber-50',
    pillBg: 'bg-amber-50 text-amber-700 border-amber-100',
    hex: '#f59e0b',
    hexLight: '#fef3c7',
    btnPrimary: 'bg-amber-500 hover:bg-amber-600',
  };

  const fmtNum = (num) => (num || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const stats = useMemo(() => {
    const txns = currentShop.transactions || [];
    if (!txns.length) return { todayScans: 0, todayRevenue: 0, monthRevenue: 0, platformFee: 0, avgOrder: 0, peakHour: null, recentTxns: [] };
    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    let todayScans = 0, todayRevenue = 0, monthRevenue = 0, platformFee = 0;
    const hourCounts = {};
    txns.forEach(txn => {
      const d = new Date(txn.redeemedAt || txn.createdAt || new Date());
      const txnStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      monthRevenue += txn.totalAmount || 0;
      platformFee += txn.inGreenFee || 0;
      hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
      if (txnStr === todayStr) { todayScans++; todayRevenue += txn.totalAmount || 0; }
    });
    const avgOrder = txns.length > 0 ? monthRevenue / txns.length : 0;
    const peakHour = Object.keys(hourCounts).length > 0
      ? Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0] : null;
    const recentTxns = [...txns].sort((a, b) => new Date(b.redeemedAt || b.createdAt) - new Date(a.redeemedAt || a.createdAt)).slice(0, 3);
    return { todayScans, todayRevenue, monthRevenue, platformFee, avgOrder, peakHour, recentTxns };
  }, [currentShop]);

  const transactions = currentShop.transactions || [];
  const filteredTransactions = transactions.filter(txn =>
    (txn.couponCode || '').toLowerCase().includes(searchTxn.toLowerCase()) ||
    (txn.username || '').toLowerCase().includes(searchTxn.toLowerCase())
  );

  const rateChangedTxns = transactions.filter(txn =>
    txn.previousDiscountRate &&
    txn.previousDiscountRate !== (txn.campaignLabel || txn.discountRate || txn.couponDiscount)
  );

  const hasRateHistory = rateChangedTxns.length > 0 || new Set(
    transactions.map(t => t.campaignLabel || t.discountRate || t.couponDiscount).filter(Boolean)
  ).size > 1;

  const netRevenue = stats.monthRevenue - stats.platformFee;

  const handleExport = () => {
    const list = searchTxn ? filteredTransactions : transactions;
    if (!list.length) { alert('ยังไม่มีข้อมูลธุรกรรมให้ส่งออก'); return; }
    exportCsv(list, currentShop.name || activeMerchantName);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-7xl mx-auto pb-12">
      {isAdmin && (
        <button onClick={() => handleNavClick('shops')} className="flex items-center text-slate-500 hover:text-emerald-600 font-semibold mb-2 transition-colors text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-max">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> กลับไปยังระบบแอดมิน
        </button>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {currentShop.name || activeMerchantName}
            </h1>
            {isAdmin
              ? <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border border-emerald-100 flex items-center gap-1">Admin View</span>
              : (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border flex items-center gap-1 ${isStoreOpen ? ci.pillBg : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'animate-pulse' : 'bg-slate-300'}`} style={isStoreOpen ? { background: ci.hex } : {}} />
                  {isStoreOpen ? 'ร้านเปิดบริการ' : 'ร้านปิดบริการ'}
                </span>
              )
            }
          </div>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Store className="w-3.5 h-3.5" />
            รหัสร้านค้า: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 text-xs">{currentShop.id}</span>
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 gap-3">
              <span className={`text-sm font-semibold ${isStoreOpen ? ci.activeText : 'text-slate-400'}`}>
                {isStoreOpen ? 'เปิดบริการ' : 'ปิดบริการ'}
              </span>
              <button
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 shadow-inner"
                style={{ background: isStoreOpen ? ci.hex : '#e2e8f0' }}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 shadow-md ${isStoreOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <button
              onClick={() => isStoreOpen ? handleNavClick('merchant-scan') : alert('กรุณาเปิดร้านก่อน')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-all shadow-sm ${isStoreOpen ? `${ci.btnPrimary} text-white active:scale-95` : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              <QrCode className="w-4 h-4 mr-2" /> สแกนคูปอง
            </button>
          </div>
        )}
      </div>

      {!transactions.length && (
        <div className="border rounded-2xl px-6 py-4 flex items-center gap-3" style={{ background: ci.hexLight, borderColor: ci.hex + '55' }}>
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: ci.hex }} />
          <p className="text-sm font-semibold" style={{ color: ci.hex }}>ยังไม่มีประวัติการสแกนคูปอง — กดปุ่ม "สแกนรับออเดอร์" เพื่อเริ่มรับออเดอร์แรก</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className={`bg-gradient-to-br ${ci.headerGrad} rounded-2xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 w-28 h-28 bg-white/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="bg-white/15 text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-white/10">รอบปัจจุบัน</span>
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-medium mb-1">ยอดขายรวม (รับเต็ม)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">฿ {fmtNum(stats.monthRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">หัก GP 5%</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1">ค่าบริการแพลตฟอร์ม</p>
            <h3 className="text-2xl font-bold text-red-500">- ฿ {fmtNum(stats.platformFee)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-400">คิดจากยอดขายทั้งหมด × 5%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group flex flex-col justify-between" style={{ borderColor: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = ci.hex + '55'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ background: ci.hexLight, color: ci.hex }}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">ได้รับจริง</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1">ยอดสุทธิที่ร้านได้รับ</p>
            <h3 className="text-2xl font-bold" style={{ color: ci.hex }}>฿ {fmtNum(netRevenue)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">ออเดอร์วันนี้ <span className="font-semibold" style={{ color: ci.hex }}>{stats.todayScans} รายการ</span></p>
            <p className="text-xs text-slate-400">฿ {fmtNum(stats.todayRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: ci.hexLight, color: ci.hex, borderColor: ci.hex + '30' }}>
              <BarChart2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ค่าเฉลี่ย / ออเดอร์</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">฿ {fmtNum(stats.avgOrder)}</p>
          <p className="text-xs text-slate-400 mt-1">จาก {transactions.length} ออเดอร์ทั้งหมด</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: ci.hexLight, color: ci.hex, borderColor: ci.hex + '30' }}>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ช่วงเวลาพีค</p>
          </div>
          {stats.peakHour ? (
            <>
              <p className="text-2xl font-bold text-slate-800">{stats.peakHour[0]}:00 น.</p>
              <p className="text-xs text-slate-400 mt-1">{stats.peakHour[1]} ออเดอร์ในช่วงนี้</p>
            </>
          ) : (
            <p className="text-sm text-slate-400 font-medium">ยังไม่มีข้อมูลเพียงพอ</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: ci.hexLight, color: ci.hex, borderColor: ci.hex + '30' }}>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ออเดอร์ล่าสุด</p>
          </div>
          {stats.recentTxns.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recentTxns.map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ci.hex }} />
                    <span className="text-xs font-mono text-slate-600 font-semibold truncate">{txn.couponCode || 'N/A'}</span>
                    <span className="text-xs text-slate-400 shrink-0">{txn.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-700">฿{fmtNum(txn.totalAmount || 0)}</span>
                    <span className="text-[10px] text-slate-300">
                      {txn.redeemedAt ? new Date(txn.redeemedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">ยังไม่มีออเดอร์</p>
          )}
        </div>
      </div>

      {(transactions.length > 0 || (currentShop.campaigns || []).length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'timeline'
                  ? 'border-b-2 bg-amber-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              style={activeTab === 'timeline' ? { borderBottomColor: ci.hex, color: ci.hex } : {}}
            >
              <History className="w-4 h-4" />
              Timeline โปรโมชั่น
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
                  ? 'border-b-2 bg-amber-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              style={activeTab === 'table' ? { borderBottomColor: ci.hex, color: ci.hex } : {}}
            >
              <LayoutList className="w-4 h-4" />
              ตารางรายการทั้งหมด
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {transactions.length}
              </span>
            </button>
          </div>

          {activeTab === 'timeline' && (
            <div className="p-6">
              <CouponRateTimeline
                transactions={transactions}
                isAdmin={isAdmin}
                shopName={currentShop.name || activeMerchantName}
                campaigns={currentShop.campaigns || []}
              />
            </div>
          )}

          {activeTab === 'table' && (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ทั้งหมด {transactions.length} รายการ{searchTxn && ` · แสดง ${filteredTransactions.length} รายการ`}
                    {rateChangedTxns.length > 0 && <span className="ml-2 text-amber-600 font-semibold">· {rateChangedTxns.length} รายการมี Flow</span>}
                  </p>
                </div>
                <div className="flex space-x-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-300" />
                    <input
                      type="text" placeholder="ค้นหารหัส หรือชื่อลูกค้า..." value={searchTxn}
                      onChange={e => setSearchTxn(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleExport}
                    className="text-sm bg-white border border-slate-200 text-slate-600 font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center shadow-sm shrink-0 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">สถานะ</th>
                      <th className="px-6 py-3.5">เวลาทำรายการ</th>
                      <th className="px-6 py-3.5">รหัสคูปอง / ลูกค้า</th>
                      {/* ★ แก้คอลัมน์จาก อัตราส่วนลด เป็น โปรโมชั่นที่ใช้ */}
                      <th className="px-6 py-3.5">โปรโมชั่นที่ใช้</th>
                      <th className="px-6 py-3.5 text-right">ยอดชำระ (฿)</th>
                      <th className="px-6 py-3.5 text-right">GP 5% (฿)</th>
                      <th className="px-6 py-3.5 text-right" style={{ color: ci.hex }}>ยอดสุทธิ (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredTransactions.length > 0 ? filteredTransactions.map((txn, idx) => {
                      const amount = txn.totalAmount || 0;
                      const fee = txn.inGreenFee || 0;
                      const dateStr = txn.redeemedAt || txn.createdAt;
                      const hasRateChange = txn.previousDiscountRate &&
                        txn.previousDiscountRate !== (txn.campaignLabel || txn.discountRate || txn.couponDiscount);
                      return (
                        <tr key={txn._id || idx} className={`hover:bg-slate-50/80 transition-colors ${hasRateChange ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border uppercase tracking-wide" style={{ background: ci.hexLight, color: ci.hex, borderColor: ci.hex + '30' }}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                            {dateStr ? new Date(dateStr).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 font-mono text-sm">{txn.couponCode || 'N/A'}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{txn.username || 'Unknown'}</div>
                            {hasRateChange && (
                              <span className="inline-flex items-center gap-1 mt-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <GitBranch className="w-3 h-3" /> Flow Change
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <FlowBadge txn={txn} />
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-700">{fmtNum(amount)}</td>
                          <td className="px-6 py-4 text-right font-medium text-red-500 text-xs">- {fmtNum(fee)}</td>
                          <td className="px-6 py-4 text-right font-bold" style={{ color: ci.hex }}>{fmtNum(amount - fee)}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="7" className="text-center py-16 text-slate-400">
                          <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="font-medium text-slate-500">ยังไม่มีรายการสแกน</p>
                          <p className="text-xs mt-1">{searchTxn ? `ไม่พบผลการค้นหาสำหรับ "${searchTxn}"` : 'รอรับออเดอร์แรกของคุณได้เลย'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {transactions.length > 0 && !searchTxn && (
                    <tfoot className="bg-slate-50 border-t-2 border-slate-100">
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">รวมทั้งหมด</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700">
                          {fmtNum(transactions.reduce((s, t) => s + (t.totalAmount || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-red-500 text-xs">
                          - {fmtNum(transactions.reduce((s, t) => s + (t.inGreenFee || 0), 0))}
                        </td>
                        <td className="px-6 py-4 text-right font-bold" style={{ color: ci.hex }}>
                          {fmtNum(transactions.reduce((s, t) => s + ((t.totalAmount || 0) - (t.inGreenFee || 0)), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}