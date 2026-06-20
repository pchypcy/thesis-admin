import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Receipt, Minus, Plus, ChevronRight, Zap, Clock, ShieldCheck, Hourglass } from 'lucide-react';
import { API_BASE_URL } from '../config';

// ★ Sprint 6: parse "ส่วนลด 15%" / "ส่วนลด 50฿" → คำนวณ discount auto
function parseDiscountFromText(text, originalAmount) {
  if (!text || !originalAmount) return null;
  const s = String(text);
  const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) {
    const p = parseFloat(pct[1]);
    return Math.round(originalAmount * p) / 100;
  }
  const fix = s.match(/(\d+(?:\.\d+)?)\s*[฿บาท]/);
  if (fix) return parseFloat(fix[1]);
  return null;
}

// ─── Amount Modal (★ Sprint 6: 2-step — Input → Order Summary) ──────────────
function AmountModal({ couponCode, couponInfo, onConfirm, onCancel }) {
  const [step, setStep] = useState('input');   // 'input' | 'summary'
  const [original, setOriginal] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountTouched, setDiscountTouched] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const presets = [50, 100, 150, 200, 300, 500];
  const discountValueText = couponInfo?.discountValue || null;

  // auto-suggest discount จาก discountValue เมื่อ user ยังไม่แตะ
  useEffect(() => {
    if (discountTouched) return;
    const sug = parseDiscountFromText(discountValueText, parseFloat(original));
    if (sug != null && sug > 0) setDiscount(String(sug));
    else if (sug == null) setDiscount('');
  }, [original, discountValueText, discountTouched]);

  const originalNum = parseFloat(original) || 0;
  const discountNum = parseFloat(discount) || 0;
  const netNum      = Math.max(0, originalNum - discountNum);

  const handleNext = () => {
    if (!originalNum || originalNum <= 0) { setError('กรุณาระบุราคาเต็ม'); return; }
    if (discountNum < 0)                   { setError('ส่วนลดต้องไม่ติดลบ'); return; }
    if (discountNum > originalNum)         { setError('ส่วนลดมากกว่าราคาเต็ม'); return; }
    setError('');
    setStep('summary');
  };

  const handleFinalConfirm = () => {
    onConfirm({ originalAmount: originalNum, discountAmount: discountNum, totalAmount: netNum });
  };

  const adjust = (delta) => {
    const cur = originalNum;
    const next = Math.max(1, cur + delta);
    setOriginal(String(next));
    setError('');
  };

  // คำนวณเวลาที่เหลือจาก expiresAt
  const getTimeLeft = () => {
    if (!couponInfo?.expiresAt) return null;
    const diff = new Date(couponInfo.expiresAt) - new Date();
    if (diff <= 0) return '00:00';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  useEffect(() => {
    if (!couponInfo?.expiresAt) return;
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [couponInfo]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-6 pb-8 relative">
          <div className="absolute -bottom-4 left-0 right-0 h-4 bg-white rounded-t-3xl" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-amber-100 text-xs font-medium">รหัสคูปองที่สแกนได้</p>
              <p className="text-white font-bold font-mono text-lg tracking-wider">{couponCode}</p>
            </div>
          </div>
          {/* ★ SPRINT 2: แสดงชื่อลูกค้า + countdown timer */}
          {couponInfo && (
            <div className="flex items-center justify-between mt-2">
              {couponInfo.username && (
                <span className="text-amber-100 text-xs font-medium">
                  ลูกค้า: <span className="text-white font-semibold">{couponInfo.username}</span>
                </span>
              )}
              {timeLeft && (
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-bold font-mono">{timeLeft}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {step === 'input' ? (
          <div className="px-6 pt-6 pb-8 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">ราคาเต็ม (ก่อนส่วนลด)</p>
                {discountValueText && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    โปร: {discountValueText}
                  </span>
                )}
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <button onClick={() => adjust(-10)} className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-95 shrink-0">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">฿</span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    value={original}
                    onChange={e => { setOriginal(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    placeholder="0"
                    inputMode="decimal"
                    className="w-full pl-9 pr-4 py-3 text-center text-2xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
                <button onClick={() => adjust(10)} className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-95 shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preset amounts */}
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">ราคาที่ใช้บ่อย</p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map(p => (
                  <button key={p} onClick={() => { setOriginal(String(p)); setError(''); }}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${original === String(p) ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600'}`}>
                    ฿{p}
                  </button>
                ))}
              </div>
            </div>

            {/* ★ Sprint 6: Discount input (auto-suggested) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">ส่วนลดที่ใช้ (฿)</p>
                {!discountTouched && discountNum > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">⚡ คำนวณอัตโนมัติจากโปร</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">฿</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => { setDiscount(e.target.value); setDiscountTouched(true); setError(''); }}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-full pl-9 pr-4 py-2.5 text-center text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Live net preview */}
            {originalNum > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-emerald-800 font-bold text-sm">ราคาสุทธิที่ลูกค้าจ่าย</span>
                <span className="font-black text-emerald-700 text-xl">฿ {netNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95 min-h-[44px]">
                ยกเลิก
              </button>
              <button onClick={handleNext} disabled={!originalNum}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md shadow-amber-100 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                ดูสรุปยอด <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ★ Sprint 6: STEP 2 — Order Summary Review */
          <div className="px-6 pt-6 pb-8 space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <Receipt className="w-4 h-4" />
              <span className="text-sm font-bold">สรุปยอดคูปอง — ตรวจก่อนยืนยัน</span>
            </div>

            {/* Order Summary card */}
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-500 font-semibold">ราคาเต็ม</span>
                <span className="text-lg font-bold text-slate-800">฿ {originalNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                  ส่วนลด
                  {discountValueText && <span className="text-[10px] text-amber-500">({discountValueText})</span>}
                </span>
                <span className="text-lg font-bold text-amber-600">- ฿ {discountNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                <span className="text-base text-emerald-700 font-black">ราคาสุทธิ</span>
                <span className="text-2xl font-black text-emerald-600">฿ {netNum.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* GP info (informational — ส่วนของร้าน) */}
            <div className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" />หัก InGreen Fee 5% (จากยอดสุทธิ)</span>
                <span className="font-semibold text-red-500">- ฿ {(netNum * 0.05).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-emerald-600 font-bold">ยอดสุทธิที่ร้านได้รับ</span>
                <span className="font-black text-emerald-600">฿ {(netNum * 0.95).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <Receipt className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                ลูกค้าจะเห็นสรุปยอดนี้บนหน้าจอ และต้องกดยืนยันใน 3 นาที
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep('input')}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95 min-h-[44px]">
                ← ย้อนแก้
              </button>
              <button onClick={handleFinalConfirm}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md shadow-emerald-100 min-h-[44px]">
                ส่งให้ลูกค้ายืนยัน <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Waiting Customer Confirm Modal (★ SPRINT 5) ────────────────────────────
// แสดงระหว่างรอลูกค้ายืนยันยอด — มี countdown 3 นาที + status text
function WaitingConfirmModal({ couponCode, totalAmount, orderSummary, confirmExpiresAt, statusMsg, onCancel }) {
  const getTimeLeft = () => {
    if (!confirmExpiresAt) return null;
    const diff = new Date(confirmExpiresAt) - new Date();
    if (diff <= 0) return '0:00';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  useEffect(() => {
    if (!confirmExpiresAt) return;
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmExpiresAt]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 pt-7 pb-6 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-[11px] font-semibold tracking-wide">ANTI-FRAUD CHECK</p>
              <p className="text-white font-bold text-base">รอลูกค้ายืนยันยอด</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-emerald-100 text-xs font-medium font-mono">{couponCode}</span>
            {timeLeft && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                <Hourglass className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-bold font-mono">{timeLeft}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-7 space-y-5">
          {/* Animated waiting */}
          <div className="flex flex-col items-center text-center py-2">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-emerald-200/40 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-200">
                <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-800">
              {statusMsg || 'กำลังส่งคำขอยืนยันไปยังลูกค้า...'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
              ลูกค้าต้องเปิดแอป InGreen แล้วเข้าไปที่หน้า "ยืนยันยอดร้านค้า" เพื่อกดยืนยัน
            </p>
          </div>

          {/* ★ Sprint 6: Order Summary breakdown preview */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 space-y-1.5">
            {orderSummary && orderSummary.originalAmount != null && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ราคาเต็ม</span>
                  <span className="font-semibold text-slate-700">฿ {(orderSummary.originalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600">ส่วนลด</span>
                  <span className="font-semibold text-amber-600">- ฿ {(orderSummary.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-slate-200 border-dashed pt-1.5" />
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600 font-bold">ยอดสุทธิที่ส่งให้ยืนยัน</span>
              <span className="font-bold text-emerald-600 text-lg">
                ฿ {(totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Cancel */}
          <button onClick={onCancel}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95">
            ยกเลิกคำขอ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────
function ResultModal({ type, data, errorMsg, onClose }) {
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className={`px-6 pt-8 pb-6 flex flex-col items-center text-center ${isSuccess ? '' : ''}`}>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isSuccess
              ? <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
              : <XCircle className="w-10 h-10 text-red-400" strokeWidth={1.5} />
            }
          </div>

          <h2 className={`text-xl font-bold mb-1 ${isSuccess ? 'text-slate-800' : 'text-slate-800'}`}>
            {isSuccess ? 'รับออเดอร์สำเร็จ!' : 'ไม่สามารถใช้คูปองได้'}
          </h2>
          <p className={`text-sm mb-6 ${isSuccess ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
            {isSuccess ? 'ระบบบันทึกรายการเรียบร้อยแล้ว' : errorMsg || 'คูปองนี้ไม่สามารถใช้งานได้'}
          </p>

          {/* Receipt */}
          {isSuccess && data && (
            <div className="w-full bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-5 py-4 space-y-3 mb-6">
              {/* Coupon code */}
              <div className="text-center pb-3 border-b border-slate-200 border-dashed">
                <p className="text-xs text-slate-400 mb-0.5">รหัสคูปอง</p>
                <p className="font-bold font-mono text-slate-700 text-lg tracking-widest">{data.couponCode || '—'}</p>
              </div>

              {/* ★ Sprint 6: Order Summary — แสดงเฉพาะเมื่อมีข้อมูล (มี originalAmount จาก Sprint 6 flow) */}
              {data.originalAmount != null && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">ราคาเต็ม</span>
                    <span className="font-semibold text-slate-800">฿ {(data.originalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">ส่วนลด</span>
                    <span className="font-semibold text-amber-600">- ฿ {(data.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 border-dashed">
                    <span className="text-slate-700 font-bold">ราคาสุทธิ (ลูกค้าจ่าย)</span>
                    <span className="font-bold text-slate-800">฿ {(data.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}

              {/* GP block — เก็บแบบเดิมไว้สำหรับ revenue ของร้าน */}
              {data.originalAmount == null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ยอดชำระ</span>
                  <span className="font-semibold text-slate-800">฿ {(data.totalAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-red-400">หัก InGreen Fee (5%)</span>
                <span className="font-semibold text-red-500">- ฿ {(data.inGreenFee || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-emerald-600 font-bold">ยอดสุทธิที่ร้านได้รับ</span>
                <span className="font-black text-emerald-600 text-lg">฿ {((data.totalAmount || 0) - (data.inGreenFee || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <button onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
            {isSuccess ? 'เสร็จสิ้น' : 'ลองสแกนใหม่'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Processing Overlay ───────────────────────────────────────────────────────
function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-center">
          <p className="font-bold text-slate-800">กำลังประมวลผล...</p>
          <p className="text-xs text-slate-400 mt-0.5">กรุณารอสักครู่</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MerchantScan({ handleNavClick, shops, refreshData }) {
  // ★ SPRINT 5: เพิ่ม state 'awaitingConfirm' = รอลูกค้ายืนยันยอด
  const [modal, setModal] = useState(null); // null | 'checking' | 'amount' | 'awaitingConfirm' | 'processing' | 'success' | 'error'
  const [pendingCode, setPendingCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null); // ข้อมูลคูปองจาก check-coupon
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  // ★ SPRINT 5: customer-confirm flow
  const [pendingAmount, setPendingAmount]           = useState(0);
  // ★ Sprint 6: Order Summary breakdown — เก็บไว้ส่งไปแสดงใน ResultModal
  const [pendingOrder, setPendingOrder]             = useState(null);
  const [confirmExpiresAt, setConfirmExpiresAt]     = useState(null);
  const [confirmStatusMsg, setConfirmStatusMsg]     = useState('');
  const confirmPollRef = useRef(null);
  const scanCooldown = useRef(false);

  const activeShopId = localStorage.getItem('merchantId') || 'shop_001';
  const shopName = localStorage.getItem('merchantName') || shops?.find(s => s.id === activeShopId)?.name || 'ร้านค้าพาร์ทเนอร์';

  // ★ SPRINT 2: handleDetect เรียก /check-coupon ก่อนเปิด AmountModal
  // → ถ้าคูปองใช้แล้ว/หมดอายุ → alert ทันที ไม่เปิด AmountModal
  // → ถ้า valid → เปิด AmountModal พร้อมข้อมูลคูปอง
  const handleDetect = async (result) => {
    if (!result?.length || scanCooldown.current || modal) return;
    const code = result[0].rawValue.trim();
    if (!code.startsWith('GRN-')) return;

    scanCooldown.current = true;
    if (navigator.vibrate) navigator.vibrate(120);
    setPendingCode(code);
    setCouponInfo(null);

    // แสดง overlay "กำลังตรวจสอบ..." ระหว่างเรียก check-coupon
    setModal('checking');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/merchant/check-coupon`, { couponCode: code });

      if (res.data.success) {
        // คูปอง valid → เปิด AmountModal พร้อมข้อมูล couponInfo
        setCouponInfo(res.data.coupon);
        setModal('amount');
      } else {
        // ไม่น่าจะเข้า branch นี้ (server ส่ง 4xx แทน) แต่เผื่อไว้
        setErrorMsg(res.data.message || 'คูปองนี้ไม่สามารถใช้งานได้');
        setModal('error');
      }
    } catch (err) {
      const data = err.response?.data;
      const code_ = data?.errorCode;
      let msg = data?.message || 'คูปองนี้ไม่สามารถใช้งานได้';

      // ★ SPRINT 2: แต่งข้อความตาม errorCode ให้ชัดเจน
      if (code_ === 'ALREADY_USED') {
        const usedAt = data?.usedAt ? new Date(data.usedAt).toLocaleString('th-TH') : null;
        msg = usedAt ? `คูปองนี้ถูกใช้งานไปแล้ว\n(${usedAt})` : 'คูปองนี้ถูกใช้งานไปแล้ว';
      } else if (code_ === 'EXPIRED') {
        const expAt = data?.expiresAt ? new Date(data.expiresAt).toLocaleString('th-TH') : null;
        msg = expAt ? `คูปองหมดอายุแล้ว\n(หมดอายุ ${expAt})` : 'คูปองหมดอายุการใช้งานแล้ว';
      } else if (code_ === 'NOT_FOUND') {
        msg = 'ไม่พบคูปองนี้ในระบบ';
      }

      setErrorMsg(msg);
      setModal('error');
    }
  };

  // ★ SPRINT 5: handleConfirmAmount = step 1 → ยิง /request-confirm แทน /scan-coupon
  //   - ส่งยอดให้ลูกค้ายืนยัน → เปิด WaitingConfirmModal + เริ่ม polling
  // ★ Sprint 6: payload เปลี่ยนเป็น object { originalAmount, discountAmount, totalAmount }
  const handleConfirmAmount = async (payload) => {
    // backward-compat: ถ้า payload เป็น number → ถือว่าเป็น totalAmount เดียว
    const order = typeof payload === 'number'
      ? { originalAmount: payload, discountAmount: 0, totalAmount: payload }
      : payload;
    setPendingAmount(order.totalAmount);
    setPendingOrder(order);
    setModal('processing');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/merchant/request-confirm`, {
        merchantId:     activeShopId,
        couponCode:     pendingCode,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        totalAmount:    order.totalAmount,
        discountValue:  couponInfo?.discountValue || null,
      });
      if (res.data?.success) {
        setConfirmExpiresAt(res.data.confirmExpiresAt);
        setConfirmStatusMsg('ส่งคำขอแล้ว — รอลูกค้ายืนยัน');
        setModal('awaitingConfirm');
      } else {
        setErrorMsg(res.data?.message || 'ส่งคำขอยืนยันไม่สำเร็จ');
        setModal('error');
      }
    } catch (err) {
      const data = err.response?.data;
      const code_ = data?.errorCode;
      let msg = data?.message || 'ส่งคำขอยืนยันไม่สำเร็จ';
      if (code_ === 'ALREADY_USED') msg = 'คูปองนี้ถูกใช้งานไปแล้ว';
      else if (code_ === 'EXPIRED') msg = 'คูปองหมดอายุการใช้งานแล้ว';
      else if (code_ === 'NOT_FOUND') msg = 'ไม่พบคูปองนี้ในระบบ';
      setErrorMsg(msg);
      setModal('error');
    }
  };

  // ★ SPRINT 5: finalizeScanCoupon = step 3 → ลูกค้า confirm แล้ว → สรุปรายการจริง
  const finalizeScanCoupon = async () => {
    setModal('processing');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/merchant/scan-coupon`, {
        merchantId:  activeShopId,
        couponCode:  pendingCode,
        totalAmount: pendingAmount,
      });
      // ★ Sprint 6: รวม Order Summary breakdown ไว้ใน resultData ด้วย
      setResultData({
        ...res.data.data,
        couponCode: pendingCode,
        originalAmount: pendingOrder?.originalAmount,
        discountAmount: pendingOrder?.discountAmount,
      });
      setModal('success');
    } catch (err) {
      const data = err.response?.data;
      const code_ = data?.errorCode;
      let msg = data?.message || 'คูปองนี้ไม่สามารถใช้งานได้';
      if (code_ === 'ALREADY_USED') {
        const usedAt = data?.usedAt ? new Date(data.usedAt).toLocaleString('th-TH') : null;
        msg = usedAt ? `คูปองนี้ถูกใช้งานไปแล้ว\n(${usedAt})` : 'คูปองนี้ถูกใช้งานไปแล้ว';
      } else if (code_ === 'EXPIRED') {
        msg = 'คูปองหมดอายุการใช้งานแล้ว';
      } else if (code_ === 'QUOTA_FULL') {
        msg = 'สิทธิ์ในแคมเปญนี้ถูกใช้ครบแล้ว';
      }
      setErrorMsg(msg);
      setModal('error');
    }
  };

  // ★ SPRINT 5: poll /confirm-status ทุก 2 วินาที ระหว่าง awaitingConfirm
  //   - confirmed → ยิง /scan-coupon ต่อ
  //   - rejected  → modal error พร้อม reason
  //   - timeout   → modal error
  useEffect(() => {
    if (modal !== 'awaitingConfirm' || !pendingCode) return;

    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/merchant/confirm-status/${pendingCode}`);
        const st = res.data?.status;
        if (st === 'confirmed') {
          clearInterval(confirmPollRef.current);
          finalizeScanCoupon();
        } else if (st === 'rejected') {
          clearInterval(confirmPollRef.current);
          setErrorMsg(`ลูกค้าปฏิเสธยอด${res.data?.rejectReason ? `\nเหตุผล: ${res.data.rejectReason}` : ''}`);
          setModal('error');
        } else if (st === 'timeout') {
          clearInterval(confirmPollRef.current);
          setErrorMsg('หมดเวลายืนยัน — กรุณาเริ่มใหม่อีกครั้ง');
          setModal('error');
        } else {
          setConfirmStatusMsg('รอลูกค้ายืนยันยอด...');
        }
      } catch (err) {
        // silent fail — poll ถัดไปยังทำงานต่อ
        console.error('confirm-status poll failed:', err);
      }
    };

    poll(); // เรียกทันทีไม่ต้องรอ 2 วินาที
    confirmPollRef.current = setInterval(poll, 2000);
    return () => clearInterval(confirmPollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, pendingCode]);

  const handleClose = () => {
    // ★ SPRINT 5: หยุด polling ถ้ายังเปิดอยู่
    if (confirmPollRef.current) clearInterval(confirmPollRef.current);
    if (modal === 'success') {
      refreshData?.();
      handleNavClick('merchant-dashboard');
    } else {
      setModal(null);
      setPendingCode('');
      setCouponInfo(null);
      setResultData(null);
      setErrorMsg('');
      // ★ SPRINT 5: reset confirm flow state
      setPendingAmount(0);
      setPendingOrder(null);
      setConfirmExpiresAt(null);
      setConfirmStatusMsg('');
      // cooldown reset ให้สแกนใหม่ได้
      setTimeout(() => { scanCooldown.current = false; }, 800);
    }
  };

  return (
    <>
      {/* Modals */}
      {/* ★ SPRINT 2: modal 'checking' = กำลังตรวจสอบคูปอง (เรียก check-coupon) */}
      {modal === 'checking' && <ProcessingOverlay />}
      {modal === 'amount' && (
        <AmountModal
          couponCode={pendingCode}
          couponInfo={couponInfo}
          onConfirm={handleConfirmAmount}
          onCancel={() => { setModal(null); setPendingCode(''); setCouponInfo(null); scanCooldown.current = false; }}
        />
      )}
      {/* ★ SPRINT 5: รอลูกค้ายืนยันยอด */}
      {modal === 'awaitingConfirm' && (
        <WaitingConfirmModal
          couponCode={pendingCode}
          totalAmount={pendingAmount}
          orderSummary={pendingOrder}
          confirmExpiresAt={confirmExpiresAt}
          statusMsg={confirmStatusMsg}
          onCancel={handleClose}
        />
      )}
      {modal === 'processing' && <ProcessingOverlay />}
      {(modal === 'success' || modal === 'error') && (
        <ResultModal type={modal} data={resultData} errorMsg={errorMsg} onClose={handleClose} />
      )}

      {/* Scanner UI — Mobile: full-bleed (no margin/radius), Desktop (≥sm): centered card */}
      <div className="bg-black relative overflow-hidden flex flex-col font-sans select-none
                      h-[100dvh] w-full
                      sm:h-auto sm:min-h-[calc(100vh-80px)] sm:max-w-md sm:mx-auto sm:my-8 sm:rounded-3xl sm:shadow-2xl">

        {/* Top bar — safe-area-inset for notch (iPhone X/11/12/13/14 → 375–414px) */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 pb-4 bg-gradient-to-b from-black/80 to-transparent"
             style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => handleNavClick('merchant-dashboard')}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all active:scale-95 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">สแกนคูปองลูกค้า</h2>
              <p className="text-emerald-400 text-[11px] sm:text-xs font-medium mt-0.5 truncate">{shopName}</p>
            </div>
            {/* Live dot */}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-2.5 sm:px-3 py-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-[10px] font-semibold">LIVE</span>
            </div>
          </div>
        </div>

        {/* Camera */}
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-0">
          <div className="w-full h-full absolute inset-0">
            <Scanner
              onScan={handleDetect}
              components={{ audio: false, onOff: false, tracker: false }}
            />
          </div>

          {/* Scan frame overlay — frame ขนาดสัมพันธ์กับ viewport เล็กสุด (vmin) */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Dark vignette — ขยับขนาดตาม vmin */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse min(65vmin, 320px) min(65vmin, 320px) at center, transparent 40%, rgba(0,0,0,0.65) 100%)'
            }} />

            {/* Frame — ขนาด adaptive (60vmin บน mobile, 240px บน desktop) */}
            <div className="relative z-10"
                 style={{ width: 'min(60vmin, 240px)', height: 'min(60vmin, 240px)' }}>
              {[
                'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl',
                'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
                'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl',
                'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-emerald-400 ${cls}`} />
              ))}
              {/* Scanning line */}
              <div className="absolute left-2 right-2 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
            </div>

            {/* Hint text — ปลอดภัยจาก bottom bar */}
            <p className="absolute bottom-[24%] sm:bottom-[28%] text-white/60 text-[11px] sm:text-xs font-medium tracking-wide text-center px-6">
              วางคิวอาร์โค้ดในกรอบ
            </p>
          </div>
        </div>

        {/* Bottom bar — safe-area-inset for home indicator */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 pt-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-3"
             style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}>
          <p className="text-white/40 text-[11px] font-medium text-center">รองรับเฉพาะคูปอง InGreen (GRN-XXXX)</p>
          <button onClick={() => handleNavClick('merchant-dashboard')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white px-6 sm:px-8 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 active:scale-95 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> ยกเลิกการสแกน
          </button>
        </div>
      </div>

      {/* CSS animation for scan line */}
      <style>{`
        @keyframes scanLine {
          0% { top: 8px; opacity: 1; }
          50% { top: calc(100% - 8px); opacity: 0.8; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </>
  );
}