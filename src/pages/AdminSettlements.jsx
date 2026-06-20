// AdminSettlements.jsx — InGreen v3 (Model B: Invoice/GP Fee)
//
// ระบบเรียกเก็บค่า GP จากร้านค้า:
//   - ลูกค้าจ่ายเงินที่ร้านโดยตรง — ร้านเก็บเงิน 100%
//   - ระบบบันทึก: ร้านต้องจ่ายค่า GP 5% คืน InGreen
//   - ทุกสัปดาห์ admin ออกใบแจ้งหนี้รวมงวด → ส่งให้ร้าน
//   - ร้านโอนเงิน → admin กรอก ref → ปิดใบแจ้งหนี้
//
// Flow:
//   1. ดู preview (invoices pending grouped by merchant)
//   2. กดออกใบแจ้งหนี้งวดสัปดาห์ (settlement batch)
//   3. คลิกแต่ละใบ → กรอกเลขอ้างอิงที่ร้านโอนมา → mark paid

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Banknote, Calendar, Building2, Loader2, CheckCircle2, Clock,
  Send, AlertCircle, X, ChevronRight, FileText, ArrowRight,
  Wallet, TrendingUp, CreditCard, Hash, Landmark,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const fmtMoney = (n) => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

// ★ Model B: บัญชีรับเงินของ InGreen (ร้านโอน GP มาที่นี่)
const INGREEN_BANK = {
  bankName:    'ธนาคารไทยพาณิชย์ (SCB)',
  bankCode:    'SCB',
  accountNo:   '123-4-56789-0',
  accountName: 'บริษัท อินกรีน จำกัด',
};

