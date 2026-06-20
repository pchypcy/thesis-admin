/**
 * App.jsx — InGreen v2
 *
 * Key features:
 * 1. shopCi — derived from current shop's palette so every component gets dynamic CI colours.
 * 2. shopCi threaded down to Sidebar, Header, MerchantDashboard.
 * 3. ADMIN_THEME / MERCHANT_THEME / getShopTheme from theme.js.
 * 4. Role badge & merchant name prominent in Header/Sidebar.
 */

import React, { useState, useEffect, useCallback, Component } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertCircle, Activity, Bug } from 'lucide-react';
import { API_BASE_URL } from './config';
import { ADMIN_THEME, MERCHANT_THEME, getShopTheme } from './theme';

import AdminLogin from './pages/AdminLogin';
import MerchantLogin from './pages/MerchantLogin';
import Dashboard from './pages/Dashboard';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Users from './pages/Users';
import Coupons from './pages/Coupons';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantScan from './pages/MerchantScan';
import MerchantCoupons from './pages/MerchantCoupons';
import MerchantPayout from './pages/MerchantPayout';
import MerchantProfile from './pages/MerchantProfile';
import AdminInvoices from './pages/AdminInvoices';
import AdminProductReview from './pages/AdminProductReview';
import AdminSettlements from './pages/AdminSettlements';
import AdminConfig from './pages/AdminConfig'; // ★ SPRINT 5: Dynamic AppConfig UI
import AdminAllergenGroups from './pages/AdminAllergenGroups'; // ★ SPRINT 6: กลุ่มอาหารแพ้ CRUD

/* ── Error Boundary ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorInfo: error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-2xl w-full border-[3px] border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <Bug className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-800">จับตัวการ "หน้าจอขาว" ได้แล้ว!</h1>
            </div>
            <div className="bg-red-50 text-red-600 p-5 rounded-xl overflow-auto text-sm font-mono border border-red-200 mb-6 font-bold shadow-inner">
              {this.state.errorInfo?.toString()}
            </div>
            <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all">
              รีเฟรชหน้าจอ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Main App ── */
