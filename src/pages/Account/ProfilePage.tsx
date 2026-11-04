/**
 * BD SHOPS — Comprehensive Customer Profile & Account Settings
 * Complete User Dashboard, Profile Editing, Address Book, Security & Password Management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Heart,
  LogOut,
  Plus,
  Trash2,
  Check,
  Edit3,
  ShieldCheck,
  ChevronRight,
  Home,
  Briefcase,
  Loader2,
  Lock,
  KeyRound,
  Bell,
  Settings,
  Sparkles,
  ExternalLink,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCartStore } from '../../store/useCartStore';
import { BD_DISTRICTS, APP_CONFIG } from '../../constants';
import { BD_ALL_DISTRICTS, getUpazilasForDistrict } from '../../constants/bangladeshData';
import { fetchUserOrders } from '../../services/orders';
import { Order } from '../../types';

type ActiveTab = 'overview' | 'edit' | 'addresses' | 'orders' | 'security';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'overview';

  const {
    currentUser,
    userProfile,
    role,
    loading: authLoading,
    logout,
    updateUserProfile,
    addUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    resetPassword,
  } = useAuth();

  const { wishlist } = useCartStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile Edit Form State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('উত্তরা (Uttara)');
  const [city, setCity] = useState('ঢাকা');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [setAsDefault, setSetAsDefault] = useState(true);

  // Security / Password Reset State
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Synchronize state when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
    }
  }, [userProfile]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as ActiveTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch customer orders for summary & orders tab
  useEffect(() => {
    if (currentUser?.uid) {
      const loadOrders = async () => {
        setLoadingOrders(true);
        try {
          const userOrders = await fetchUserOrders(currentUser.uid);
          setOrders(userOrders);
        } catch (err) {
          console.error('Error loading orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      loadOrders();
    }
  }, [currentUser?.uid]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#00BFA5] mb-3" />
        <p className="text-xs font-bold text-slate-500">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  // Redirect safely if not logged in (declarative to prevent setState-in-render errors)
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }

    setProfileSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      toast.success('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!');
      setActiveTab('overview');
    } catch {
      toast.error('প্রোফাইল আপডেট করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !streetAddress.trim()) {
      toast.error('অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন');
      return;
    }

    setAddressSaving(true);
    try {
      const isInsideDhaka = district.trim() === 'ঢাকা';
      const fullFormattedAddr = `${streetAddress.trim()}${upazila ? `, ${upazila}` : ''}, ${district}`;
      await addUserAddress({
        fullName: fullName.trim(),
        phone: phone.trim(),
        district,
        city: upazila || district,
        upazilaOrArea: upazila,
        streetAddress: fullFormattedAddr,
        address: fullFormattedAddr,
        deliveryZone: isInsideDhaka ? 'insideDhaka' : 'outsideDhaka',
        type: addressType,
        isDefault: setAsDefault,
      });

      toast.success('নতুন ডেলিভারি ঠিকানা সফলভাবে যুক্ত হয়েছে!');
      setIsAddingAddress(false);
      // Reset form
      setFullName('');
      setPhone('');
      setStreetAddress('');
      setDistrict('ঢাকা');
    } catch {
      toast.error('ঠিকানা সংরক্ষণ করা যায়নি');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteUserAddress(id);
      toast.success('ঠিকানাটি মুছে ফেলা হয়েছে');
    } catch {
      toast.error('ঠিকানা মোছা সম্ভব হয়নি');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success('ডিফল্ট ডেলিভারি ঠিকানা পরিবর্তন করা হয়েছে');
    } catch {
      toast.error('ডিফল্ট ঠিকানা সেট করা যায়নি');
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser.email) {
      toast.error('আপনার অ্যাকাউন্টে কোনো ইমেইল যুক্ত নেই');
      return;
    }
    setSendingResetEmail(true);
    try {
      await resetPassword(currentUser.email);
      toast.success(`পাসওয়ার্ড পরিবর্তনের লিংক ${currentUser.email} এ পাঠানো হয়েছে!`);
    } catch (err: any) {
      toast.error(err?.message || 'পাসওয়ার্ড রিসেট লিংক পাঠানো যায়নি');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('সফলভাবে লগআউট করা হয়েছে');
      navigate('/', { replace: true });
    } catch {
      toast.error('লগআউট করা যায়নি');
    }
  };

  const addresses = userProfile?.addresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 sm:px-6 max-w-6xl mx-auto">
      <Helmet>
        <title>{`আমার অ্যাকাউন্ট ও প্রোফাইল — ${userProfile?.displayName || 'BD SHOPS'}`}</title>
      </Helmet>

      {/* Profile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00796B] via-[#009688] to-[#00BFA5] p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-white text-3xl font-extrabold shadow-inner overflow-hidden">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(userProfile?.displayName || currentUser?.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {userProfile?.displayName || 'সম্মানিত গ্রাহক'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide">
                  গ্রাহক অ্যাকাউন্ট
                </span>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentUser.email || 'ইমেইল নেই'}</span>
              </p>
              {userProfile?.phoneNumber && (
                <p className="text-emerald-100 text-xs mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{userProfile.phoneNumber}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-6 border-t border-white/20 text-center">
          <div
            onClick={() => handleTabChange('orders')}
            className="bg-white/10 hover:bg-white/20 rounded-2xl p-3 backdrop-blur-xs transition-colors cursor-pointer"
          >
            <span className="block text-xl sm:text-2xl font-extrabold">{orders.length}</span>
            <span className="text-[11px] sm:text-xs text-emerald-100 font-medium">মোট অর্ডার</span>
          </div>
          <Link
            to="/wishlist"
            className="bg-white/10 hover:bg-white/20 rounded-2xl p-3 backdrop-blur-xs transition-colors cursor-pointer block"
          >
            <span className="block text-xl sm:text-2xl font-extrabold">{wishlist.length}</span>
            <span className="text-[11px] sm:text-xs text-emerald-100 font-medium">উইশলিস্ট আইটেম</span>
          </Link>
          <div
            onClick={() => handleTabChange('addresses')}
            className="bg-white/10 hover:bg-white/20 rounded-2xl p-3 backdrop-blur-xs transition-colors cursor-pointer"
          >
            <span className="block text-xl sm:text-2xl font-extrabold">{addresses.length}</span>
            <span className="text-[11px] sm:text-xs text-emerald-100 font-medium">সংরক্ষিত ঠিকানা</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ওভারভিউ</span>
        </button>

        <button
          onClick={() => handleTabChange('edit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'edit'
              ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>প্রোফাইল এডিট</span>
        </button>

        <button
          onClick={() => handleTabChange('addresses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>ঠিকানা বই ({addresses.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>আমার অর্ডারসমূহ ({orders.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>সিকিউরিটি ও পাসওয়ার্ড</span>
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#00BFA5]" />
                  ডিফল্ট ডেলিভারি ঠিকানা
                </h3>
                <button
                  onClick={() => handleTabChange('addresses')}
                  className="text-xs font-bold text-[#00796B] hover:underline cursor-pointer"
                >
                  পরিবর্তন করুন
                </button>
              </div>

              {defaultAddress ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{defaultAddress.fullName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#00796B] text-[10px] font-bold">
                      {defaultAddress.type === 'home'
                        ? 'বাসা'
                        : defaultAddress.type === 'office'
                        ? 'অফিস'
                        : 'অন্যান্য'}
                    </span>
                  </div>
                  <p className="text-slate-600">{defaultAddress.streetAddress}</p>
                  <p className="text-slate-500 font-medium">জেলা: {defaultAddress.district}</p>
                  <p className="text-slate-700 font-semibold mt-1">ফোন: {defaultAddress.phone}</p>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-500">এখনো কোনো ডেলিভারি ঠিকানা যুক্ত করেননি</p>
                  <button
                    onClick={() => {
                      handleTabChange('addresses');
                      setIsAddingAddress(true);
                    }}
                    className="px-4 py-2 bg-[#00BFA5] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ঠিকানা যোগ করুন
                  </button>
                </div>
              )}
            </div>

            {/* Account Information Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00BFA5]" />
                  অ্যাকাউন্ট বিবরণী
                </h3>
                <button
                  onClick={() => handleTabChange('edit')}
                  className="text-xs font-bold text-[#00796B] hover:underline cursor-pointer"
                >
                  এডিট করুন
                </button>
              </div>

              <div className="space-y-3 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">নাম:</span>
                  <span className="font-bold text-slate-800">
                    {userProfile?.displayName || 'উল্লেখ নেই'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">ইমেইল:</span>
                  <span className="font-bold text-slate-800">{currentUser.email || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">মোবাইল:</span>
                  <span className="font-bold text-slate-800">
                    {userProfile?.phoneNumber || 'যুক্ত করা হয়নি'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">অ্যাকাউন্ট ভেরিফিকেশন:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> সক্রিয়
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#00BFA5]" />
                সর্বশেষ অর্ডার
              </h3>
              <button
                onClick={() => handleTabChange('orders')}
                className="text-xs font-bold text-[#00796B] hover:underline cursor-pointer"
              >
                সব অর্ডার দেখুন ({orders.length})
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-xs text-slate-400">অর্ডার লোড হচ্ছে...</div>
            ) : orders.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        আইটেম: {order.items?.length || 1}টি • সর্বমোট: ৳
                        {(order.grandTotal || order.total || 0).toLocaleString('bn-BD')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-[#00796B] border border-teal-200">
                        {order.orderStatus === 'delivered'
                          ? 'ডেলিভার্ড'
                          : order.orderStatus === 'shipped'
                          ? 'কুরিয়ারে আছে'
                          : 'প্রক্রিয়াধীন'}
                      </span>
                      <Link
                        to={`/orders/track?search=${order.orderNumber}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                      >
                        ট্র্যাক করুন
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">আপনার কোনো সক্রিয় অর্ডার নেই</p>
                <Link
                  to="/products"
                  className="inline-block px-4 py-2 bg-[#00BFA5] text-white rounded-xl text-xs font-bold shadow-xs mt-2"
                >
                  কেনাকাটা শুরু করুন
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PROFILE EDIT TAB */}
      {activeTab === 'edit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-xl mx-auto">
          <h2 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#00BFA5]" />
            প্রোফাইল তথ্য পরিবর্তন
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            আপনার নাম এবং যোগাযোগের মোবাইল নম্বর পরিবর্তন করুন
          </p>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="যেমন: মোঃ আব্দুল্লাহ"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                মোবাইল নম্বর (ডেলিভারি যোগাযোগের জন্য)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ইমেইল ঠিকানা</label>
              <input
                type="email"
                value={currentUser.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-semibold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                ইমেইল সরাসরি পরিবর্তন করা যায় না
              </span>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="flex-1 py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs shadow-md shadow-[#00BFA5]/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>তথ্য সংরক্ষণ করুন</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ADDRESSES TAB */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#00BFA5]" />
                সংরক্ষিত ডেলিভারি ঠিকানাসমূহ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                দ্রুত চেকআউটের জন্য আপনার বাসা বা অফিসের ঠিকানা সংরক্ষণ করুন
              </p>
            </div>
            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00BFA5] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#00BFA5]/20 hover:bg-[#00A892] transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ঠিকানা</span>
              </button>
            )}
          </div>

          {/* Add New Address Form */}
          {isAddingAddress && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#00BFA5]/30 shadow-md">
              <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00BFA5]" />
                নতুন ডেলিভারি ঠিকানা যোগ করুন
              </h3>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      প্রাপকের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="পুরো নাম লিখুন"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="01XXXXXXXXX"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      জেলা নির্বাচন করুন (৬৪ জেলা) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setDistrict(newDist);
                        setCity(newDist);
                        const ups = getUpazilasForDistrict(newDist);
                        if (ups.length > 0) setUpazila(ups[0]);
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] bg-white cursor-pointer"
                    >
                      {BD_ALL_DISTRICTS.map((d) => (
                        <option key={d.bnName} value={d.bnName}>
                          {d.bnName} ({d.name}) — {d.bnName === 'ঢাকা' ? 'ঢাকার ভেতরে (৭০৳)' : 'ঢাকার বাইরে (১৩০৳)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      উপজেলা / থানা <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] bg-white cursor-pointer"
                    >
                      {getUpazilasForDistrict(district).map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ঠিকানার ধরন
                    </label>
                    <div className="flex gap-2">
                      {(['home', 'office', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddressType(type)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            addressType === type
                              ? 'bg-teal-50 border-[#00BFA5] text-[#00796B]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {type === 'home' ? 'বাসা' : type === 'office' ? 'অফিস' : 'অন্যান্য'}
                        </button>
                      ))}
                    </div>
                  </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    পূর্ণাঙ্গ ঠিকানা (রোড, বাড়ি নং, এলাকা) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    rows={2}
                    placeholder="রোড নম্বর, বাসা নম্বর, সেক্টর/মহল্লা ইত্যাদি বিস্তারিত লিখুন"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00BFA5] focus:ring-[#00BFA5]"
                  />
                  <span>এই ঠিকানাকে ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সেট করুন</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="px-6 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs shadow-md shadow-[#00BFA5]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {addressSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>ঠিকানা সংরক্ষণ করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Saved Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl p-5 border relative shadow-xs transition-all ${
                  addr.isDefault
                    ? 'border-[#00BFA5] ring-2 ring-[#00BFA5]/15'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {addr.type === 'home' ? 'বাসা' : addr.type === 'office' ? 'অফিস' : 'অন্যান্য'}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#00796B] text-[10px] font-bold">
                        ডিফল্ট
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    title="ঠিকানা মুছুন"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 mb-1">{addr.streetAddress}</p>
                <p className="text-xs text-slate-500 font-medium">জেলা: {addr.district}</p>
                <p className="text-xs text-slate-700 font-semibold mt-2">ফোন: {addr.phone}</p>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefaultAddress(addr.id)}
                    className="mt-3 text-[11px] font-bold text-[#00796B] hover:underline block cursor-pointer"
                  >
                    ডিফল্ট ঠিকানা হিসেবে সেট করুন
                  </button>
                )}
              </div>
            ))}
          </div>

          {addresses.length === 0 && !isAddingAddress && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">কোনো সংরক্ষিত ঠিকানা নেই</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                আপনার পণ্য দ্রুত এবং সঠিক ঠিকানায় পৌঁছাতে আপনার ডেলিভারি ঠিকানা যোগ করুন।
              </p>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#00BFA5]/20 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> নতুন ঠিকানা যোগ করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#00BFA5]" />
              আমার সকল অর্ডার ({orders.length})
            </h2>
            <Link
              to="/orders/track"
              className="text-xs font-bold text-[#00796B] hover:underline flex items-center gap-1"
            >
              <span>অর্ডার ট্র্যাক করুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">অর্ডার লোড হচ্ছে...</div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">অর্ডার নম্বর:</span>
                        <span className="text-sm font-mono font-extrabold text-slate-900">
                          {order.orderNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        তারিখ: {new Date(order.createdAt).toLocaleDateString('bn-BD')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.orderStatus === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.orderStatus === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-teal-100 text-[#00796B]'
                        }`}
                      >
                        {order.orderStatus === 'delivered'
                          ? 'ডেলিভার্ড'
                          : order.orderStatus === 'shipped'
                          ? 'কুরিয়ারে আছে'
                          : order.orderStatus === 'cancelled'
                          ? 'বাতিল'
                          : 'প্রক্রিয়াধীন'}
                      </span>
                      <Link
                        to={`/orders/track?search=${order.orderNumber}`}
                        className="px-3.5 py-1.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                      >
                        লাইভ ট্র্যাকিং
                      </Link>
                    </div>
                  </div>

                  {/* Items in this order */}
                  <div className="divide-y divide-slate-50">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                            <p className="text-[11px] text-slate-400">
                              পরিমাণ: {item.quantity}টি
                              {item.selectedSize && ` | সাইজ: ${item.selectedSize}`}
                              {item.selectedColor && ` | কালার: ${item.selectedColor}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      পেমেন্ট: {order.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.paymentMethod}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      সর্বমোট: ৳{(order.grandTotal || order.total || 0).toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">এখনো কোনো অর্ডার করেননি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                আমাদের আকর্ষণীয় পণ্যের কালেকশন দেখে আপনার পছন্দের পণ্য এখনই অর্ডার করুন।
              </p>
              <Link
                to="/products"
                className="px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#00BFA5]/20 inline-block mt-2"
              >
                শপিং শুরু করুন
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 5. SECURITY & SETTINGS TAB */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#00BFA5]" />
                নিরাপত্তা ও পাসওয়ার্ড সেটিংস
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে নিয়মিত পাসওয়ার্ড আপডেট করুন
              </p>
            </div>

            {/* Password Reset Section */}
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-[#00796B]" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">পাসওয়ার্ড রিসেট বা পরিবর্তন</h4>
                  <p className="text-[11px] text-slate-600">
                    আপনার নিবন্ধিত ইমেইলে ({currentUser.email}) পাসওয়ার্ড রিসেটের নিরাপদ লিংক পাঠানো
                    হবে।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={sendingResetEmail}
                className="w-full py-2.5 bg-[#00796B] hover:bg-[#004D40] text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {sendingResetEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>পাসওয়ার্ড রিসেট লিংক পাঠান</span>
              </button>
            </div>

            {/* Account Information & Logout */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">অ্যাকাউন্ট অ্যাকশন</h4>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">লগআউট করুন</p>
                  <p className="text-[11px] text-slate-500">
                    এই ডিভাইস থেকে আপনার সেশন শেষ করতে চান
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  লগআউট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
