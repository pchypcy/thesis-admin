import React, { useState } from 'react';
import axios from 'axios';
import { Leaf, User as UserIcon, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminLogin({ onLoginSuccess, switchToMerchant }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, loginForm);
      if (response.data.success) {
        // ★ DPSE-03 R4: เก็บ adminUsername ไว้ใช้ใน dual sign-off + audit chain
        localStorage.setItem('adminUsername', loginForm.username);
        onLoginSuccess();
      }
    } catch (error) {
      setLoginError(error.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 flex items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute top-[-8%] left-[-8%] w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" />
      <div className="absolute bottom-[-8%] right-[-4%] w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 z-10">

        {/* ส่วนหัว Brand */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-10 py-10 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full" />
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/25 shadow-inner">
            <Leaf className="w-8 h-8 text-white" />
          </div>
<h1 style={{ fontFamily: "'Jost', sans-serif" }} className="text-3xl font-bold text-white tracking-tight">InGreen</h1>          <p className="text-emerald-100 text-xs font-medium tracking-widest uppercase mt-1">ระบบจัดการกลาง</p>
        </div>

        {/* ฟอร์ม */}
        <div className="px-10 py-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 text-center">ยินดีต้อนรับกลับ</h2>
          <p className="text-sm text-slate-400 text-center mb-7">เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบของคุณ</p>

          {loginError && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-600 rounded-xl flex items-start text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อผู้ใช้งาน</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                  placeholder="กรอก username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-semibold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-60"
            >
              {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...</> : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">คุณเป็นร้านค้าพาร์ทเนอร์ใช่ไหม?</p>
            <button
              onClick={switchToMerchant}
              className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center justify-center w-full gap-1 transition-colors"
            >
              เข้าสู่ระบบร้านค้า <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}