import React from 'react';
import { PieChart, Users, Store, Ticket, LogOut, QrCode, Home, Banknote, Settings, Receipt, ShieldCheck, Wallet, SlidersHorizontal, ShieldAlert } from 'lucide-react';

export default function Sidebar({ activeView, handleNavClick, handleLogout, userRole }) {
  const isMerchant = userRole === 'merchant';
  const merchantName = localStorage.getItem('merchantName') || 'ร้านค้า';

  // ── Role CI colours ──
  const ci = isMerchant
    ? {
        accent: 'text-amber-600',
        activeBg: 'bg-amber-50',
        activeBorder: 'border-amber-100/80',
        activeText: 'text-amber-700',
        activeIcon: 'text-amber-600',
        headerGrad: 'from-amber-500 to-orange-500',
        avatarBg: 'bg-amber-100 text-amber-700',
        sectionLabel: 'text-amber-400',
      }
    : {
        accent: 'text-emerald-600',
        activeBg: 'bg-emerald-50',
        activeBorder: 'border-emerald-100/80',
        activeText: 'text-emerald-700',
        activeIcon: 'text-emerald-600',
        headerGrad: 'from-emerald-600 to-teal-600',
        avatarBg: 'bg-emerald-100 text-emerald-700',
        sectionLabel: 'text-emerald-400',
      };

  const NavItem = ({ id, icon: Icon, label, isActive }) => {
    const active = isActive || activeView === id;
    return (
      <li>
        <button
          onClick={() => handleNavClick(id)}
          className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            active
              ? `${ci.activeBg} ${ci.activeText} border ${ci.activeBorder}`
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? ci.activeIcon : 'text-slate-400'}`} />
          {label}
        </button>
      </li>
    );
  };

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">

      {/* Logo bar */}
      <div
        className="h-16 flex items-center px-5 border-b border-slate-100 cursor-pointer gap-2.5"
        onClick={() => handleNavClick(isMerchant ? 'merchant-dashboard' : 'dashboard')}
      >
        <img src="/Logo-Pic.png" alt="InGreen" className="w-8 h-8 object-contain" />
        <img src="/Logo-Text.png" alt="InGreen" className="h-5 w-auto object-contain mt-1" />
      </div>

      {/* Role label */}
      <div className={`px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-wider ${ci.sectionLabel}`}>
        {isMerchant ? 'เมนูร้านค้า' : 'เมนูหลัก'}
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {isMerchant ? (
            <>
              <NavItem id="merchant-dashboard" icon={Home} label="ภาพรวมร้านค้า" />
              <NavItem id="merchant-scan" icon={QrCode} label="สแกนคูปองลูกค้า" />
              <NavItem id="merchant-coupons" icon={Ticket} label="คูปองของร้าน" />
              <NavItem id="merchant-payout" icon={Banknote} label="รอบชำระเงิน" />
              <li className="pt-2">
                <div className="px-3.5 pb-1.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  ตั้งค่า
                </div>
              </li>
              <NavItem id="merchant-profile" icon={Settings} label="โปรไฟล์ร้านค้า" />
            </>
          ) : (
            <>
              <NavItem id="dashboard" icon={PieChart} label="ภาพรวมแพลตฟอร์ม" />
              <NavItem
                id="shops"
                icon={Store}
                label="ร้านค้าพาร์ทเนอร์"
                isActive={activeView === 'shops' || activeView === 'shop-detail'}
              />
              <NavItem id="users" icon={Users} label="จัดการผู้ใช้งาน" />
              <NavItem id="coupons" icon={Ticket} label="คูปองและรางวัล" />
              <NavItem id="invoices" icon={Receipt} label="ใบแจ้งหนี้" />
              <NavItem id="settlements" icon={Wallet} label="เคลียร์เงินร้านค้า" />
              <NavItem id="product-review" icon={ShieldCheck} label="ตรวจสอบสินค้าชุมชน" />
              <NavItem id="allergen-groups" icon={ShieldAlert} label="กลุ่มอาหารแพ้" />
              <NavItem id="config" icon={SlidersHorizontal} label="ตั้งค่าระบบ" />
            </>
          )}
        </ul>
      </nav>

      {/* User / Logout card */}
      <div
        className="m-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-red-50 hover:border-red-100 group transition-all"
        onClick={handleLogout}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${ci.avatarBg}`}>
              {isMerchant ? <Store className="w-4 h-4" /> : 'A'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 group-hover:text-red-700 transition-colors line-clamp-1 w-24">
                {isMerchant ? merchantName : 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 group-hover:text-red-400 transition-colors mt-0.5">ออกจากระบบ</p>
            </div>
          </div>
          <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
}