function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loginView, setLoginView] = useState('admin');

  const [activeView, setActiveView] = useState('dashboard');
  const [selectedShopId, setSelectedShopId] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toasts, setToasts] = useState([]);

  // Dynamic CI for current role/shop
  const [shopCi, setShopCi] = useState(null);

  // Derive shopCi whenever role or data changes
  useEffect(() => {
    if (userRole === 'merchant' && dashboardData) {
      const mId = localStorage.getItem('merchantId');
      const shop = dashboardData.shops?.find(s => s.id === mId);
      setShopCi(shop ? getShopTheme(shop.id) : MERCHANT_THEME);
    } else if (userRole === 'admin') {
      setShopCi(ADMIN_THEME);
    }
  }, [userRole, dashboardData]);

  // Restore session on mount
  useEffect(() => {
    const mId = localStorage.getItem('merchantId');
    const isAdmin = localStorage.getItem('isAdmin');
    if (mId) {
      setIsAuthenticated(true);
      setUserRole('merchant');
      setActiveView('merchant-dashboard');
    } else if (isAdmin) {
      setIsAuthenticated(true);
      setUserRole('admin');
      setActiveView('dashboard');
    }
  }, []);

  const showToast = (message, type = 'success') => {
    // ★ FIX: Date.now() เดียวไม่พอ — ถ้าเรียก 2 ครั้งใน ms เดียว → id ซ้ำ → React duplicate key warning
    //         เติม random suffix เพื่อ guarantee unique
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setApiError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard-summary`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setApiError('API ตอบกลับมา แต่ success เป็น false');
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setApiError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบว่า Backend ทำงานอยู่');
      showToast('เชื่อมต่อฐานข้อมูลล้มเหลว', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated, fetchDashboardData]);

  const handleNavClick = (view) => {
    setActiveView(view);
    if (view !== 'shop-detail') setSelectedShopId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('merchantId');
    localStorage.removeItem('merchantName');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUsername');   // ★ DPSE-03 R4
    setIsAuthenticated(false);
    setUserRole(null);
    setDashboardData(null);
    setShopCi(null);
    setActiveView('dashboard');
    window.location.reload();
  };

  const openShopDetail = (shopId) => {
    setSelectedShopId(shopId);
    setActiveView('shop-detail');
  };

  /* ── Login screens ── */
  if (!isAuthenticated) {
    if (loginView === 'admin') {
      return (
        <AdminLogin
          onLoginSuccess={() => {
            localStorage.setItem('isAdmin', 'true');
            setIsAuthenticated(true);
            setUserRole('admin');
            setActiveView('dashboard');
          }}
          switchToMerchant={() => setLoginView('merchant')}
        />
      );
    }
    return (
      <MerchantLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setUserRole('merchant');
          setActiveView('merchant-dashboard');
        }}
        switchToAdmin={() => setLoginView('admin')}
      />
    );
  }

  /* ── Authenticated layout ── */
  // ★ SPRINT 6: views ที่ต้องการ full-screen บน mobile (scan/camera) — ซ่อน sidebar+header
  const isFullscreenMobile = activeView === 'merchant-scan';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-emerald-200">

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-5 py-3.5 rounded-xl shadow-xl flex items-center backdrop-blur-md ${
              toast.type === 'error' ? 'bg-red-600/90 text-white' : 'bg-slate-800/90 text-white'
            }`}
          >
            {toast.type === 'error'
              ? <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              : <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
            }
            <span className="text-sm font-medium tracking-wide">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar — ซ่อนบน mobile เมื่อ fullscreen view */}
      <div className={isFullscreenMobile ? 'hidden md:flex' : 'flex'}>
        <Sidebar
          activeView={activeView}
          handleNavClick={handleNavClick}
          handleLogout={handleLogout}
          userRole={userRole}
          shopCi={shopCi}
        />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header — ซ่อนบน mobile เมื่อ fullscreen view */}
        {!isFullscreenMobile && (
          <Header
            activeView={activeView}
            showToast={showToast}
            refreshData={fetchDashboardData}
            isLoadingData={isLoadingData}
            userRole={userRole}
            shopCi={shopCi}
          />
        )}
        {/* desktop ยังต้องมี Header เสมอ */}
        {isFullscreenMobile && (
          <div className="hidden md:block">
            <Header
              activeView={activeView}
              showToast={showToast}
              refreshData={fetchDashboardData}
              isLoadingData={isLoadingData}
              userRole={userRole}
              shopCi={shopCi}
            />
          </div>
        )}

        <div className={`flex-1 overflow-y-auto relative ${isFullscreenMobile ? 'p-0 md:p-8' : 'p-3 sm:p-5 md:p-8'}`}>
          {isLoadingData && !dashboardData && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
              <Activity className="w-12 h-12 text-emerald-400 mb-4 animate-bounce" />
              <p className="font-medium text-lg">กำลังเชื่อมต่อฐานข้อมูล MongoDB...</p>
            </div>
          )}

          {!isLoadingData && apiError && (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">เชื่อมต่อล้มเหลว</h2>
              <p className="text-slate-500 mb-8">{apiError}</p>
              <button onClick={fetchDashboardData} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors shadow-lg">
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {!isLoadingData && !apiError && !dashboardData && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl font-bold text-red-500">❌ ดึงข้อมูลสำเร็จ แต่ข้อมูลจาก Backend เป็น Null</p>
            </div>
          )}

          {!isLoadingData && dashboardData && (
            <div className={isFullscreenMobile ? 'h-full md:max-w-7xl md:mx-auto md:pb-12' : 'max-w-7xl mx-auto pb-12'}>
              {userRole === 'merchant' ? (
                <>
                  {activeView === 'merchant-dashboard' && (
                    <MerchantDashboard
                      data={dashboardData}
                      handleNavClick={handleNavClick}
                      userRole={userRole}
                      shopCi={shopCi}
                    />
                  )}
                  {activeView === 'merchant-scan' && (
                    <MerchantScan handleNavClick={handleNavClick} shops={dashboardData?.shops} refreshData={fetchDashboardData} />
                  )}
                  {activeView === 'merchant-coupons' && <MerchantCoupons data={dashboardData} />}
                  {activeView === 'merchant-payout' && <MerchantPayout data={dashboardData} />}
                  {activeView === 'merchant-profile' && <MerchantProfile data={dashboardData} showToast={showToast} />}
                </>
              ) : (
                <>
                  {activeView === 'dashboard' && (
                    <Dashboard data={dashboardData} handleNavClick={handleNavClick} openShopDetail={openShopDetail} />
                  )}
                  {activeView === 'shops' && (
                    <Shops data={dashboardData} openShopDetail={openShopDetail} showToast={showToast} />
                  )}
                  {activeView === 'shop-detail' && selectedShopId && (
                    <ShopDetail
                      shopId={selectedShopId}
                      shopsData={dashboardData?.shops}
                      handleNavClick={handleNavClick}
                      showToast={showToast}
                    />
                  )}
                  {activeView === 'users' && <Users data={dashboardData} showToast={showToast} />}
                  {activeView === 'coupons' && <Coupons data={dashboardData} showToast={showToast} refreshData={fetchDashboardData}/>}
                  {activeView === 'invoices' && <AdminInvoices data={dashboardData} showToast={showToast} />}
                  {activeView === 'product-review' && <AdminProductReview showToast={showToast} />}
                  {activeView === 'settlements' && <AdminSettlements showToast={showToast} />}
                  {activeView === 'config' && <AdminConfig showToast={showToast} />}
                  {activeView === 'allergen-groups' && <AdminAllergenGroups showToast={showToast} userRole={userRole} />}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}