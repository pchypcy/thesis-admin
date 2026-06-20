import React, { useState } from 'react';
import axios from 'axios';
import { Store, Clock, Lock, Save, Eye, EyeOff, CheckCircle2, Camera, MapPin, Phone, Globe } from 'lucide-react';
import { API_BASE_URL } from '../config';

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function MerchantProfile({ data, showToast }) {
  const shopId = localStorage.getItem('merchantId') || '';
  const shops = data?.shops || [];
  const shop = shops.find(s => s.id === shopId) || {};

  const [profile, setProfile] = useState({
    name: shop.name || localStorage.getItem('merchantName') || '',
    phone: shop.phone || '',
    address: shop.address || '',
    website: shop.website || '',
  });

  const defaultHours = DAY_KEYS.reduce((acc, k) => {
    acc[k] = shop.hours?.[k] || { open: '09:00', close: '21:00', closed: false };
    return acc;
  }, {});
  const [hours, setHours] = useState(defaultHours);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const fmtId = (id) => id || '—';

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // await axios.patch(`${API_BASE_URL}/api/merchant/profile`, { ...profile, hours });
      await new Promise(r => setTimeout(r, 800)); // mock
      localStorage.setItem('merchantName', profile.name);
      showToast('บันทึกข้อมูลร้านค้าสำเร็จ ✓');
    } catch {
      showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) { showToast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
    if (pwForm.next !== pwForm.confirm) { showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'error'); return; }
    if (pwForm.next.length < 6) { showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัว', 'error'); return; }
    setSaving(true);
    try {
      // await axios.patch(`${API_BASE_URL}/api/merchant/change-password`, { currentPassword: pwForm.current, newPassword: pwForm.next });
      await new Promise(r => setTimeout(r, 800));
      showToast('เปลี่ยนรหัสผ่านสำเร็จ ✓');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch {
      showToast('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'info', label: 'ข้อมูลร้านค้า', icon: Store },
    { key: 'hours', label: 'เวลาทำการ', icon: Clock },
    { key: 'security', label: 'ความปลอดภัย', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">โปรไฟล์ร้านค้า</h1>
        <p className="text-sm text-slate-400 mt-0.5">จัดการข้อมูล, เวลาทำการ และความปลอดภัยของร้าน</p>
      </div>

      {/* Shop ID card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden shadow-md shadow-emerald-900/10">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-bl-full transform translate-x-12 -translate-y-12" />
        <div className="w-16 h-16 bg-white/20 rounded-2xl border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 relative z-10">
          {(profile.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="relative z-10">
          <h2 className="text-white font-bold text-lg">{profile.name || 'ร้านค้าพาร์ทเนอร์'}</h2>
          <p className="text-emerald-100 text-sm font-medium mt-0.5 flex items-center gap-1.5">
            <span className="font-mono bg-white/15 px-2 py-0.5 rounded text-white text-xs">{fmtId(shopId)}</span>
            <span className="text-emerald-200">·</span>
            <span className="text-emerald-200 text-xs">InGreen Partner</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${activeTab === key ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
              <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Tab: ข้อมูลร้านค้า ── */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <Field label="ชื่อร้านค้า" icon={Store}>
                <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="field-input" placeholder="ชื่อร้านของคุณ" />
              </Field>
              <Field label="เบอร์โทรศัพท์" icon={Phone}>
                <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="field-input" placeholder="0XX-XXX-XXXX" />
              </Field>
              <Field label="ที่อยู่ร้านค้า" icon={MapPin}>
                <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                  className="field-input resize-none" rows={2} placeholder="ที่อยู่หรือสาขาของร้าน" />
              </Field>
              <Field label="เว็บไซต์ / Line OA" icon={Globe}>
                <input value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })}
                  className="field-input" placeholder="https://..." />
              </Field>
              <SaveBtn onClick={handleSaveProfile} saving={saving} />
            </div>
          )}

          {/* ── Tab: เวลาทำการ ── */}
          {activeTab === 'hours' && (
            <div className="space-y-3">
              {DAY_KEYS.map((k, i) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span className="text-sm font-semibold text-slate-600">{DAYS[i]}</span>
                  </div>
                  <button onClick={() => setHours(h => ({ ...h, [k]: { ...h[k], closed: !h[k].closed } }))}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0 ${hours[k].closed ? 'bg-slate-200' : 'bg-emerald-500'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${hours[k].closed ? 'translate-x-1' : 'translate-x-5'}`} />
                  </button>
                  {hours[k].closed ? (
                    <span className="text-sm text-slate-300 font-medium">ปิดทำการ</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={hours[k].open}
                        onChange={e => setHours(h => ({ ...h, [k]: { ...h[k], open: e.target.value } }))}
                        className="field-input flex-1 text-sm py-1.5" />
                      <span className="text-slate-300 text-sm">–</span>
                      <input type="time" value={hours[k].close}
                        onChange={e => setHours(h => ({ ...h, [k]: { ...h[k], close: e.target.value } }))}
                        className="field-input flex-1 text-sm py-1.5" />
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <SaveBtn onClick={handleSaveProfile} saving={saving} />
              </div>
            </div>
          )}

          {/* ── Tab: ความปลอดภัย ── */}
          {activeTab === 'security' && (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-slate-500 font-medium">เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบพอร์ทัลร้านค้า</p>
              {[
                { key: 'current', label: 'รหัสผ่านปัจจุบัน', placeholder: '••••••••' },
                { key: 'next', label: 'รหัสผ่านใหม่', placeholder: 'อย่างน้อย 6 ตัวอักษร' },
                { key: 'confirm', label: 'ยืนยันรหัสผ่านใหม่', placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <Field key={key} label={label} icon={Lock}>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={pwForm[key]}
                      onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                      className="field-input pr-10" placeholder={placeholder} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              ))}
              <SaveBtn onClick={handleChangePassword} saving={saving} label="เปลี่ยนรหัสผ่าน" />
            </div>
          )}
        </div>
      </div>

      {/* Tailwind utility class injection */}
      <style>{`
        .field-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
          transition: all 0.15s;
        }
        .field-input:focus {
        border-color: #f59e0b;  /* amber */
        box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
        background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving, label = 'บันทึกการเปลี่ยนแปลง' }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-amber-100 disabled:opacity-60">
      {saving ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังบันทึก...</> : <><Save className="w-4 h-4" />{label}</>}
    </button>
  );
}