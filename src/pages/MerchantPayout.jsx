import React, { useState } from 'react';
import axios from 'axios';
import {
  Banknote, Clock, CheckCircle2, AlertCircle, CalendarDays,
  FileText, CreditCard, X, Download, ChevronRight, QrCode,
  Building2, Copy, BadgeCheck, Loader2, Receipt, ArrowRight,
  Landmark, TriangleAlert
} from 'lucide-react';
import { API_BASE_URL } from '../config';

function generateInvoiceHistory(transactions, shopId, shopName) {
  if (!transactions.length) return [];

  const byMonth = {};
  transactions.forEach(txn => {
    const d = new Date(txn.redeemedAt || txn.createdAt || new Date());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { key, year: d.getFullYear(), month: d.getMonth() + 1, total: 0, fee: 0, count: 0 };
    byMonth[key].total += txn.totalAmount || 0;
    byMonth[key].fee += txn.inGreenFee || 0;
    byMonth[key].count++;
  });

  const sorted = Object.values(byMonth).sort((a, b) => b.key.localeCompare(a.key));
  const now = new Date();

  return sorted.map((p, i) => {
    const isCurrentMonth = p.year === now.getFullYear() && p.month === now.getMonth() + 1;
    const dueDate = new Date(p.year, p.month, 5);
    const isOverdue = !isCurrentMonth && dueDate < now && i !== 0;
    const invoiceNo = `INV-${p.year}${String(p.month).padStart(2, '0')}-${(shopId || 'SHP').toUpperCase().slice(0, 6)}`;

    return {
      ...p,
      invoiceNo,
      shopId,
      shopName,
      dueDate,
      status: isCurrentMonth ? 'pending' : (isOverdue ? 'overdue' : 'paid'),
      paidDate: (!isCurrentMonth && !isOverdue) ? new Date(p.year, p.month, 3) : null,
    };
  });
}

