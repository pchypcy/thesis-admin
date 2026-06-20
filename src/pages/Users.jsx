// pages/Users.jsx — InGreen Sprint 2
//
// การเปลี่ยนแปลงจาก Sprint 1:
//   [SPRINT 2] เพิ่มคอลัมน์ "VIP Status" แสดง badge สถานะ VIP/Trial/หมดอายุ
//   [SPRINT 2] CSV export เพิ่มคอลัมน์ VIP status และวันหมดอายุ
//   [SPRINT 2] filter tab: ทั้งหมด | เฉพาะ VIP | ไม่ใช่ VIP
//
// ★ ข้อมูล vipStatus มาจาก admin/dashboard-summary ซึ่ง JOIN กับ VipSubscription
//   โดยตรง (ไม่ต้อง fetch เพิ่ม) เพราะ admin.js เพิ่ม vipStatus ต่อ user แล้ว

import React, { useState } from 'react';
import { Users as UsersIcon, Search, ShieldCheck, Ticket, Download, Activity, Ban, CheckCircle2, Crown } from 'lucide-react';

function exportCsv(users) {
  const BOM = '\uFEFF';
  const header = ['ชื่อผู้ใช้งาน', 'อีเมล', 'กลุ่มผู้ใช้', 'แต้มสะสม', 'สแกนสินค้า (ครั้ง)', 'แลกคูปอง (ครั้ง)', 'สถานะ', 'VIP Status', 'VIP หมดอายุ'];
  const rows = users.map(u => [
    u.username || '',
    `${u.username}@ingreen.app`,
    u.persona || 'ผู้ใช้ใหม่',
    u.points || 0,
    u.scanHistory?.length || 0,
    u.redeemHistory?.length || 0,
    u.status === 'suspended' ? 'ระงับแล้ว' : 'ใช้งานอยู่',
    // ★ SPRINT 2: VIP fields
    u.vipStatus?.isVip
      ? (u.vipStatus.status === 'trial' ? 'Trial' : 'VIP Active')
      : (u.vipStatus?.status === 'expired' ? 'หมดอายุ' : 'ไม่ใช่ VIP'),
    u.vipStatus?.expiresAt
      ? new Date(u.vipStatus.expiresAt).toLocaleDateString('th-TH')
      : '-',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ingreen_users_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── VIP Badge Component ──────────────────────────────────────────────────────
function VipBadge({ vipStatus }) {
  if (!vipStatus) return <span className="text-xs text-slate-400">—</span>;

  const { isVip, status, daysRemaining } = vipStatus;

  if (isVip && status === 'trial') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-wide">
        <Crown className="w-3 h-3" /> Trial
        <span className="text-[10px] opacity-70 ml-0.5">{daysRemaining}วัน</span>
      </span>
    );
  }

  if (isVip && status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-yellow-50 text-yellow-700 border-yellow-100 uppercase tracking-wide">
        <Crown className="w-3 h-3" /> VIP
        <span className="text-[10px] opacity-70 ml-0.5">{daysRemaining}วัน</span>
      </span>
    );
  }

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-orange-50 text-orange-500 border-orange-100 uppercase tracking-wide">
        หมดอายุ
      </span>
    );
  }

  return <span className="text-xs text-slate-300">—</span>;
}

