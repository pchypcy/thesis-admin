import React from 'react';
import { TrendingUp, Users, ArrowRight, ShieldCheck, Zap, CreditCard, ChevronRight } from 'lucide-react';
import ShopTable from '../components/ShopTable';

export default function Dashboard({ data, handleNavClick, openShopDetail }) {
  const fmtNum = (num) => num ? num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  const fmtInt = (num) => num ? num.toLocaleString('th-TH') : '0';

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-7xl mx-auto pb-12">

      {/* ส่วนหัวหน้า */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ภาพรวมแพลตฟอร์ม</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          </div>
          <p className="text-sm text-slate-400">สรุปรายได้และสถิติแพลตฟอร์มแบบ Real-time</p>
        </div>
        <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          ระบบทำงานปกติ
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* รายได้รวม */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 flex flex-col justify-between shadow-md shadow-emerald-900/10 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-28 h-28 bg-white/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="bg-white/15 text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-white/10">อัปเดตล่าสุด</span>
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-xs font-medium mb-1">รายได้รวมแพลตฟอร์ม</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">฿ {fmtNum(data?.totalRevenue)}</h3>
          </div>
        </div>

        {/* รายได้จาก Subscription */}
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          onClick={() => handleNavClick('users')}
        >
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">แหล่งรายได้ 1</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1 flex items-center gap-1">
              ค่าบริการรายเดือน (Subscription) <ChevronRight className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
            </p>
            <h3 className="text-2xl font-bold text-slate-800">฿ {fmtNum(data?.users?.revenue)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">ผู้ใช้งานทั้งหมด <span className="text-blue-600 font-semibold">{fmtInt(data?.users?.count)}</span> บัญชี</p>
            <p className="text-xs text-slate-400">69฿ / คน / เดือน</p>
          </div>
        </div>

        {/* รายได้จาก GP */}
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          onClick={() => handleNavClick('shops')}
        >
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">แหล่งรายได้ 2</span>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1 flex items-center gap-1">
              ค่า GP จากร้านค้า (InGreen Fee 5%) <ChevronRight className="w-3 h-3 group-hover:text-amber-500 transition-colors" />
            </p>
            <h3 className="text-2xl font-bold text-slate-800">฿ {fmtNum(data?.coupons?.feeRevenue)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">ยอดคูปองรวม <span className="text-amber-600 font-semibold">฿ {fmtNum(data?.coupons?.totalUsage)}</span></p>
            <p className="text-xs text-slate-400">หัก 5%</p>
          </div>
        </div>

      </div>

      {/* ตารางร้านค้าพาร์ทเนอร์ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">ร้านค้าพาร์ทเนอร์ที่ใช้งานอยู่</h2>
              <p className="text-xs text-slate-400 mt-0.5">ร้านค้าที่มีธุรกรรมล่าสุด</p>
            </div>
          </div>
          <button
            onClick={() => handleNavClick('shops')}
            className="text-xs text-slate-500 hover:text-emerald-600 font-medium px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all flex items-center gap-1.5"
          >
            ดูทั้งหมด <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <ShopTable shops={data?.shops} openShopDetail={openShopDetail} isDashboard={true} />
      </div>

    </div>
  );
}