/* ── Visual Workflow Stepper (Model B) ───────────────────────────────── */
function WorkflowStepper() {
  const steps = [
    { icon: Wallet,       label: 'ลูกค้าใช้คูปอง',    sub: 'จ่ายร้านโดยตรง' },
    { icon: TrendingUp,   label: 'ระบบคิด GP 5%',     sub: 'บันทึก invoice' },
    { icon: FileText,     label: 'ออกใบแจ้งหนี้งวด', sub: 'รวมรายสัปดาห์' },
    { icon: CreditCard,   label: 'ร้านโอน GP',         sub: 'เข้าบัญชี InGreen' },
    { icon: CheckCircle2, label: 'ปิดใบแจ้งหนี้',     sub: 'admin บันทึก ref' },
  ];
  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-2 border-emerald-100 rounded-3xl p-5">
      <div className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-4">
        Settlement Workflow
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={i}>
              <div className="flex-1 min-w-[110px] text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-black text-slate-700 leading-tight">{s.label}</div>
                <div className="text-[9px] text-slate-500 font-semibold mt-0.5">{s.sub}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Bank Info Editor Modal ──────────────────────────────────────────── */
function BankInfoModal({ merchant, onClose, onSave, processing }) {
  const [form, setForm] = useState({
    bankCode:    merchant.bankInfo?.bankCode    || '',
    bankName:    merchant.bankInfo?.bankName    || '',
    accountNo:   merchant.bankInfo?.accountNo   || '',
    accountName: merchant.bankInfo?.accountName || '',
  });
  const BANKS = [
    { code: 'SCB',    name: 'ธนาคารไทยพาณิชย์ (SCB)' },
    { code: 'KBANK',  name: 'ธนาคารกสิกรไทย (KBANK)' },
    { code: 'BBL',    name: 'ธนาคารกรุงเทพ (BBL)' },
    { code: 'KTB',    name: 'ธนาคารกรุงไทย (KTB)' },
    { code: 'BAY',    name: 'ธนาคารกรุงศรีอยุธยา (BAY)' },
    { code: 'TTB',    name: 'ทีทีบี (TTB)' },
    { code: 'GSB',    name: 'ธนาคารออมสิน (GSB)' },
    { code: 'BAAC',   name: 'ธนาคารเพื่อการเกษตร (BAAC)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Landmark className="w-6 h-6" />
            <div>
              <div className="text-lg font-black">ตั้งค่าบัญชีธนาคาร</div>
              <div className="text-xs opacity-90">{merchant.merchantName}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">ธนาคาร <span className="text-red-500">*</span></label>
            <select
              value={form.bankCode}
              onChange={(e) => {
                const b = BANKS.find(x => x.code === e.target.value);
                setForm({ ...form, bankCode: e.target.value, bankName: b?.name || '' });
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-semibold"
            >
              <option value="">-- เลือกธนาคาร --</option>
              {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">เลขบัญชี <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.accountNo}
              onChange={(e) => setForm({ ...form, accountNo: e.target.value.replace(/[^0-9-]/g, '') })}
              placeholder="123-4-56789-0"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-mono font-bold tracking-wider"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">ชื่อบัญชี <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              placeholder="ชื่อ-นามสกุล หรือชื่อนิติบุคคล"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-semibold"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex gap-3">
          <button onClick={onClose} disabled={processing} className="flex-1 py-3 rounded-xl font-black text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100">ยกเลิก</button>
          <button
            onClick={() => onSave(form)}
            disabled={processing || !form.bankCode || !form.accountNo || !form.accountName}
            className="flex-1 py-3 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Mark-Paid Modal ─────────────────────────────────────────────────── */
function MarkPaidModal({ settlement, onClose, onConfirm, processing }) {
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const handleConfirm = () => {
    if (!paymentRef.trim()) return;
    onConfirm({ paymentRef: paymentRef.trim(), paymentNote: paymentNote.trim() || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Banknote className="w-6 h-6" />
            <div>
              <div className="text-lg font-black">บันทึกการชำระค่า GP</div>
              <div className="text-xs opacity-90">{settlement.merchantName}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">งวด</span>
              <span className="font-bold text-slate-700">{settlement.batchCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">จำนวนรายการ</span>
              <span className="font-bold text-slate-700">{settlement.invoiceCount} ใบเสร็จ</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ยอดขายร้าน (ร้านเก็บ)</span>
              <span className="font-bold text-slate-700">฿ {fmtMoney(settlement.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">เก็บไว้ที่ร้าน (95%)</span>
              <span className="font-bold text-slate-500">฿ {fmtMoney(settlement.netAmount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-black text-slate-800">ค่า GP ที่ร้านต้องโอน (5%)</span>
              <span className="font-black text-orange-700 text-lg">฿ {fmtMoney(settlement.feeAmount)}</span>
            </div>
          </div>

          {/* InGreen bank info — ร้านโอนมาที่บัญชีนี้ */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Landmark className="w-3 h-3" /> ร้านต้องโอนมาที่บัญชี InGreen
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-black text-blue-900">{INGREEN_BANK.bankName}</div>
              <div className="font-mono font-bold text-blue-800 tracking-wider">{INGREEN_BANK.accountNo}</div>
              <div className="text-blue-700 font-semibold">{INGREEN_BANK.accountName}</div>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">เลขอ้างอิงที่ร้านโอนมา <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="เช่น slip ref / transaction id"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">หมายเหตุ (ไม่บังคับ)</label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              rows={2}
              placeholder="เช่น โอนมาทาง Promptpay / สลิปแนบทาง Line"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-semibold resize-none"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex gap-3">
          <button onClick={onClose} disabled={processing} className="flex-1 py-3 rounded-xl font-black text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-100">ยกเลิก</button>
          <button
            onClick={handleConfirm}
            disabled={processing || !paymentRef.trim()}
            className="flex-1 py-3 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            ยืนยันรับชำระ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */
export default function AdminSettlements({ showToast }) {
  const [preview, setPreview]   = useState(null);
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [bankEditFor, setBankEditFor] = useState(null);   // merchant object for bank editor

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/settlements/preview`),
        axios.get(`${API_BASE_URL}/api/settlements`),
      ]);
      setPreview(pRes.data?.preview);
      setBatches(lRes.data?.batches || []);
    } catch (err) {
      console.error(err);
      showToast?.('โหลดข้อมูลล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/settlements/create`, { createdBy: 'admin' });
      if (res.data?.success) {
        showToast?.(`✅ สร้างใบจ่ายงวด ${res.data.batchCode} เรียบร้อย`);
        load();
      }
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.message || 'สร้างไม่สำเร็จ', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveBank = async (form) => {
    if (!bankEditFor) return;
    setProcessing(true);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/settlements/merchant-bank/${bankEditFor.merchantId}`, form);
      if (res.data?.success) {
        showToast?.('✅ บันทึกข้อมูลบัญชีเรียบร้อย');
        setBankEditFor(null);
        load();
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async ({ paymentRef, paymentNote }) => {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/settlements/${selected._id}/mark-paid`, {
        paymentRef, paymentNote, paidBy: 'admin',
      });
      if (res.data?.success) {
        showToast?.('✅ บันทึกการจ่ายเรียบร้อย — invoices ใน batch นี้ถูก mark paid');
        setSelected(null);
        load();
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || 'ล้มเหลว', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            ระบบเคลียร์เงินร้านค้า
          </h1>
          <p className="text-slate-500 mt-2">เรียกเก็บค่า GP 5% จากร้านค้า — รวมยอดงวดสัปดาห์ + ออกใบแจ้งหนี้ + บันทึกการชำระ</p>
        </div>
        <button onClick={load} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />รีเฟรช
        </button>
      </div>

      {/* Workflow stepper */}
      <WorkflowStepper />

      {/* Preview card */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : preview && preview.totalMerchants > 0 ? (
        <div className="bg-white border-2 border-emerald-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-emerald-700 uppercase tracking-wider">รอออกใบแจ้งหนี้งวดนี้</div>
              <div className="text-lg font-black text-slate-800 mt-0.5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />{preview.period.label}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">{preview.batchCode}</div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:bg-slate-300"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              ออกใบแจ้งหนี้งวดนี้
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">ร้านค้า</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{preview.totalMerchants}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">รายการ</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{preview.totalInvoices}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">ยอดขายร้านรวม</div>
              <div className="text-2xl font-black text-slate-700 mt-1">฿ {fmtMoney(preview.totalNet + preview.totalFee)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">GP เรียกเก็บรวม</div>
              <div className="text-2xl font-black text-orange-700 mt-1">฿ {fmtMoney(preview.totalFee)}</div>
            </div>
          </div>

          {/* Merchants list */}
          <div className="divide-y divide-slate-100">
            {preview.merchants.map((m) => (
              <div key={m.merchantId} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-slate-800">{m.merchantName}</div>
                    <div className="text-xs text-slate-500 font-semibold">
                      {m.invoiceCount} ใบเสร็จ · ยอดขายร้าน ฿ {fmtMoney(m.grossAmount)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-bold">ค่า GP ต้องจ่าย</div>
                  <div className="text-lg font-black text-orange-700">฿ {fmtMoney(m.feeAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
          <div className="w-14 h-14 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="font-black text-slate-700">ไม่มี invoice รอเคลียร์</div>
          <div className="text-sm text-slate-500 mt-1">ทุกอย่าง up-to-date</div>
        </div>
      )}

      {/* Batches list */}
      <div>
        <h2 className="text-xl font-black text-slate-800 mb-4">ประวัติใบแจ้งหนี้รายงวด</h2>
        {batches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">ยังไม่มีประวัติ</div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => {
              const totalFee = batch.settlements.reduce((s, x) => s + (x.feeAmount || 0), 0);
              return (
              <div key={batch.batchCode} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-black text-slate-800 text-sm">{batch.batchCode}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{batch.period?.label || fmtDate(batch.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    {batch.paidCount > 0 && <span className="text-emerald-700">{batch.paidCount} ชำระแล้ว</span>}
                    {batch.pendingCount > 0 && <span className="text-amber-700">{batch.pendingCount} รอชำระ</span>}
                    <span className="text-orange-700">GP รวม ฿ {fmtMoney(totalFee)}</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {batch.settlements.map((s) => (
                    <div key={s._id} className={`px-5 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${s.status === 'pending' ? 'border-l-4 border-amber-400' : 'border-l-4 border-emerald-400'}`} onClick={() => s.status === 'pending' && setSelected(s)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-sm">{s.merchantName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">
                            {s.invoiceCount} ใบเสร็จ · ยอดขาย ฿ {fmtMoney(s.grossAmount)}
                            {s.paymentRef && <span className="ml-2 text-emerald-700 font-bold inline-flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{s.paymentRef}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-bold uppercase">{s.status === 'paid' ? 'ชำระแล้ว' : 'ค่า GP'}</div>
                          <div className={`font-black ${s.status === 'paid' ? 'text-emerald-700' : 'text-orange-700'}`}>฿ {fmtMoney(s.feeAmount)}</div>
                        </div>
                        {s.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5"
                          >
                            <Banknote className="w-3.5 h-3.5" />รับชำระ
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <MarkPaidModal
          settlement={selected}
          onClose={() => !processing && setSelected(null)}
          onConfirm={handleMarkPaid}
          processing={processing}
        />
      )}
    </div>
  );
}
