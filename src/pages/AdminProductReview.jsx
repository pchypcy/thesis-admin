// AdminProductReview.jsx — DPSE-03 R4
//
// Two-stage approval pipeline ขั้นที่ 2:
//   community ผ่านแล้ว → แอดมินตรวจขั้นสุดท้ายก่อนปล่อยเข้าระบบจริง
//
// แสดง:
//   • รูปฉลาก + เลข อย. + ข้อมูลส่วนผสม
//   • Vote history (audit trail)
//   • ปุ่ม Approve / Reject พร้อมเหตุผล
//   • Tier badge (1-3) → Tier 3 = หลักฐานครบ ปล่อยได้เร็ว
//
// ★ จุดน่าเชื่อถือต่อกรรมการ:
//   "Community vote ไม่ใช่ตัวตัดสินสุดท้าย แอดมิน spot-check ทุกชิ้นก่อนปล่อย"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck, ShieldAlert, Users, ThumbsUp, ThumbsDown, ImageIcon,
  Loader2, CheckCircle2, XCircle, Clock, FileText, Barcode,
  Award, Hash, AlertTriangle, Eye, X, Camera, FileImage,
  ExternalLink, Landmark, Fingerprint, UserCheck, AlertOctagon,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

// ★ DPSE-03 R4: เว็บราชการ อย. สำหรับ admin deep-link ตรวจสายตา
//   URL ปกติของระบบสืบค้นกระทรวงสาธารณสุข — admin คลิกแล้วเปิด tab ใหม่
const FDA_LOOKUP_URL = 'https://porta.fda.moph.go.th/FDA_SEARCH_ALL/MAIN/SEARCH_CENTER_MAIN.aspx';
const FDA_INFO_URL   = 'https://oryor.com/check/';

const SOURCE_LABEL = {
  fda_thailand:  { label: 'อย. ประเทศไทย', color: 'emerald', icon: Award },
  community:     { label: 'ชุมชน InGreen',  color: 'amber',  icon: Users },
  openfoodfacts: { label: 'OpenFoodFacts',  color: 'blue',   icon: FileText },
  admin:         { label: 'แอดมิน',         color: 'emerald', icon: ShieldCheck },
  seed:          { label: 'ระบบ',            color: 'slate',  icon: FileText },
};

const TIER_COLORS = {
  3: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'ครบถ้วน', ring: 'ring-emerald-200' },
  2: { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'บางส่วน', ring: 'ring-blue-200' },
  1: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'ชุมชน',    ring: 'ring-amber-200' },
};

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(d) {
  if (!d) return '-';
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  const day = Math.floor(hr / 24);
  return `${day} วันที่แล้ว`;
}

