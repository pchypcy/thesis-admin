/**
 * theme.js — InGreen v2
 * Centralized CI colour tokens for Admin (green) & Merchant (orange/amber).
 * Merchant shops also get a unique dynamic accent via getShopTheme(shopId).
 */

export const ADMIN_THEME = {
  role: 'admin',
  headerGrad: 'from-emerald-600 to-teal-600',
  badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
  activeBg: 'bg-emerald-50',
  activeBorder: 'border-emerald-100/80',
  activeText: 'text-emerald-700',
  activeIcon: 'text-emerald-600',
  avatarBg: 'bg-emerald-100 text-emerald-700',
  sectionLabel: 'text-emerald-400',
  btnPrimary: 'bg-emerald-600 hover:bg-emerald-700',
  pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  hex: '#059669',
  hexLight: '#d1fae5',
};

export const MERCHANT_THEME = {
  role: 'merchant',
  headerGrad: 'from-amber-500 to-orange-500',
  badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
  activeBg: 'bg-amber-50',
  activeBorder: 'border-amber-100/80',
  activeText: 'text-amber-700',
  activeIcon: 'text-amber-600',
  avatarBg: 'bg-amber-100 text-amber-700',
  sectionLabel: 'text-amber-400',
  btnPrimary: 'bg-amber-500 hover:bg-amber-600',
  pillBg: 'bg-amber-50 text-amber-700 border-amber-100',
  hex: '#f59e0b',
  hexLight: '#fef3c7',
};

// 5 palettes — cycled deterministically by shopId character-sum
const SHOP_PALETTES = [
  {
    hex: '#f59e0b', hexLight: '#fef3c7',
    headerGrad: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    btnPrimary: 'bg-amber-500 hover:bg-amber-600',
    activeBg: 'bg-amber-50', activeText: 'text-amber-700', activeIcon: 'text-amber-600',
    pillBg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    hex: '#8b5cf6', hexLight: '#ede9fe',
    headerGrad: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    btnPrimary: 'bg-violet-500 hover:bg-violet-600',
    activeBg: 'bg-violet-50', activeText: 'text-violet-700', activeIcon: 'text-violet-600',
    pillBg: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    hex: '#0ea5e9', hexLight: '#e0f2fe',
    headerGrad: 'from-sky-500 to-blue-600',
    badgeBg: 'bg-gradient-to-r from-sky-500 to-blue-600',
    btnPrimary: 'bg-sky-500 hover:bg-sky-600',
    activeBg: 'bg-sky-50', activeText: 'text-sky-700', activeIcon: 'text-sky-600',
    pillBg: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    hex: '#ec4899', hexLight: '#fce7f3',
    headerGrad: 'from-pink-500 to-rose-500',
    badgeBg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    btnPrimary: 'bg-pink-500 hover:bg-pink-600',
    activeBg: 'bg-pink-50', activeText: 'text-pink-700', activeIcon: 'text-pink-600',
    pillBg: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  {
    hex: '#14b8a6', hexLight: '#ccfbf1',
    headerGrad: 'from-teal-500 to-emerald-600',
    badgeBg: 'bg-gradient-to-r from-teal-500 to-emerald-600',
    btnPrimary: 'bg-teal-500 hover:bg-teal-600',
    activeBg: 'bg-teal-50', activeText: 'text-teal-700', activeIcon: 'text-teal-600',
    pillBg: 'bg-teal-50 text-teal-700 border-teal-100',
  },
];

export function getShopTheme(shopId = '') {
  const hash = [...shopId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return { ...MERCHANT_THEME, ...SHOP_PALETTES[hash % SHOP_PALETTES.length] };
}