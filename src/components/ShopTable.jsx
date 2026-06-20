// components/ShopTable.jsx
import React from 'react';
import { Store, ChevronRight, TrendingUp, Receipt } from 'lucide-react';

export default function ShopTable({ shops, openShopDetail, isDashboard }) {
  const fmtNum = (num) => (num || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const shopList = Array.isArray(shops) ? shops : [];

  if (shopList.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-600 text-lg">ยังไม่มีข้อมูลร้านค้า</p>
        <p className="text-sm mt-1">ข้อมูลจะปรากฏเมื่อมีการสแกนคูปอง</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            <th className="px-7 py-4">ร้านค้าพาร์ทเนอร์</th>
            <th className="px-7 py-4 text-center">จำนวนธุรกรรม</th>
            <th className="px-7 py-4 text-right">ยอดรวม (฿)</th>
            <th className="px-7 py-4 text-right text-red-400">หัก 5% (฿)</th>
            <th className="px-7 py-4 text-right text-emerald-600">สุทธิ (฿)</th>
            <th className="px-7 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          {shopList.map((shop, idx) => {
            const net = (shop.totalAmount || 0) - (shop.inGreenFee || 0);
            return (
              <tr
                key={shop.id || idx}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => openShopDetail && openShopDetail(shop.id)}
              >
                <td className="px-7 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm group-hover:bg-emerald-100 transition-colors">
                      <Store className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800">{shop.name || shop.id}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{shop.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-7 py-4 text-center">
                  <span className="inline-flex items-center bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-black border border-blue-100">
                    <Receipt className="w-3 h-3 mr-1" />
                    {(shop.transactions || []).length} รายการ
                  </span>
                </td>
                <td className="px-7 py-4 text-right font-bold text-slate-700">
                  {fmtNum(shop.totalAmount)}
                </td>
                <td className="px-7 py-4 text-right font-bold text-red-500">
                  - {fmtNum(shop.inGreenFee)}
                </td>
                <td className="px-7 py-4 text-right">
                  <span className="font-black text-emerald-600 text-base">
                    {fmtNum(net)}
                  </span>
                </td>
                <td className="px-7 py-4 text-right">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 group-hover:bg-emerald-100 transition-colors ml-auto">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        {!isDashboard && shopList.length > 0 && (
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan="2" className="px-7 py-4 font-bold text-slate-600 text-right">รวมทั้งหมด:</td>
              <td className="px-7 py-4 text-right font-black text-slate-800">
                {fmtNum(shopList.reduce((s, sh) => s + (sh.totalAmount || 0), 0))}
              </td>
              <td className="px-7 py-4 text-right font-black text-red-500">
                - {fmtNum(shopList.reduce((s, sh) => s + (sh.inGreenFee || 0), 0))}
              </td>
              <td className="px-7 py-4 text-right font-black text-emerald-600 text-lg">
                {fmtNum(shopList.reduce((s, sh) => s + ((sh.totalAmount || 0) - (sh.inGreenFee || 0)), 0))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}