export default function Users({ showToast, data }) {
  const [searchTerm, setSearchTerm]     = useState('');
  const [localUsers, setLocalUsers]     = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  // ★ SPRINT 2: filter tab
  const [vipFilter, setVipFilter]       = useState('all'); // 'all' | 'vip' | 'nonvip'

  const fmtNum = (num) => num ? num.toLocaleString('th-TH') : '0';
  const sourceList = data?.users?.list || [];
  const usersList  = localUsers !== null ? localUsers : sourceList;

  // ★ SPRINT 2: VIP filter
  const vipFiltered = usersList.filter(u => {
    if (vipFilter === 'vip')    return u.vipStatus?.isVip === true;
    if (vipFilter === 'nonvip') return !u.vipStatus?.isVip;
    return true;
  });

  const filteredUsers = vipFiltered.filter(u =>
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ★ SPRINT 2: VIP summary counts
  const vipCount   = usersList.filter(u => u.vipStatus?.isVip).length;
  const trialCount = usersList.filter(u => u.vipStatus?.status === 'trial' && u.vipStatus?.isVip).length;

  const handleToggleSuspend = (user) => {
    const base = localUsers !== null ? localUsers : sourceList;
    setLocalUsers(base.map(u => u._id === user._id
      ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
    ));
    showToast(
      user.status === 'suspended'
        ? `ปลดระงับ "${user.username}" สำเร็จ ✓`
        : `ระงับบัญชี "${user.username}" แล้ว`,
      'success'
    );
    setSuspendTarget(null);
  };

  const handleExport = () => {
    const list = searchTerm ? filteredUsers : vipFiltered;
    if (!list.length) { showToast('ไม่มีข้อมูลให้ส่งออก', 'error'); return; }
    exportCsv(list);
    showToast(`ส่งออกข้อมูล ${list.length} รายการสำเร็จ ✓`, 'success');
  };

  return (
    <>
      {/* Suspend Modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${suspendTarget.status === 'suspended' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
              {suspendTarget.status === 'suspended' ? <CheckCircle2 className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">
              {suspendTarget.status === 'suspended' ? 'ปลดระงับบัญชีนี้?' : 'ระงับบัญชีนี้?'}
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              บัญชี <strong className="text-slate-700">"{suspendTarget.username}"</strong> จะ
              {suspendTarget.status === 'suspended' ? 'กลับมาใช้งานได้ตามปกติ' : 'ถูกระงับและเข้าถึงแอปไม่ได้'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSuspendTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">ยกเลิก</button>
              <button onClick={() => handleToggleSuspend(suspendTarget)} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold ${suspendTarget.status === 'suspended' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {suspendTarget.status === 'suspended' ? 'ปลดระงับ' : 'ระงับบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 animate-fade-in font-sans max-w-7xl mx-auto pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ผู้ใช้งานทั้งหมด <span className="font-semibold text-slate-600">{fmtNum(usersList.length)}</span> บัญชี
              {/* ★ SPRINT 2: VIP count */}
              <span className="ml-2 text-yellow-600 font-semibold">
                · VIP {vipCount} คน (Trial {trialCount})
              </span>
              {searchTerm && <span className="ml-2 text-blue-500 font-medium">(แสดง {filteredUsers.length} รายการ)</span>}
            </p>
          </div>
          <div className="flex w-full md:w-auto gap-2.5">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text" placeholder="ค้นหาด้วยชื่อผู้ใช้งาน..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all shadow-sm"
              />
            </div>
            <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95">
              <Download className="w-4 h-4" /> ส่งออก CSV
            </button>
          </div>
        </div>

        {/* ★ SPRINT 2: VIP Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all',    label: 'ทั้งหมด',       count: usersList.length },
            { id: 'vip',    label: '👑 VIP / Trial', count: vipCount },
            { id: 'nonvip', label: 'ไม่ใช่ VIP',    count: usersList.length - vipCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setVipFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                vipFilter === tab.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-3.5">ข้อมูลผู้ใช้งาน</th>
                  <th className="px-6 py-3.5">กลุ่มผู้ใช้</th>
                  <th className="px-6 py-3.5 text-center">แต้มสะสม</th>
                  {/* ★ SPRINT 2: VIP column */}
                  <th className="px-6 py-3.5 text-center">VIP Status</th>
                  <th className="px-6 py-3.5">กิจกรรม</th>
                  <th className="px-6 py-3.5 text-center">สถานะบัญชี</th>
                  <th className="px-6 py-3.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => {
                  const isSuspended = user.status === 'suspended';
                  return (
                    <tr key={user._id || idx} className={`hover:bg-slate-50/60 transition-colors ${isSuspended ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 font-semibold text-sm">
                              {(user.username || '?').charAt(0).toUpperCase()}
                            </div>
                            {/* ★ SPRINT 2: Crown overlay สำหรับ VIP user */}
                            {user.vipStatus?.isVip && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                                <Crown className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{user.username}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{user.username}@ingreen.app</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wide">
                          {user.persona || 'ผู้ใช้ใหม่'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {fmtNum(user.points)} แต้ม
                        </span>
                      </td>
                      {/* ★ SPRINT 2: VIP Badge */}
                      <td className="px-6 py-4 text-center">
                        <VipBadge vipStatus={user.vipStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-slate-500">
                            <Activity className="w-3 h-3 mr-1.5 text-blue-400" />
                            สแกนสินค้า: <span className="ml-1 font-medium text-slate-700">{fmtNum(user.scanHistory?.length || 0)} ครั้ง</span>
                          </div>
                          <div className="flex items-center text-xs text-slate-500">
                            <Ticket className="w-3 h-3 mr-1.5 text-amber-400" />
                            แลกคูปอง: <span className="ml-1 font-medium text-slate-700">{fmtNum(user.redeemHistory?.length || 0)} ครั้ง</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border uppercase tracking-wide ${
                          isSuspended ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {isSuspended ? 'ระงับแล้ว' : 'ใช้งานอยู่'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setSuspendTarget(user)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                          }`}>
                          {isSuspended
                            ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />ปลดระงับ</span>
                            : <span className="flex items-center gap-1"><Ban className="w-3 h-3" />ระงับ</span>}
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="7" className="text-center py-16">
                    <UsersIcon className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="font-medium text-slate-500">ไม่พบผู้ใช้งาน</p>
                    <p className="text-xs mt-1 text-slate-400">
                      {searchTerm ? `ไม่มีผลลัพธ์สำหรับ "${searchTerm}"` : 'ยังไม่มีข้อมูลผู้ใช้งานในระบบ'}
                    </p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            แสดง {filteredUsers.length} จาก {usersList.length} รายการ
          </p>
        )}
      </div>
    </>
  );
}