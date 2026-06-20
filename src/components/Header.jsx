import React from 'react';
import { Bell, RefreshCw, ShieldCheck, ChevronRight, Store } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'ภาพรวมแพลตฟอร์ม',
  shops: 'ร้านค้าพาร์ทเนอร์',
  'shop-detail': 'บัญชีร้านค้า',
  users: 'จัดการผู้ใช้งาน',
  coupons: 'คูปองและรางวัล',
  invoices: 'จัดการใบแจ้งหนี้',
  'merchant-dashboard': 'ภาพรวมร้านค้า',
  'merchant-scan': 'สแกนและรับออเดอร์',
  'merchant-coupons': 'คูปองของร้าน',
  'merchant-payout': 'รอบการชำระเงิน',
  'merchant-profile': 'โปรไฟล์ร้านค้า',
};

export default function Header({ activeView, showToast, refreshData, isLoadingData, userRole, shopCi }) {
  const isMerchant = userRole === 'merchant';
  const merchantName = localStorage.getItem('merchantName') || 'ร้านค้า';
  const merchantId = localStorage.getItem('merchantId') || '';

  const ci = shopCi || (isMerchant
    ? { headerGrad: 'from-amber-500 to-orange-500', hex: '#f59e0b' }
    : { headerGrad: 'from-emerald-600 to-teal-600', hex: '#059669' });

  const pageTitle = PAGE_TITLES[activeView] || 'แผงควบคุม';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0 sticky top-0">

      {/* Left: breadcrumb */}
      <div className="flex items-center text-sm text-slate-400 font-medium min-w-0">
        {isMerchant
          ? <Store className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
          : <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
        }
        <span className="shrink-0">{isMerchant ? 'พอร์ทัลร้านค้า' : 'แผงผู้ดูแลระบบ'}</span>
        <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-200 shrink-0" />
        <span className="text-slate-700 font-semibold truncate">{pageTitle}</span>
      </div>

      {/* Right: Role badge + controls */}
      <div className="flex items-center gap-3 shrink-0">

        {/* ── Prominent Role / Name Badge ── */}
        {isMerchant ? (
          /* Merchant: large shop name badge */
          <div className={`flex items-center gap-2.5 bg-gradient-to-r ${ci.headerGrad} text-white px-4 py-2 rounded-xl shadow-md`}>
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">ร้านค้าพาร์ทเนอร์</span>
              <span className="text-sm font-extrabold tracking-wide truncate max-w-[160px] mt-0.5">{merchantName}</span>
            </div>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <div className="flex flex-col leading-none text-right">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">Shop ID</span>
              <span className="text-xs font-mono font-bold text-white/90 mt-0.5">{merchantId}</span>
            </div>
          </div>
        ) : (
          /* Admin: green badge */
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl shadow-md">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">InGreen</span>
              <span className="text-sm font-extrabold tracking-wide mt-0.5">Admin</span>
            </div>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-widest ml-1">ผู้ดูแลระบบ</span>
          </div>
        )}

        <div className="w-px h-5 bg-slate-200" />

        <button
          onClick={refreshData}
          className="text-sm flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm text-slate-500 px-3.5 py-1.5 rounded-xl font-medium hover:bg-slate-50 hover:text-emerald-600 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-emerald-500' : ''}`} />
          รีเฟรช
        </button>

        <button
          onClick={() => showToast('ไม่มีการแจ้งเตือนใหม่', 'success')}
          className="text-slate-400 hover:text-emerald-500 transition-colors p-2 rounded-xl hover:bg-emerald-50 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
        </button>
      </div>
    </header>
  );
}