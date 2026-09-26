/**
 * BD SHOPS — Master Application Header
 * Ultra-Responsive, Mobile-First Bangladeshi E-Commerce Header with Live Search & Instant Real-Time Dynamic Brand & Category Sync
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  X,
  Phone,
  Truck,
  Sparkles,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  ArrowRight,
  MessageSquare,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/useCartStore';
import { fetchProducts, subscribeToCategories } from '../../services/products';
import { Category, Product } from '../../types';
import { APP_CONFIG } from '../../constants';
import { subscribeToStoreSettings, StoreSettings } from '../../services/settings';
import { NotificationBell } from '../common/NotificationBell';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser, userProfile, logout } = useAuth();
  const { getTotalCount, wishlist } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const cartCount = getTotalCount();
  const wishlistCount = wishlist.length;

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Real-time synchronization for store settings (Site name, logo, phone) and categories
  useEffect(() => {
    // 1. Subscribe to real-time store settings
    const unsubSettings = subscribeToStoreSettings((cfg) => {
      setStoreSettings(cfg);
    });

    // 2. Subscribe to real-time categories
    const unsubCategories = subscribeToCategories((cats) => {
      setCategories(cats);
    });

    // 3. Load catalog products for search
    fetchProducts()
      .then((prods) => setAllProducts(prods))
      .catch((err) => console.warn('Could not load products for header search:', err));

    return () => {
      unsubSettings();
      unsubCategories();
    };
  }, []);

  // Close drawers/dropdowns on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  // Handle outside click for search & user menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live product search
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const q = searchQuery.toLowerCase().trim();
        const hits = allProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.categoryName?.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q))
          )
          .slice(0, 5);
        setSearchResults(hits);
        setIsSearching(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, allProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  const handleLogout = async () => {
    try {
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      await logout();
      toast.success('সফলভাবে লগআউট করা হয়েছে');
      navigate('/', { replace: true });
    } catch {
      toast.error('লগআউট করা যায়নি');
    }
  };

  const currentSiteName = storeSettings?.siteName || 'BD SHOPS';
  const currentSiteLogo = storeSettings?.siteLogo || '';
  const currentPhone = storeSettings?.supportPhone || APP_CONFIG.supportPhone;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs border-b border-slate-100">
      {/* 1. TOP UTILITY ANNOUNCEMENT BAR */}
      {storeSettings?.features?.topNoticeEnabled !== false && (
        <div
          style={{
            backgroundColor: storeSettings?.features?.topNoticeBgColor || '#00796B',
            color: storeSettings?.features?.topNoticeTextColor || '#ffffff',
          }}
          className="text-[11px] font-medium py-1.5 px-4 transition-colors"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {storeSettings?.features?.topNoticeText || '🎉 বিশেষ অফার: আজকের যেকোনো অর্ডারে সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি!'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <a
                href={`tel:${currentPhone}`}
                className="hover:opacity-80 transition-opacity flex items-center gap-1 font-bold"
              >
                <Phone className="w-3 h-3" />
                <span>{currentPhone}</span>
              </a>
              <span className="opacity-40 hidden sm:inline">|</span>
              <Link
                to="/orders/track"
                className="hover:opacity-80 transition-opacity hidden sm:inline"
              >
                অর্ডার ট্র্যাকিং
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* BRAND LOGO */}
          <Link to="/" className="flex items-center gap-2 select-none shrink-0">
            {currentSiteLogo ? (
              <img
                src={currentSiteLogo}
                alt={currentSiteName}
                className="h-9 sm:h-11 max-w-[160px] object-contain"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#00796B] via-[#00BFA5] to-teal-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-[#00BFA5]/25">
                <span className="text-base sm:text-lg tracking-tighter">
                  {currentSiteName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center">
                {currentSiteName}
              </span>
              <span className="hidden sm:block text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                Premium Store BD
              </span>
            </div>
          </Link>

          {/* DESKTOP & TABLET SEARCH BAR */}
          <div
            ref={searchContainerRef}
            className="hidden md:block flex-1 max-w-xl relative mx-2"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="পাঞ্জাবি, আতর, জায়নামাজ বা যেকোনো পণ্য খুঁজুন..."
                className="w-full pl-11 pr-24 py-2.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>খুঁজুন</span>
              </button>
            </form>

            {/* Live Search Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    খোঁজা হচ্ছে...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      পণ্য ফলাফল
                    </div>
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.slug || p.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <img
                          src={p.images?.[0] || p.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                          <span className="text-[11px] font-bold text-[#00796B]">
                            ৳{(p.price || 0).toLocaleString('bn-BD')}
                          </span>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2 text-xs font-bold text-[#00796B] hover:bg-teal-50 rounded-xl transition-colors mt-1"
                    >
                      সকল ফলাফল দেখুন
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    "{searchQuery}" দিয়ে কোনো পণ্য পাওয়া যায়নি
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT ACTION BUTTONS: NOTIFICATION BELL, WISHLIST, USER & CART */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <NotificationBell />

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-2.5 rounded-2xl text-slate-700 hover:text-[#00BFA5] hover:bg-teal-50/60 relative transition-colors cursor-pointer hidden xs:flex items-center"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User Account / Login Button */}
            {currentUser ? (
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-[#00BFA5] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {(userProfile?.displayName || currentUser.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {userProfile?.displayName || 'অ্যাকাউন্ট'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {userProfile?.displayName || 'সম্মানিত গ্রাহক'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    <Link
                      to="/account"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-[#00BFA5]" />
                      <span>আমার প্রোফাইল</span>
                    </Link>

                    <Link
                      to="/account?tab=orders"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Package className="w-4 h-4 text-[#00BFA5]" />
                      <span>আমার অর্ডারসমূহ</span>
                    </Link>

                    <Link
                      to="/account?tab=addresses"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MapPin className="w-4 h-4 text-[#00BFA5]" />
                      <span>ঠিকানা বই</span>
                    </Link>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>লগআউট</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-[#00BFA5]" />
                <span className="hidden xs:inline">লগইন</span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold text-xs shadow-md shadow-[#00BFA5]/25 active:scale-95 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">কার্ট</span>
            </Link>
          </div>
        </div>

        {/* 3. MOBILE SEARCH BAR */}
        <div className="md:hidden mt-2.5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পাঞ্জাবি, আতর বা পণ্য খুঁজুন..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-100 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 4. CATEGORY NAVIGATION BAR (Desktop) */}
      <div className="hidden lg:block bg-white border-t border-slate-100 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6">
          {/* CATEGORY MENU BUTTON (Daraz Style) */}
          <div className="relative">
            <button
              onMouseEnter={() => setCategoryMenuOpen(true)}
              onMouseLeave={() => setCategoryMenuOpen(false)}
              onClick={() => navigate('/categories')}
              className={`flex items-center gap-2.5 px-5 py-3 font-black uppercase tracking-wider transition-all cursor-pointer border-x border-slate-50 ${
                categoryMenuOpen ? 'bg-[#00BFA5] text-white' : 'bg-slate-50 text-[#00796B] hover:bg-slate-100'
              }`}
            >
              <Menu className="w-4 h-4" />
              <span>ক্যাটাগরি সমূহ</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Flyout */}
            {categoryMenuOpen && (
              <div 
                onMouseEnter={() => setCategoryMenuOpen(true)}
                onMouseLeave={() => setCategoryMenuOpen(false)}
                className="absolute top-full left-0 w-64 bg-white shadow-[0_15px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug || cat.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-teal-50 text-slate-700 hover:text-[#00796B] font-bold transition-colors"
                  >
                    <div className="flex items-center gap-3">
                       <img src={cat.image} className="w-5 h-5 rounded object-cover" alt="" />
                       <span>{cat.name}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                   <Link
                     to="/categories"
                     className="flex items-center justify-center py-2 text-[#00BFA5] hover:underline font-black uppercase tracking-tighter"
                   >
                     সকল ক্যাটাগরি দেখুন
                   </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 overflow-x-auto py-2.5 scrollbar-none font-bold text-slate-700 flex-1">
            <Link to="/" className="text-[#00BFA5] hover:text-[#00796B] transition-colors">
              হোম
            </Link>

            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug || cat.id}`}
                className="hover:text-[#00BFA5] transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}

            <Link
              to="/products"
              className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              সকল পণ্য
            </Link>
          </div>

          <Link
            to="/orders/track"
            className="font-bold text-[#00796B] hover:text-[#00BFA5] flex items-center gap-1.5 py-2"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>পার্সেল ট্র্যাক করুন</span>
          </Link>
        </div>
      </div>

      {/* 5. MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Top Header - Improved Branding */}
            <div className="p-5 bg-gradient-to-br from-[#00796B] to-[#00BFA5] text-white flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  {currentSiteLogo ? (
                    <div className="bg-white p-1 rounded-xl shadow-inner">
                      <img
                        src={currentSiteLogo}
                        alt={currentSiteName}
                        className="h-8 max-w-[100px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-white text-base">
                      {currentSiteName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-black text-base tracking-tight leading-none">
                      {currentSiteName}
                    </span>
                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">
                      Premium Store
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* User Identity in Drawer */}
              {currentUser ? (
                <div className="flex items-center gap-3 pt-2">
                   <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 p-0.5 overflow-hidden">
                     {userProfile?.photoURL ? (
                       <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover rounded-[14px]" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center font-black text-white text-sm">
                         {(userProfile?.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                       </div>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate leading-tight">
                        {userProfile?.displayName || 'সম্মানিত গ্রাহক'}
                      </p>
                      <p className="text-[10px] text-white/80 font-medium truncate">
                        {currentUser.email}
                      </p>
                   </div>
                </div>
              ) : (
                <div className="pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#00796B] rounded-xl text-xs font-black shadow-lg shadow-[#00796B]/20 active:scale-95 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    লগইন করুন
                  </Link>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === '/' ? 'bg-teal-50 text-[#00796B]' : 'hover:bg-slate-50'}`}
                >
                  <Home className={`w-4 h-4 ${location.pathname === '/' ? 'text-[#00796B]' : 'text-slate-400'}`} />
                  <span>হোম পেইজ</span>
                </Link>

                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === '/products' ? 'bg-teal-50 text-[#00796B]' : 'hover:bg-slate-50'}`}
                >
                  <Package className={`w-4 h-4 ${location.pathname === '/products' ? 'text-[#00796B]' : 'text-slate-400'}`} />
                  <span>সকল পণ্য সম্ভার</span>
                </Link>

                <Link
                  to="/orders/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === '/orders/track' ? 'bg-teal-50 text-[#00796B]' : 'hover:bg-slate-50'}`}
                >
                  <Truck className={`w-4 h-4 ${location.pathname === '/orders/track' ? 'text-[#00796B]' : 'text-slate-400'}`} />
                  <span>লাইভ অর্ডার ট্র্যাকিং</span>
                </Link>

                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === '/chat' ? 'bg-teal-50 text-[#00796B]' : 'hover:bg-slate-50'}`}
                >
                  <MessageSquare className={`w-4 h-4 ${location.pathname === '/chat' ? 'text-[#00796B]' : 'text-slate-400'}`} />
                  <span>লাইভ চ্যাট সাপোর্ট</span>
                </Link>
              </div>

              {/* Categories Section */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">
                  ক্যাটাগরি সমূহ
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug || cat.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <img src={cat.image} className="w-5 h-5 rounded-lg object-cover shadow-xs" alt="" />
                        <span>{cat.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>

              {currentUser && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">অ্যাকাউন্ট সেটিংস</p>
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700"
                  >
                    <UserIcon className="w-4 h-4 text-[#00BFA5]" />
                    <span>আমার প্রোফাইল</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Support Info */}
            <div className="p-5 bg-slate-50 border-t border-slate-100">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">সহায়তা প্রয়োজন?</p>
                <a
                  href={`tel:${currentPhone}`}
                  className="text-sm font-black text-[#00796B] flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {currentPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
