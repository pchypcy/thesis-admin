import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FileText, Search, Store, CheckCircle2, Clock, TriangleAlert,
  BadgeCheck, X, ChevronRight, Send, Eye, Filter, Download,
  Banknote, AlertCircle, Loader2, Plus, Hash
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ★ SPRINT 5: แปลง Invoice จาก backend → UI shape ที่ component เดิมใช้
//   (รักษา interface เดิมไว้: invoiceNo, shopId, shopName, total, fee, count, status, dueDate, paidDate, issuedAt)
function normalizeInvoice(inv) {
  const d = new Date(inv.redeemedAt || inv.createdAt || Date.now());
  const due = new Date(d.getFullYear(), d.getMonth() + 1, 5); // ครบกำหนดวันที่ 5 ของเดือนถัดไป
  const isOverdue = inv.status !== 'paid' && new Date() > due;
  return {
    _id:      inv._id,
    invoiceNo: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${(inv.merchantId || 'SHP').toUpperCase().slice(0, 6)}-${String(inv._id).slice(-4)}`,
    shopId:   inv.merchantId,
    shopName: inv.shopName || inv.merchantId,
    year:     d.getFullYear(),
    month:    d.getMonth() + 1,
    total:    inv.totalAmount || 0,
    fee:      inv.inGreenFee  || 0,
    count:    1, // 1 invoice = 1 transaction
    couponCode: inv.couponCode,
    username:   inv.username,
    campaignLabel: inv.campaignLabel,
    status:   inv.status === 'paid' ? 'paid' : (isOverdue ? 'overdue' : 'pending'),
    dueDate:  due,
    paidDate: inv.paidAt ? new Date(inv.paidAt) : null,
    paidRef:  inv.paidRef,
    issuedAt: d,
  };
}

/* ── Modal: ดูใบแจ้งหนี้ (Admin view) ── */
function AdminInvoiceModal({ invoice, onClose, onMarkPaid, fmtNum, fmtDate }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  // ★ SPRINT 5: รับ paymentRef ก่อนยิง API
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');

  const handleMarkPaid = async () => {
    if (!paymentRef.trim()) { setError('กรุณาระบุเลขอ้างอิงโอน'); return; }
    setError('');
    setLoading(true);
    try {
      await onMarkPaid(invoice, paymentRef.trim());
      onClose();
    } catch (err) {
      setError(err?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    paid: 'bg-emerald-600',
    pending: 'bg-gradient-to-r from-slate-800 to-slate-700',
    overdue: 'bg-red-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className={`px-8 py-6 flex items-start justify-between ${statusColor[invoice.status]}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">ใบแจ้งหนี้ · Admin View</span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono">{invoice.invoiceNo}</h2>
            <p className="text-white/60 text-sm mt-1">รอบชำระ: {MONTH_TH[invoice.month - 1]} {invoice.year + 543}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* ร้านค้า */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-lg shrink-0">
              {(invoice.shopName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800">{invoice.shopName}</p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{invoice.shopId}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-400">ออกวันที่</p>
              <p className="text-sm font-semibold text-slate-700">{fmtDate(invoice.issuedAt)}</p>
            </div>
          </div>

          {/* รายละเอียดยอด */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 flex justify-between text-sm text-slate-500">
              <span>ยอดขายรวม ({invoice.count} รายการ)</span>
              <span className="font-medium text-slate-700">฿ {fmtNum(invoice.total)}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm text-slate-500 border-t border-slate-100">
              <span>อัตรา GP 5%</span>
              <span className="font-medium text-slate-700">× 5%</span>
            </div>
            <div className="px-5 py-4 flex justify-between bg-white border-t-2 border-slate-200">
              <span className="font-bold text-slate-800">ยอดที่ร้านต้องชำระ</span>
              <span className="font-black text-2xl text-slate-900">฿ {fmtNum(invoice.fee)}</span>
            </div>
          </div>

          {/* วันครบกำหนด */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">วันครบกำหนด</p>
              <p className={`font-bold ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>
                {fmtDate(invoice.dueDate)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">สถานะ</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          {/* paid info */}
          {invoice.status === 'paid' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">InGreen รับชำระแล้ว เมื่อ {fmtDate(invoice.paidDate)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">บันทึกโดยระบบ</p>
              </div>
            </div>
          )}
          {invoice.status === 'overdue' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-800">เลยกำหนดชำระ — ควรติดต่อร้านค้าโดยด่วน</p>
            </div>
          )}
        </div>

        {/* ★ SPRINT 5: Payment Reference input (แสดงตอนกด confirming) */}
        {confirming && (invoice.status === 'pending' || invoice.status === 'overdue') && (
          <div className="px-8 pb-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> เลขอ้างอิงการโอน <span className="text-red-400">*</span>
            </label>
            <input
              type="text" autoFocus
              value={paymentRef}
              onChange={e => { setPaymentRef(e.target.value); setError(''); }}
              placeholder="เช่น TRF20260523-001"
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-400/20' : 'border-slate-200 focus:ring-emerald-400/20 focus:border-emerald-400'}`}
            />
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
            <p className="text-[11px] text-slate-400">บันทึกลง DB จริง — invoice นี้จะ status: paid ทันที</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-8 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
            ปิด
          </button>
          {invoice.status === 'pending' || invoice.status === 'overdue' ? (
            !confirming ? (
              <button onClick={() => setConfirming(true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                <BadgeCheck className="w-4 h-4" /> ยืนยันได้รับชำระแล้ว
              </button>
            ) : (
              <button onClick={handleMarkPaid} disabled={loading || !paymentRef.trim()}
                className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : <><CheckCircle2 className="w-4 h-4" /> บันทึกลง DB</>}
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Badge สถานะ ── */
function StatusBadge({ status }) {
  const cfg = {
    paid: { label: 'ชำระแล้ว', icon: BadgeCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending: { label: 'รอชำระ', icon: Clock, cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    overdue: { label: 'เกินกำหนด', icon: TriangleAlert, cls: 'bg-red-50 text-red-600 border-red-100' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border uppercase tracking-wide ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

/* ── Main Component ── */
export default function AdminInvoices({ showToast }) {
  const fmtNum = (n) => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '—';

  // ★ SPRINT 5: ดึงข้อมูลจาก backend แทน mock buildAllInvoices()
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sendingId, setSendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/settlements/invoices`);
      if (res.data?.success) {
        setInvoices((res.data.items || []).map(normalizeInvoice));
      }
    } catch (err) {
      console.error('load invoices error:', err);
      // log backend error detail
      if (err.response?.data) {
        console.error('  backend response:', err.response.data);
      }
      const msg = err.response?.data?.message || err.message || 'ไม่ทราบสาเหตุ';
      showToast?.(`โหลดใบแจ้งหนี้ล้มเหลว: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.shopName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.shopId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const summary = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalFee: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.fee, 0),
    pendingFee: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.fee, 0),
  };

  // ★ SPRINT 5: ยิง API จริง → backend อัปเดต DB → re-fetch
  const handleMarkPaid = async (paidInv, paymentRef) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/settlements/invoices/${paidInv._id}/mark-paid`, {
        paymentRef,
      });
      if (res.data?.success) {
        showToast(`บันทึกการชำระ ${paidInv.invoiceNo} สำเร็จ ✓`);
        await load(); // refresh จาก DB จริง
      } else {
        throw new Error(res.data?.message || 'ล้มเหลว');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'บันทึกไม่สำเร็จ';
      showToast(msg, 'error');
      throw new Error(msg); // ให้ modal catch ได้
    }
  };

  const handleSendReminder = async (inv, e) => {
    e.stopPropagation();
    setSendingId(inv.invoiceNo);
    await new Promise(r => setTimeout(r, 1000));
    setSendingId(null);
    showToast(`ส่งการแจ้งเตือนถึง "${inv.shopName}" แล้ว ✓`);
  };

  const handleIssueAll = async () => {
    await new Promise(r => setTimeout(r, 800));
    showToast(`ออกใบแจ้งหนี้ให้ร้านค้าทั้งหมด ${summary.pending} ร้านสำเร็จ ✓`);
  };

  return (
    <>
      {selected && (
        <AdminInvoiceModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onMarkPaid={handleMarkPaid}
          fmtNum={fmtNum}
          fmtDate={fmtDate}
        />
      )}

      <div className="space-y-6 animate-fade-in font-sans max-w-7xl mx-auto pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">จัดการใบแจ้งหนี้</h1>
  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border border-emerald-100">Admin</span>
</div>
            <p className="text-sm text-slate-400 mt-0.5">ออกและติดตามค่า GP จากร้านค้าพาร์ทเนอร์ทุกร้าน</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {/* ★ SPRINT 5: ปุ่ม refresh จาก DB */}
            <button onClick={load} disabled={loading} title="โหลดใหม่จาก MongoDB"
              className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-95 disabled:opacity-50">
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleIssueAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" /> ออกใบแจ้งหนี้รอบใหม่
            </button>
          </div>
        </div>


        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'GP รับแล้ว', value: `฿ ${fmtNum(summary.totalFee)}`, sub: `${summary.paid} ใบ`, color: 'emerald', icon: Banknote },
            { label: 'รอชำระ', value: `฿ ${fmtNum(summary.pendingFee)}`, sub: `${summary.pending + summary.overdue} ใบ`, color: 'amber', icon: Clock },
            { label: 'เกินกำหนด', value: `${summary.overdue} ใบ`, sub: 'ต้องติดตาม', color: 'red', icon: TriangleAlert },
            { label: 'ใบทั้งหมด', value: `${summary.total} ใบ`, sub: `${new Set(invoices.map(i => i.shopId)).size} ร้านค้า`, color: 'blue', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
            <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${item.color}-50 text-${item.color}-500 border border-${item.color}-100 shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-base font-black text-slate-800 truncate">{item.value}</p>
                <p className="text-[11px] text-slate-400">{item.sub}</p>
              </div>
            </div>
            );
          })}
        </div>

        {/* Overdue alert */}
        {summary.overdue > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-6 py-4 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-800">มี {summary.overdue} ร้านค้าที่เกินกำหนดชำระ</p>
              <p className="text-sm text-red-600 mt-0.5">ควรส่งการแจ้งเตือนหรือระงับบัญชีชั่วคราว</p>
            </div>
            <button
              onClick={() => setFilterStatus('overdue')}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl shrink-0 transition-colors active:scale-95">
              ดูทั้งหมด
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">ใบแจ้งหนี้ทั้งหมด</h2>
                <p className="text-xs text-slate-400 mt-0.5">แสดง {filtered.length} จาก {invoices.length} ใบ</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Filter tabs */}
              <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100 gap-0.5">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'pending', label: 'รอชำระ' },
                  { id: 'overdue', label: 'เกินกำหนด' },
                  { id: 'paid', label: 'ชำระแล้ว' },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilterStatus(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === f.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ค้นหาร้านค้า / เลขใบ..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">เลขใบแจ้งหนี้</th>
                  <th className="px-6 py-3.5">ร้านค้า</th>
                  <th className="px-6 py-3.5">รอบเดือน</th>
                  <th className="px-6 py-3.5 text-center">รายการ</th>
                  <th className="px-6 py-3.5 text-right">ยอดขาย (฿)</th>
                  <th className="px-6 py-3.5 text-right text-amber-600">GP 5% (฿)</th>
                  <th className="px-6 py-3.5 text-center">สถานะ</th>
                  <th className="px-6 py-3.5 text-right">วันครบกำหนด</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filtered.length > 0 ? filtered.map(inv => (
                  <tr key={inv.invoiceNo} onClick={() => setSelected(inv)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-700 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg tracking-wider">
                        {inv.invoiceNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                          {(inv.shopName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{inv.shopName}</p>
                          <p className="text-[11px] font-mono text-slate-400">{inv.shopId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {MONTH_TH[inv.month - 1]} {inv.year + 543}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 text-sm">{inv.count}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">฿ {fmtNum(inv.total)}</td>
                    <td className="px-6 py-4 text-right font-black text-amber-600">฿ {fmtNum(inv.fee)}</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className={`px-6 py-4 text-right text-xs font-medium ${inv.status === 'overdue' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {fmtDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={(e) => handleSendReminder(inv, e)}
                          disabled={sendingId === inv.invoiceNo}
                          className="text-xs bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-500 hover:text-amber-600 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 ml-auto">
                          {sendingId === inv.invoiceNo
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังส่ง</>
                            : <><Send className="w-3.5 h-3.5" /> แจ้งเตือน</>}
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">ไม่พบใบแจ้งหนี้</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}