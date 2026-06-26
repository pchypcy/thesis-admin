import React from 'react';
import { Bell, RefreshCw, ShieldCheck, ChevronRight, Store, Menu } from 'lucide-react';

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

export default function Header({ activeView, showToast, refreshData, isLoadingData, userRole, shopCi, onMenuClick }) {
  const isMerchant = userRole === 'merchant';
  const merchantName = localStorage.getItem('merchantName') || 'ร้านค้า';
  const merchantId = localStorage.getItem('merchantId') || '';

  const ci = shopCi || (isMerchant
    ? { headerGrad: 'from-amber-500 to-orange-500', hex: '#f59e0b' }
    : { headerGrad: 'from-emerald-600 to-teal-600', hex: '#059669' });

  const pageTitle = PAGE_TITLES[activeView] || 'แผงควบคุม';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-2 px-3 sm:px-6 z-10 shrink-0 sticky top-0">

      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center text-sm text-slate-400 font-medium min-w-0 gap-1.5">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0" aria-label="เปิดเมนู">
          <Menu className="w-5 h-5" />
        </button>
        {isMerchant
          ? <Store className="w-4 h-4 text-amber-500 mr-1 shrink-0 hidden sm:block" />
          : <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1 shrink-0 hidden sm:block" />
        }
        <span className="shrink-0 hidden sm:inline">{isMerchant ? 'พอร์ทัลร้านค้า' : 'แผงผู้ดูแลระบบ'}</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-200 shrink-0 hidden sm:block" />
        <span className="text-slate-700 font-semibold truncate text-base sm:text-sm">{pageTitle}</span>
      </div>

      {/* Right: Role badge + controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

        {/* ── Prominent Role / Name Badge ── */}
        {isMerchant ? (
          /* Merchant: large shop name badge */
          <div className={`flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r ${ci.headerGrad} text-white px-2.5 sm:px-4 py-2 rounded-xl shadow-md`}>
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest hidden sm:block">ร้านค้าพาร์ทเนอร์</span>
              <span className="text-xs sm:text-sm font-extrabold tracking-wide truncate max-w-[90px] sm:max-w-[160px] sm:mt-0.5">{merchantName}</span>
            </div>
            <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block" />
            <div className="flex-col leading-none text-right hidden sm:flex">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">Shop ID</span>
              <span className="text-xs font-mono font-bold text-white/90 mt-0.5">{merchantId}</span>
            </div>
          </div>
        ) : (
          /* Admin: green badge */
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 sm:px-4 py-2 rounded-xl shadow-md">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest hidden sm:block">InGreen</span>
              <span className="text-sm font-extrabold tracking-wide sm:mt-0.5">Admin</span>
            </div>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-widest ml-1 hidden sm:inline-block">ผู้ดูแลระบบ</span>
          </div>
        )}

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        <button
          onClick={refreshData}
          className="text-sm flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm text-slate-500 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-medium hover:bg-slate-50 hover:text-emerald-600 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-emerald-500' : ''}`} />
          <span className="hidden sm:inline">รีเฟรช</span>
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