/* ── Trust Score Ring ────────────────────────────────────────────────── */
function TrustScoreRing({ score = 0, size = 'md' }) {
  const sz = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-14 h-14 text-base';
  const c = score >= 80 ? 'emerald' : score >= 50 ? 'blue' : score >= 25 ? 'amber' : 'red';
  const colors = {
    emerald: { bg: 'bg-emerald-50', ring: 'stroke-emerald-500', text: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    ring: 'stroke-blue-500',    text: 'text-blue-700' },
    amber:   { bg: 'bg-amber-50',   ring: 'stroke-amber-500',   text: 'text-amber-700' },
    red:     { bg: 'bg-red-50',     ring: 'stroke-red-500',     text: 'text-red-700' },
  }[c];
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className={`relative ${sz} ${colors.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" className="stroke-slate-200" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="38" className={colors.ring} strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className={`relative font-black ${colors.text}`}>{Math.round(score)}</div>
    </div>
  );
}

/* ── Detail/Decision Modal ────────────────────────────────────────────── */
function ReviewModal({ product, onClose, onApprove, onReject, onFdaVerify, processing, currentAdmin }) {
  const [decision, setDecision] = useState(null);   // 'approve' | 'reject'
  const [note, setNote] = useState('');
  const [fdaChecked, setFdaChecked] = useState(false);   // checkbox: ตรวจกับ อย. แล้ว

  const tier = product.verification_tier || 1;
  const tc = TIER_COLORS[tier];
  const source = SOURCE_LABEL[product.data_source] || SOURCE_LABEL.community;
  const SourceIcon = source.icon;

  // ★ R4: Dual sign-off — เช็คว่า admin คนปัจจุบันเคย sign แล้วหรือยัง
  const approvals     = (product.admin_reviews || []).filter(r => r.decision === 'approve');
  const alreadySigned = approvals.some(r => r.admin === currentAdmin);
  const signedCount   = approvals.length;
  const finalApprove  = signedCount + 1 >= 2;   // ถ้าคนนี้ approve เพิ่ม จะถึง 2 → final

  const handleConfirm = () => {
    if (decision === 'approve') onApprove(product.barcode, note, fdaChecked);
    else if (decision === 'reject') onReject(product.barcode, note || 'ข้อมูลไม่ถูกต้อง');
  };

  const openFdaLookup = () => {
    // เปิด tab ใหม่ไปยังเว็บ อย. — admin ตรวจสายตา
    window.open(FDA_LOOKUP_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${tc.bg} ${tc.text} flex items-center justify-center ring-2 ${tc.ring}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">ตรวจสอบสินค้า</h2>
              <p className="text-xs text-slate-500">Admin Spot-Check (ด่าน 2/2)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Product Header + Trust Score */}
          <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200 overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-800 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-slate-500 font-semibold">{product.brand}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-600">{product.barcode}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] font-black ${tc.bg} ${tc.text} px-2 py-0.5 rounded-full`}>TIER {tier} · {tc.label}</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <SourceIcon className="w-3 h-3" />{source.label}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <TrustScoreRing score={product.trust_score || 0} size="lg" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1">Trust Score</div>
            </div>
          </div>

          {/* Dual Sign-Off Status */}
          <div className={`p-4 rounded-2xl border-2 ${signedCount >= 1 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className={`w-5 h-5 ${signedCount >= 1 ? 'text-blue-600' : 'text-amber-600'}`} />
                <h4 className="text-sm font-black text-slate-800">Dual Sign-Off (ต้องการ admin 2 คน)</h4>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${signedCount >= 2 ? 'bg-emerald-100 text-emerald-700' : signedCount === 1 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {signedCount}/2 ลงนาม
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map(i => {
                const ap = approvals[i];
                return (
                  <div key={i} className={`p-3 rounded-xl border ${ap ? 'bg-white border-emerald-300' : 'bg-white/50 border-dashed border-slate-300'}`}>
                    {ap ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-emerald-700">Admin #{i + 1} ✓</span>
                        </div>
                        <div className="text-sm font-bold text-slate-800">{ap.admin}</div>
                        <div className="text-[10px] text-slate-500">{fmtRelative(ap.at)}</div>
                        {ap.fda_verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                            <Landmark className="w-3 h-3" />ตรวจ อย. แล้ว
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">Admin #{i + 1}</span>
                        </div>
                        <div className="text-sm text-slate-400 italic">รอ admin คนถัดไป...</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {alreadySigned && (
              <div className="mt-3 p-2.5 bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                คุณ ({currentAdmin}) ลงนามไปแล้ว — ต้องรอ admin คนอื่นมา sign อีก 1 คน
              </div>
            )}
            {!alreadySigned && finalApprove && (
              <div className="mt-3 p-2.5 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ★ ถ้าคุณ approve ตอนนี้ จะเป็น sign-off คนสุดท้าย — สินค้าจะเข้าระบบทันที
              </div>
            )}
          </div>

          {/* FDA Deep-Link Verification (only if has FDA number) */}
          {product.fda_number && (
            <div className={`p-4 rounded-2xl border-2 ${product.fda_verified_at ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${product.fda_verified_at ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black text-slate-800">ตรวจสอบกับ อย. (แหล่งราชการ)</h4>
                    {product.fda_verified_at && (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mb-3">
                    คลิกปุ่มเพื่อเปิดเว็บไซต์ กระทรวงสาธารณสุข — ค้นหาเลข อย. <span className="font-mono font-black text-slate-800">{product.fda_number}</span> เพื่อยืนยันว่าตรงกับฉลากจริง
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={openFdaLookup} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg inline-flex items-center gap-2 shadow-sm">
                      <ExternalLink className="w-3.5 h-3.5" />เปิดเว็บ อย. (porta.fda.moph.go.th)
                    </button>
                    <a href={FDA_INFO_URL} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg inline-flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" />oryor.com
                    </a>
                  </div>
                  {product.fda_verified_at && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-800 font-semibold">
                      ตรวจแล้วโดย <span className="font-black">{product.fda_verified_by}</span> · {fmtRelative(product.fda_verified_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trust Score Breakdown */}
          {product.trust_breakdown && Object.keys(product.trust_breakdown).length > 0 && (
            <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5" />Trust Score Breakdown
              </h4>
              <div className="space-y-1.5">
                {Object.entries(product.trust_breakdown).map(([key, val]) => {
                  const labels = {
                    off_match:         { th: 'ข้อมูลตรงกับ OpenFoodFacts', icon: '🌍' },
                    admin_curated:     { th: 'แอดมินจัดข้อมูลเอง',           icon: '🛡️' },
                    curated_seed:      { th: 'Demo data ที่กำหนดเอง',         icon: '🌱' },
                    fda_source:        { th: 'มาจากแหล่ง อย.',               icon: '🏛️' },
                    community_source:  { th: 'ผู้ใช้ส่งข้อมูล',                icon: '👥' },
                    fda_format:        { th: 'เลข อย. รูปแบบถูกต้อง',         icon: '✅' },
                    fda_verified:      { th: 'admin ตรวจกับเว็บ อย. แล้ว',    icon: '🏛️' },
                    label_photo:       { th: 'มีรูปฉลาก',                     icon: '📷' },
                    community_votes:   { th: 'ชุมชนยืนยัน',                   icon: '👍' },
                    admin_signoff:     { th: 'admin ลงนามอนุมัติ',            icon: '🖊️' },
                  };
                  const lbl = labels[key] || { th: key, icon: '•' };
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold">{lbl.icon} {lbl.th}</span>
                      <span className="font-black text-emerald-700">+{val}</span>
                    </div>
                  );
                })}
                <div className="pt-2 mt-2 border-t border-slate-300 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-800">รวม</span>
                  <span className="font-black text-emerald-700 text-base">{product.trust_score || 0}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Evidence */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">หลักฐานที่ผู้ใช้แนบมา</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* FDA */}
              <div className={`p-4 rounded-2xl border-2 ${product.fda_number ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Award className={`w-4 h-4 ${product.fda_number ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-600">เลข อย.</span>
                </div>
                {product.fda_number ? (
                  <div>
                    <div className="font-mono font-black text-emerald-700 text-base tracking-wider">{product.fda_number}</div>
                    <a href={`https://oryor.com/check/`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 underline hover:text-emerald-800 inline-flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />ตรวจสอบที่ oryor.com
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">ไม่ได้แนบมา</div>
                )}
              </div>

              {/* Label photo */}
              <div className={`p-4 rounded-2xl border-2 ${product.label_photo ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Camera className={`w-4 h-4 ${product.label_photo ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-600">รูปฉลาก</span>
                </div>
                {product.label_photo ? (
                  <a href={product.label_photo} target="_blank" rel="noreferrer" className="block">
                    <img src={product.label_photo} alt="label" className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition" />
                  </a>
                ) : (
                  <div className="text-sm text-slate-400 italic">ไม่ได้แนบมา</div>
                )}
              </div>
            </div>
          </div>

          {/* Vote Audit Trail */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">ประวัติการโหวตจากชุมชน (Audit Trail)</h4>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-black">
                    <ThumbsUp className="w-4 h-4" /> {product.upvotes || 0} โหวตยืนยัน
                  </span>
                  {product.downvotes > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-red-700 font-black">
                      <ThumbsDown className="w-4 h-4" /> {product.downvotes}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  ผ่านเมื่อ {fmtRelative(product.community_approved_at)}
                </span>
              </div>

              {/* ★ SPRINT 7: Weighted score — ระบบตัดสินด้วยน้ำหนักเสียง ไม่ใช่นับหัว */}
              <div className="mb-3 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-indigo-700 inline-flex items-center gap-1.5">
                  ⚖️ คะแนนถ่วงน้ำหนัก (ตาม trust ผู้โหวต)
                </span>
                <span className="font-black text-indigo-700">
                  ▲ {(product.weighted_upvotes || 0).toFixed(1)}
                  {product.weighted_downvotes > 0 && <span className="text-red-600 ml-2">▼ {(product.weighted_downvotes || 0).toFixed(1)}</span>}
                </span>
              </div>

              {/* ★ R4: Unique users vs unique IPs — โชว์ให้ admin ดูว่า fraud ไหม */}
              {(() => {
                const upLog = (product.vote_log || []).filter(v => v.vote === 'up');
                const uniqUsers = new Set(upLog.map(v => v.username)).size;
                const uniqIps   = new Set(upLog.filter(v => v.ip && v.ip !== 'unknown').map(v => v.ip)).size;
                const suspicious = upLog.length > 0 && uniqIps > 0 && uniqIps < uniqUsers;
                if (upLog.length === 0) return null;
                return (
                  <div className={`mb-3 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] ${suspicious ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                    <span className="font-bold inline-flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5" />
                      {suspicious ? 'IP น้อยกว่าจำนวนคน — น่าสงสัย' : 'ตรวจ IP-based anti-fraud'}
                    </span>
                    <span className="font-black">
                      {uniqUsers} unique users · {uniqIps} unique IPs
                    </span>
                  </div>
                );
              })()}

              {product.vote_log && product.vote_log.length > 0 ? (
                <ul className="space-y-2">
                  {product.vote_log.map((v, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${v.vote === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {v.vote === 'up' ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-700 text-sm flex items-center gap-2 flex-wrap">
                          {v.username}
                          {/* ★ SPRINT 7: น้ำหนักเสียง + trust level ของผู้โหวต */}
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                            ⚖️ ×{(v.weight ?? 1)}{v.trust_level ? ` · L${v.trust_level}` : ''}
                          </span>
                          {v.ip && v.ip !== 'unknown' && (
                            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Fingerprint className="w-2.5 h-2.5" />{v.ip}
                            </span>
                          )}
                        </div>
                        {v.comment && <div className="text-xs text-slate-500 italic">"{v.comment}"</div>}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold flex-shrink-0">{fmtDate(v.at)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-400 italic text-center py-2">ไม่มีบันทึก vote (สินค้าเก่าก่อนระบบ audit trail)</div>
              )}
            </div>
          </div>

          {/* Ingredient & Nutrition */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">ข้อมูลโภชนาการที่ผู้ใช้กรอก</h4>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
              {product.ingredients && product.ingredients.length > 0 && (
                <div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase mb-1.5">ส่วนผสม</div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients.map((ing, i) => (
                      <span key={i} className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-700 font-semibold">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { k: 'sugar_g', label: 'น้ำตาล', unit: 'g' },
                  { k: 'sodium_mg', label: 'โซเดียม', unit: 'mg' },
                  { k: 'fat_g', label: 'ไขมัน', unit: 'g' },
                  { k: 'energy_kcal', label: 'พลังงาน', unit: 'kcal' },
                  { k: 'carbs_g', label: 'คาร์บ', unit: 'g' },
                  { k: 'protein_g', label: 'โปรตีน', unit: 'g' },
                ].map(n => (
                  <div key={n.k} className="bg-white border border-slate-200 px-3 py-2 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-bold">{n.label}</div>
                    <div className="font-black text-slate-800">{product[n.k] ?? 0}<span className="text-[10px] text-slate-400 font-semibold ml-0.5">{n.unit}</span></div>
                  </div>
                ))}
              </div>
              {product.submitted_by && (
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <Users className="w-3.5 h-3.5" />
                  เพิ่มโดย <span className="font-bold text-slate-700">{product.submitted_by}</span> · {fmtRelative(product.createdAt)}
                </div>
              )}
            </div>
          </div>

          {/* Sanity check warnings */}
          {(() => {
            const warnings = [];
            if (product.sugar_g > 100) warnings.push(`น้ำตาล ${product.sugar_g}g/100g เกินขีดเป็นไปได้`);
            if (product.sodium_mg > 40000) warnings.push(`โซเดียม ${product.sodium_mg}mg เกินขีดเป็นไปได้`);
            if (product.fat_g > 100) warnings.push(`ไขมัน ${product.fat_g}g เกินขีดเป็นไปได้`);
            if (!product.name || product.name.length < 3) warnings.push('ชื่อสินค้าสั้นผิดปกติ');
            if (warnings.length === 0) return null;
            return (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black text-red-700 mb-1">⚠ ตรวจพบความผิดปกติ — โปรดพิจารณาก่อน approve</div>
                  <ul className="text-xs text-red-600 font-semibold space-y-0.5 list-disc list-inside">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* FDA Verified Checkbox */}
          {product.fda_number && !product.fda_verified_at && (
            <label className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition">
              <input
                type="checkbox"
                checked={fdaChecked}
                onChange={(e) => setFdaChecked(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-blue-600"
              />
              <div>
                <div className="text-sm font-black text-blue-900 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />ฉันยืนยันว่าได้ตรวจสอบเลข อย. กับเว็บราชการแล้ว
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                  การติ๊กนี้จะถูกบันทึกใน audit chain + เพิ่ม trust score +20
                </div>
              </div>
            </label>
          )}

          {/* Decision note */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">บันทึกการตัดสินใจ (ไม่บังคับ)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="เช่น ตรงกับฉลากจริง / ข้อมูล อย. ถูกต้อง / ปฏิเสธเพราะ..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-400 outline-none text-sm font-semibold text-slate-700 resize-none"
            />
          </div>
        </div>

        {/* Decision buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button
            disabled={processing}
            onClick={() => { setDecision('reject'); }}
            className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${decision === 'reject' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            <XCircle className="w-5 h-5" /> ปฏิเสธ
          </button>
          <button
            disabled={processing || alreadySigned}
            onClick={() => { setDecision('approve'); }}
            className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${alreadySigned ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : decision === 'approve' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            title={alreadySigned ? 'คุณ sign แล้ว — ต้องรอ admin คนอื่น' : ''}
          >
            <CheckCircle2 className="w-5 h-5" />
            {alreadySigned ? 'sign แล้ว' : finalApprove ? 'อนุมัติ (Final)' : `อนุมัติ (${signedCount + 1}/2)`}
          </button>
          {decision && !(decision === 'approve' && alreadySigned) && (
            <button
              disabled={processing}
              onClick={handleConfirm}
              className={`px-6 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 text-white shadow-lg ${decision === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'}`}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ยืนยัน'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function AdminProductReview({ showToast }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [processing, setProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);   // ★ R4: bypass mode indicator

  // ★ DPSE-03 R4: ดึงชื่อ admin ปัจจุบันจาก localStorage (สำหรับ dual sign-off)
  const currentAdmin = localStorage.getItem('adminUsername') || 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statusRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/products/admin-review/list`),
        axios.get(`${API_BASE_URL}/api/products/admin-review/system-status`).catch(() => ({ data: null })),
      ]);
      setItems(listRes.data?.items || []);
      setSystemStatus(statusRes.data);
    } catch (err) {
      console.error(err);
      showToast?.('โหลดข้อมูลล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (barcode, note, fdaVerified) => {
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/products/admin-review/approve`, {
        barcode, reviewer: currentAdmin, note, fdaVerified,
      });
      if (res.data?.final) {
        showToast?.('✅ อนุมัติขั้นสุดท้าย — สินค้าเข้าระบบแล้ว');
      } else {
        showToast?.(res.data?.message || 'บันทึก sign-off แล้ว รอ admin คนถัดไป');
      }
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'อนุมัติล้มเหลว';
      showToast?.(msg, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (barcode, note) => {
    setProcessing(true);
    try {
      await axios.post(`${API_BASE_URL}/api/products/admin-review/reject`, { barcode, reviewer: currentAdmin, note });
      showToast?.('ปฏิเสธสินค้าเรียบร้อย');
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      showToast?.('ปฏิเสธล้มเหลว', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFdaVerify = async (barcode) => {
    try {
      await axios.post(`${API_BASE_URL}/api/products/admin-review/fda-verify`, { barcode, reviewer: currentAdmin });
      showToast?.('บันทึกการตรวจกับ อย. เรียบร้อย');
      load();
    } catch (err) {
      console.error(err);
      showToast?.('บันทึกล้มเหลว', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            ตรวจสอบสินค้าจากชุมชน
          </h1>
          <p className="text-slate-500 mt-2 ml-15 pl-1">
            สินค้าที่ผ่านการ vote จากชุมชนแล้ว — ตรวจสอบขั้นสุดท้ายก่อนปล่อยเข้าระบบ
          </p>
        </div>
        <button onClick={load} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {/* ★ DPSE-03 R4: Demo Bypass Warning Banner */}
      {systemStatus?.ip_dedup_bypass && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-amber-900 mb-1">
              ⚠ Demo Mode: IP Dedup Bypass เปิดอยู่
            </div>
            <div className="text-xs text-amber-800 font-semibold leading-relaxed">
              ระบบยอมรับ vote จาก IP เดียวกันได้หลายครั้ง — สำหรับเทสในเครื่องเดียว
              <br />
              <span className="text-amber-700">เปลี่ยนเป็น production: ตั้ง <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">ALLOW_DUPLICATE_IP_VOTE=false</code> ใน .env</span>
            </div>
          </div>
        </div>
      )}

      {/* Trust pipeline visualization */}
      <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-emerald-50 border-2 border-emerald-100 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          {[
            { icon: Users,        label: 'ผู้ใช้ส่งข้อมูล',  sub: 'พร้อมหลักฐาน', color: 'amber' },
            { icon: ThumbsUp,     label: 'ชุมชน Vote',     sub: '3 เสียงขึ้นไป', color: 'blue' },
            { icon: ShieldCheck,  label: 'แอดมินตรวจสอบ',  sub: 'ด่านสุดท้าย ★',  color: 'emerald' },
            { icon: CheckCircle2, label: 'เข้าระบบ',        sub: 'น่าเชื่อถือ',     color: 'green' },
          ].map((s, i, arr) => {
            const Icon = s.icon;
            const isCurrent = i === 2;
            return (
              <React.Fragment key={i}>
                <div className={`flex-1 text-center ${isCurrent ? 'scale-105' : ''}`}>
                  <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 ${isCurrent ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`text-xs font-black ${isCurrent ? 'text-emerald-700' : 'text-slate-600'}`}>{s.label}</div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-slate-300 font-black text-lg flex-shrink-0">→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">รอตรวจสอบ</div>
          <div className="text-3xl font-black text-emerald-700">{items.length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">รายการ</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Tier 3 (หลักฐานครบ)</div>
          <div className="text-3xl font-black text-emerald-700">{items.filter(i => (i.verification_tier || 1) >= 3).length}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">มี อย. + รูปฉลาก</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">เก่าสุด</div>
          <div className="text-3xl font-black text-amber-700">{items[items.length - 1]?.community_approved_at ? fmtRelative(items[items.length - 1].community_approved_at) : '-'}</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">ควรตรวจก่อน</div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-700 mb-1">ไม่มีสินค้ารอตรวจ</h3>
          <p className="text-sm text-slate-500">ทุกอย่าง up to date — ระบบใช้งานได้ปกติ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => {
            const tier = p.verification_tier || 1;
            const tc = TIER_COLORS[tier];
            const source = SOURCE_LABEL[p.data_source] || SOURCE_LABEL.community;
            const SourceIcon = source.icon;
            const hasFda   = !!p.fda_number;
            const hasPhoto = !!p.label_photo;

            return (
              <div
                key={p.barcode}
                onClick={() => setSelected(p)}
                className={`bg-white border-2 rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5 ${tier === 3 ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-200'}`}
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
                    {p.label_photo ? (
                      <img src={p.label_photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-black text-slate-800 text-sm line-clamp-2 leading-tight">{p.name}</h3>
                      <span className={`text-[10px] font-black ${tc.bg} ${tc.text} px-2 py-0.5 rounded-full flex-shrink-0`}>T{tier}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mb-2">{p.brand}</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <ThumbsUp className="w-3 h-3" />{p.upvotes || 0}
                      </span>
                      {p.downvotes > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                          <ThumbsDown className="w-3 h-3" />{p.downvotes}
                        </span>
                      )}
                      <span className="text-slate-400 font-semibold ml-auto">{fmtRelative(p.community_approved_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <SourceIcon className="w-3 h-3" />{source.label}
                  </span>
                  {hasFda && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                      <Award className="w-3 h-3" />อย.
                    </span>
                  )}
                  {hasPhoto && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-flex items-center gap-1">
                      <FileImage className="w-3 h-3" />รูปฉลาก
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-600 font-bold ml-auto">คลิกตรวจ →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ReviewModal
          product={selected}
          onClose={() => !processing && setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onFdaVerify={handleFdaVerify}
          processing={processing}
          currentAdmin={currentAdmin}
        />
      )}
    </div>
  );
}