function InvoiceModal({ invoice, onClose, onPay, fmtNum, fmtDate, MONTH_TH }) {
  const isPending = invoice.status === 'pending' || invoice.status === 'overdue';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className={`px-8 py-6 flex items-start justify-between ${invoice.status === 'overdue' ? 'bg-red-600' : invoice.status === 'paid' ? 'bg-emerald-600' : 'bg-gradient-to-r from-slate-800 to-slate-700'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">ใบแจ้งหนี้</span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono">{invoice.invoiceNo}</h2>
            <p className="text-white/60 text-sm mt-1">รอบชำระ: {MONTH_TH[invoice.month - 1]} {invoice.year + 543}</p>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === 'paid' && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" /> ชำระแล้ว
              </span>
            )}
            {invoice.status === 'overdue' && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <TriangleAlert className="w-3.5 h-3.5" /> เกินกำหนด
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">ถึง (Bill To)</p>
              <p className="font-bold text-slate-800">{invoice.shopName || invoice.shopId}</p>
              <p className="text-slate-400 text-xs font-mono mt-0.5">{invoice.shopId}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">จาก (Bill From)</p>
              <p className="font-bold text-slate-800">InGreen Platform</p>
              <p className="text-slate-400 text-xs mt-0.5">บจก. อินกรีน เทคโนโลยี</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">วันครบกำหนด</p>
              <p className={`font-bold ${invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>{fmtDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">จำนวนธุรกรรม</p>
              <p className="font-bold text-slate-800">{invoice.count} รายการ</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 flex justify-between text-sm text-slate-500">
              <span>ยอดขายรวมผ่านแพลตฟอร์ม</span>
              <span className="font-medium text-slate-700">฿ {fmtNum(invoice.total)}</span>
            </div>
            <div className="px-5 py-3 flex justify-between text-sm text-slate-500 border-t border-slate-100">
              <span>อัตรา GP (InGreen Fee 5%)</span>
              <span className="font-medium text-slate-700">× 5%</span>
            </div>
            <div className="px-5 py-4 flex justify-between bg-white border-t-2 border-slate-200">
              <span className="font-bold text-slate-800">ยอดที่ต้องชำระ</span>
              <span className="font-black text-xl text-slate-900">฿ {fmtNum(invoice.fee)}</span>
            </div>
          </div>

          {invoice.status === 'paid' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">ชำระเงินแล้วเมื่อ {fmtDate(invoice.paidDate)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">ขอบคุณที่ชำระตรงเวลา</p>
              </div>
            </div>
          )}
          {invoice.status === 'overdue' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">เกินกำหนดชำระ — กรุณาดำเนินการโดยด่วน</p>
                <p className="text-xs text-red-600 mt-0.5">อาจถูกระงับการใช้งานหากไม่ชำระ</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
            <Download className="w-4 h-4" /> ดาวน์โหลด PDF
          </button>
          {isPending && (
            <button onClick={() => onPay(invoice)}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm">
              <CreditCard className="w-4 h-4" /> ชำระเงินเลย
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ invoice, onClose, onSuccess, fmtNum, MONTH_TH }) {
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState('');

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1800));
    setIsProcessing(false);
    setStep('done');
    setTimeout(() => { onSuccess(invoice); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-0.5">ชำระค่า GP</p>
            <h2 className="text-white font-black text-lg">฿ {fmtNum(invoice.fee)}</h2>
            <p className="text-emerald-200 text-xs mt-0.5">{invoice.invoiceNo} · {MONTH_TH[invoice.month - 1]} {invoice.year + 543}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600 mb-4">เลือกช่องทางการชำระเงิน</p>
              {[
                { id: 'qr', icon: QrCode, label: 'พร้อมเพย์ / QR Code', sub: 'สแกนจ่ายได้ทุกธนาคาร' },
                { id: 'bank', icon: Landmark, label: 'โอนผ่านธนาคาร', sub: 'กสิกรไทย / ไทยพาณิชย์ / กรุงเทพ' },
              ].map(opt => (
                <button key={opt.id}
                  onClick={() => { setMethod(opt.id); setStep(opt.id); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-400 hover:bg-emerald-50 group text-left transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 shrink-0">
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {step === 'qr' && (
  <div className="text-center space-y-4">
    <p className="text-sm font-semibold text-slate-600">สแกน QR Code พร้อมเพย์</p>

    {/* QR พร้อมเพย์เหมือนจริง */}
    <div className="relative mx-auto w-52 h-52">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* พื้นหลังขาว + border */}
        <rect width="200" height="200" fill="white" rx="12"/>
        <rect x="1" y="1" width="198" height="198" fill="none" stroke="#e2e8f0" strokeWidth="2" rx="11"/>

        {/* ── Finder Pattern TL ── */}
        <rect x="14" y="14" width="49" height="49" rx="4" fill="#1e293b"/>
        <rect x="20" y="20" width="37" height="37" rx="2" fill="white"/>
        <rect x="26" y="26" width="25" height="25" rx="1" fill="#1e293b"/>

        {/* ── Finder Pattern TR ── */}
        <rect x="137" y="14" width="49" height="49" rx="4" fill="#1e293b"/>
        <rect x="143" y="20" width="37" height="37" rx="2" fill="white"/>
        <rect x="149" y="26" width="25" height="25" rx="1" fill="#1e293b"/>

        {/* ── Finder Pattern BL ── */}
        <rect x="14" y="137" width="49" height="49" rx="4" fill="#1e293b"/>
        <rect x="20" y="143" width="37" height="37" rx="2" fill="white"/>
        <rect x="26" y="149" width="25" height="25" rx="1" fill="#1e293b"/>

        {/* ── Timing Patterns ── */}
        {[77,84,91,98,105,112,119].map((x,i) => i%2===0 && <rect key={x} x={x} y="75" width="6" height="6" fill="#1e293b"/>)}
        {[77,84,91,98,105,112,119].map((y,i) => i%2===0 && <rect key={y} x="75" y={y} width="6" height="6" fill="#1e293b"/>)}

        {/* ── Data modules (pattern จำลอง) ── */}
        {[
          [77,14],[84,14],[91,14],[105,14],[119,14],[126,14],
          [77,21],[98,21],[112,21],[119,21],
          [84,28],[91,28],[105,28],[126,28],
          [77,35],[84,35],[112,35],[119,35],[126,35],
          [91,42],[98,42],[105,42],
          [77,49],[84,49],[98,49],[112,49],[119,49],
          [77,56],[91,56],[105,56],[126,56],
          [84,63],[98,63],[112,63],[119,63],[126,63],
          [14,77],[21,77],[42,77],[56,77],[63,77],
          [14,84],[35,84],[49,84],[63,84],
          [21,91],[28,91],[42,91],[56,91],
          [14,98],[28,98],[49,98],[63,98],
          [14,105],[21,105],[35,105],[42,105],[56,105],
          [28,112],[49,112],[63,112],
          [14,119],[21,119],[35,119],[56,119],[63,119],
          [14,126],[28,126],[42,126],[49,126],
          [77,77],[84,77],[98,77],[119,77],[126,77],
          [77,84],[91,84],[105,84],[112,84],
          [84,91],[98,91],[119,91],[126,91],
          [77,98],[91,98],[105,98],[112,98],
          [84,105],[77,105],[98,105],[126,105],
          [91,112],[112,112],[119,112],
          [77,119],[84,119],[105,119],[126,119],
          [91,126],[98,126],[112,126],[119,126],
          [137,77],[144,77],[158,77],[165,77],[179,77],
          [137,84],[151,84],[172,84],[179,84],
          [144,91],[158,91],[165,91],[179,91],
          [137,98],[151,98],[165,98],[172,98],
          [144,105],[158,105],[172,105],[179,105],
          [137,112],[151,112],[158,112],[179,112],
          [144,119],[165,119],[172,119],
          [137,126],[151,126],[158,126],[179,126],
          [14,137],[28,137],[49,137],[56,137],
          [14,144],[21,144],[42,144],[63,144],
          [35,151],[49,151],[56,151],
          [14,158],[21,158],[35,158],[42,158],[63,158],
          [28,165],[49,165],[56,165],[63,165],
          [14,172],[35,172],[42,172],[56,172],
          [21,179],[28,179],[49,179],[63,179],
          [77,137],[91,137],[105,137],[119,137],[126,137],
          [84,144],[98,144],[112,144],[179,144],
          [77,151],[91,151],[119,151],[137,151],[144,151],[158,151],[172,151],
          [84,158],[98,158],[105,158],[126,158],[144,158],[165,158],[179,158],
          [77,165],[112,165],[137,165],[151,165],[172,165],
          [91,172],[98,172],[119,172],[126,172],[144,172],[158,172],
          [77,179],[84,179],[105,179],[112,179],[137,179],[151,179],[165,179],[179,179],
        ].map(([x,y],i) => <rect key={i} x={x} y={y} width="6" height="6" fill="#1e293b"/>)}

        {/* ── โลโก้ตรงกลาง ── */}
        <rect x="83" y="83" width="34" height="34" rx="6" fill="white"/>
        <rect x="85" y="85" width="30" height="30" rx="5" fill="#059669"/>
        <text x="100" y="106" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">฿</text>
      </svg>
    </div>

    {/* ข้อมูลบัญชี */}
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">พร้อมเพย์</span>
        <span className="font-mono font-bold text-slate-700 text-xs">099-999-9999</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs">ชื่อบัญชี</span>
        <span className="font-bold text-slate-700 text-xs">บจก. อินกรีน เทคโนโลยี</span>
      </div>
      <div className="border-t border-emerald-100 pt-1.5 flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium">ยอดชำระ</span>
        <span className="text-emerald-600 font-black text-base">฿ {fmtNum(invoice.fee)}</span>
      </div>
    </div>

    <p className="text-xs text-slate-400">
      QR หมดอายุ: {new Date(Date.now() + 15 * 60000).toLocaleTimeString('th-TH', { timeStyle: 'short' })} น.
    </p>
    <button onClick={() => setStep('confirm')}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95">
      ชำระเงินสำเร็จ <ArrowRight className="w-4 h-4" />
    </button>
    <button onClick={() => setStep('method')} className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors">← กลับ</button>
  </div>
)}

          {step === 'bank' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-600">โอนเงินมายังบัญชีนี้</p>
              {[
                { bank: 'ธนาคารกสิกรไทย', no: '123-4-56789-0', name: 'บจก. อินกรีน เทคโนโลยี' },
                { bank: 'ธนาคารไทยพาณิชย์', no: '987-6-54321-0', name: 'บจก. อินกรีน เทคโนโลยี' },
              ].map(acc => (
                <div key={acc.bank} className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{acc.bank}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-black text-slate-800 text-lg">{acc.no}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{acc.name}</p>
                    </div>
                    <button onClick={() => handleCopy(acc.no.replace(/-/g, ''), acc.bank)}
                      className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
                      {copied === acc.bank ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> คัดลอกแล้ว</> : <><Copy className="w-3.5 h-3.5" /> คัดลอก</>}
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                กรุณาโอน <strong>฿ {fmtNum(invoice.fee)}</strong> พอดี และระบุ <strong>{invoice.invoiceNo}</strong> ในหมายเหตุ
              </div>
              <button onClick={() => setStep('confirm')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95">
                ชำระเงินสำเร็จ <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setStep('method')} className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors">← กลับ</button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ยืนยันการชำระเงิน</h3>
                <p className="text-slate-400 text-sm mt-1">ระบบจะบันทึกการชำระเงินและส่งใบเสร็จให้คุณ</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-5 py-4 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">ใบแจ้งหนี้</span><span className="font-mono font-bold text-slate-700">{invoice.invoiceNo}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ยอดชำระ</span><span className="font-black text-emerald-600">฿ {fmtNum(invoice.fee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ช่องทาง</span><span className="font-medium text-slate-700">{method === 'qr' ? 'พร้อมเพย์ / QR' : 'โอนธนาคาร'}</span></div>
              </div>
              <button onClick={handleConfirmPayment} disabled={isProcessing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm shadow-emerald-100">
                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : <><BadgeCheck className="w-4 h-4" /> ยืนยันชำระเงิน</>}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <BadgeCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-800 text-xl">ชำระเงินสำเร็จ! 🎉</h3>
              <p className="text-slate-400 text-sm">บันทึกการชำระเงินแล้ว ขอบคุณที่ชำระตรงเวลา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MerchantPayout({ data, showToast }) {
  const shopId = localStorage.getItem('merchantId') || '';
  const shopName = localStorage.getItem('merchantName') || 'ร้านค้า';
  const shop = (data?.shops || []).find(s => s.id === shopId);
  const transactions = shop?.transactions || [];

  const [invoices, setInvoices] = useState(() => generateInvoiceHistory(transactions, shopId, shopName));
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  // ★ v3: ใบจ่ายงวด (Settlement) จาก InGreen
  const [settlements, setSettlements] = useState([]);
  const [settlementSummary, setSettlementSummary] = useState({ totalPaid: 0, totalPending: 0, countPaid: 0, countPending: 0 });

  React.useEffect(() => {
    if (!shopId) return;
    axios.get(`${API_BASE_URL}/api/settlements/merchant/${shopId}`)
      .then(r => {
        if (r.data?.success) {
          setSettlements(r.data.items || []);
          setSettlementSummary(r.data.summary || { totalPaid: 0, totalPending: 0, countPaid: 0, countPending: 0 });
        }
      }).catch(() => {});
  }, [shopId]);

  const fmtNum = (n) => (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '—';
  const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const handlePaymentSuccess = (paidInvoice) => {
    setInvoices(prev => prev.map(inv =>
      inv.invoiceNo === paidInvoice.invoiceNo
        ? { ...inv, status: 'paid', paidDate: new Date() }
        : inv
    ));
    showToast?.(`ชำระ ${paidInvoice.invoiceNo} สำเร็จ ✓`, 'success');
  };

  const totalPaid = invoices.filter(p => p.status === 'paid').reduce((s, p) => s + p.fee, 0);
  const pendingInvoice = invoices.find(p => p.status === 'pending');
  const overdueInvoices = invoices.filter(p => p.status === 'overdue');

  const statusConfig = {
    paid: { label: 'ชำระแล้ว', icon: BadgeCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending: { label: 'รอชำระ', icon: Clock, cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    overdue: { label: 'เกินกำหนด', icon: TriangleAlert, cls: 'bg-red-50 text-red-600 border-red-100' },
  };

  return (
    <>
      {selectedInvoice && !payingInvoice && (
        <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)}
          onPay={(inv) => { setSelectedInvoice(null); setPayingInvoice(inv); }}
          fmtNum={fmtNum} fmtDate={fmtDate} MONTH_TH={MONTH_TH} />
      )}
      {payingInvoice && (
        <PaymentModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)}
          onSuccess={handlePaymentSuccess} fmtNum={fmtNum} MONTH_TH={MONTH_TH} />
      )}

      <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">รอบการชำระเงิน</h1>
          <p className="text-sm text-slate-400 mt-0.5">ใบแจ้งหนี้ชำระค่า GP จาก InGreen · ครบกำหนดชำระวันที่ 5 ของเดือนถัดไป</p>
        </div>

        {/* ★ v3: ใบแจ้งหนี้ค่า GP (Settlement) — ร้านต้องโอนให้ InGreen ทุกสัปดาห์ */}
        {settlements.length > 0 && (
          <div className="bg-white border-2 border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-800">ใบแจ้งหนี้ค่า GP รายสัปดาห์</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">5% ของยอดขายที่ใช้คูปอง — โอนให้ InGreen ตามรอบ</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500 font-bold uppercase">ชำระแล้วรวม</div>
                <div className="font-black text-emerald-700 text-lg">฿ {fmtNum(settlementSummary.totalPaid)}</div>
                {settlementSummary.totalPending > 0 && (
                  <div className="text-[11px] text-orange-700 font-bold">ค้างชำระ ฿ {fmtNum(settlementSummary.totalPending)}</div>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {settlements.slice(0, 10).map((s) => (
                <div key={s._id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {s.status === 'paid' ? <BadgeCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-sm">{s.batchCode}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {s.period?.label || ''} · {s.invoiceCount} ใบเสร็จ · ยอดขาย ฿ {fmtNum(s.grossAmount)}
                        {s.paymentRef && <span className="ml-2 text-emerald-700 font-bold">ref: {s.paymentRef}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{s.status === 'paid' ? 'ชำระแล้ว' : 'ค่า GP ค้างจ่าย'}</div>
                    <div className={`font-black ${s.status === 'paid' ? 'text-emerald-700' : 'text-orange-700'}`}>฿ {fmtNum(s.feeAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-6 py-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-800">มีใบแจ้งหนี้เกินกำหนด {overdueInvoices.length} รายการ</p>
              <p className="text-sm text-red-600 mt-0.5">กรุณาชำระโดยด่วนเพื่อหลีกเลี่ยงการระงับบัญชี</p>
            </div>
            <button onClick={() => setPayingInvoice(overdueInvoices[0])}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shrink-0 active:scale-95">
              <CreditCard className="w-4 h-4" /> ชำระเลย
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
<div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 relative overflow-hidden shadow-md shadow-amber-900/10">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-bl-full transform translate-x-6 -translate-y-6" />
            <p className="text-amber-100 text-xs font-medium mb-1 relative z-10">GP ที่ชำระแล้วทั้งหมด</p>
            <h3 className="text-2xl font-bold text-white relative z-10">฿ {fmtNum(totalPaid)}</h3>
            <p className="text-amber-200 text-xs mt-2 relative z-10">{invoices.filter(p => p.status === 'paid').length} ใบแจ้งหนี้</p>
          </div>

          <div className={`rounded-2xl p-6 border-2 ${pendingInvoice ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`w-4 h-4 ${pendingInvoice ? 'text-amber-500' : 'text-slate-300'}`} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">รอบปัจจุบัน</p>
            </div>
            {pendingInvoice ? (
              <>
                <h3 className="text-2xl font-bold text-amber-700">฿ {fmtNum(pendingInvoice.fee)}</h3>
                <p className="text-amber-600 text-xs mt-1.5 font-medium flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> ครบกำหนด: {fmtDate(pendingInvoice.dueDate)}
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm font-medium">ไม่มีใบแจ้งหนี้ค้างชำระ</p>
            )}
          </div>

          {(pendingInvoice || overdueInvoices[0]) && (
            <button onClick={() => setPayingInvoice(pendingInvoice || overdueInvoices[0])}
              className="rounded-2xl p-6 bg-white border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group flex flex-col items-center justify-center gap-3 active:scale-95">
<div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-500 transition-colors flex items-center justify-center">
  <CreditCard className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 group-hover:text-amber-700 transition-colors text-sm">
ชำระค่า GP เดือนนี้</p>
                <p className="text-xs text-slate-400 mt-0.5">QR Code / โอนธนาคาร</p>
              </div>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">ประวัติใบแจ้งหนี้</h2>
              <p className="text-xs text-slate-400 mt-0.5">ทั้งหมด {invoices.length} ใบ · คลิกเพื่อดูรายละเอียด</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">เลขใบแจ้งหนี้</th>
                  <th className="px-6 py-3.5">รอบเดือน</th>
                  <th className="px-6 py-3.5 text-center">ออเดอร์</th>
                  <th className="px-6 py-3.5 text-right">ยอดขาย (฿)</th>
                  <th className="px-6 py-3.5 text-right text-amber-600">ค่า GP 5% (฿)</th>
                  <th className="px-6 py-3.5 text-center">สถานะ</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {invoices.length > 0 ? invoices.map((inv) => {
                  const cfg = statusConfig[inv.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={inv.invoiceNo} onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-700 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg tracking-wider">{inv.invoiceNo}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{MONTH_TH[inv.month - 1]} {inv.year + 543}</td>
                      <td className="px-6 py-4 text-center text-slate-500">{inv.count}</td>
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">฿ {fmtNum(inv.total)}</td>
                      <td className="px-6 py-4 text-right font-black text-amber-600">฿ {fmtNum(inv.fee)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border uppercase tracking-wide ${cfg.cls}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(inv.status === 'pending' || inv.status === 'overdue') ? (
                          <button onClick={e => { e.stopPropagation(); setPayingInvoice(inv); }}
className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
>
                            <CreditCard className="w-3.5 h-3.5" /> ชำระ
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium">{fmtDate(inv.paidDate)}</span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="7" className="py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-sm">ยังไม่มีใบแจ้งหนี้</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> ขั้นตอนการชำระค่า GP
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center">
            {[
              { step: '1', label: 'สิ้นเดือน', sub: 'InGreen สรุปยอดขาย' },
              { step: '2', label: 'ออกใบแจ้งหนี้', sub: 'ส่งผ่านระบบ + อีเมล' },
              { step: '3', label: 'ชำระ GP 5%', sub: 'ภายในวันที่ 5 เดือนถัดไป' },
              { step: '4', label: 'ยืนยันการรับเงิน', sub: 'InGreen ส่งใบเสร็จ' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.step}>
                <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1.5 flex-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">{s.step}</div>
                  <div className="sm:text-center">
                    <p className="text-xs font-bold text-slate-700">{s.label}</p>
                    <p className="text-[11px] text-slate-400">{s.sub}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}