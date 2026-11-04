/**
 * BD SHOPS — Customer Registration / Sign Up Screen (নতুন একাউন্ট তৈরি পেজ)
 * Name, Phone, Email & Password Registration + 1-Click Google Sign-up
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Loader2,
  MapPin,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { APP_CONFIG } from '../../constants';
import { BD_ALL_DISTRICTS, getUpazilasForDistrict } from '../../constants/bangladeshData';
import { FirebaseAuthorizedDomainModal } from '../../components/common/FirebaseAuthorizedDomainModal';
import { AdminBlockedModal } from '../../components/common/AdminBlockedModal';
import { verifyIsAdmin, verifyIsDeliveryRider, checkUserBanStatus } from '../../services/adminAuth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerWithEmail, loginWithGoogle, currentUser, logout, addUserAddress } = useAuth();
  const { settings: storeSettings } = useSettings();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('উত্তরা (Uttara)');
  const [streetAddress, setStreetAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  // Admin/Delivery Blocked Fullscreen Modal State
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedModalEmail, setBlockedModalEmail] = useState('');
  const [blockedModalMode, setBlockedModalMode] = useState<'admin' | 'delivery'>('admin');

  // Return to intended page after signup (default to /profile)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  React.useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (!email.trim()) {
      toast.error('ইমেইল ঠিকানা প্রদান করুন');
      return;
    }
    if (password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }
    if (!agreeTerms) {
      toast.error('শর্তাবলীতে সম্মতি দেওয়া আবশ্যক');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Security Check: Prevent registering with admin email
      const isAdmin = await verifyIsAdmin(cleanEmail);
      if (isAdmin) {
        setBlockedModalEmail(cleanEmail);
        setBlockedModalMode('admin');
        setBlockedModalOpen(true);
        setLoading(false);
        return;
      }

      // 2. Prevent registering with delivery email
      const isDelivery = await verifyIsDeliveryRider(cleanEmail);
      if (isDelivery) {
        setBlockedModalEmail(cleanEmail);
        setBlockedModalMode('delivery');
        setBlockedModalOpen(true);
        setLoading(false);
        return;
      }

      // 3. Prevent registering if email is suspended/banned
      const ban = await checkUserBanStatus(cleanEmail);
      if (ban.isBanned) {
        toast.error(`🚫 এই ইমেইলটি ব্যান বা সাসপেন্ড করা হয়েছে! কারণ: ${ban.reason || 'নিরাপত্তা নিষেধাজ্ঞা'}`, { duration: 6000 });
        setLoading(false);
        return;
      }

      await registerWithEmail(email.trim(), password, name.trim(), phone.trim());
      
      // Save address if provided
      if (streetAddress.trim()) {
        try {
          const fullAddr = `${streetAddress.trim()}${upazila ? `, ${upazila}` : ''}, ${district}`;
          await addUserAddress({
            fullName: name.trim(),
            phone: phone.trim(),
            district,
            city: upazila || district,
            upazilaOrArea: upazila,
            streetAddress: fullAddr,
            address: fullAddr,
            deliveryZone: district === 'ঢাকা' ? 'insideDhaka' : 'outsideDhaka',
            type: 'home',
            isDefault: true,
          });
        } catch {
          // Ignore address error
        }
      }

      toast.success('আলহামদুলিল্লাহ! আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।');
      navigate(from, { replace: true });
    } catch (err: any) {
      let msg = 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইলটি দিয়ে ইতিমধ্যে একাউন্ট খোলা হয়েছে! দয়া করে লগইন করুন।';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'সঠিক ইমেইল ফরম্যাট দিন (যেমন: example@gmail.com)';
      } else if (err.code === 'auth/weak-password') {
        msg = 'পাসওয়ার্ড অত্যন্ত দুর্বল। শক্তিশালী পাসওয়ার্ড দিন।';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();

      if (currentUser?.email) {
        const userEmail = currentUser.email.toLowerCase().trim();
        const isAdmin = await verifyIsAdmin(userEmail);
        if (isAdmin) {
          await logout();
          setBlockedModalEmail(userEmail);
          setBlockedModalMode('admin');
          setBlockedModalOpen(true);
          return;
        }

        const isDelivery = await verifyIsDeliveryRider(userEmail);
        if (isDelivery) {
          await logout();
          setBlockedModalEmail(userEmail);
          setBlockedModalMode('delivery');
          setBlockedModalOpen(true);
          return;
        }

        const ban = await checkUserBanStatus(currentUser.uid || userEmail);
        if (ban.isBanned) {
          await logout();
          toast.error(`🚫 আপনার অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে!`, { duration: 6000 });
          return;
        }
      }

      toast.success('গুগল দিয়ে সফলভাবে একাউন্ট তৈরি হয়েছে!');
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setShowDomainModal(true);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error('গুগল সাইন-আপ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const currentBrandName = storeSettings?.siteName || APP_CONFIG.name;
  const currentBrandLogo = storeSettings?.siteLogo || APP_CONFIG.logo;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 relative">
      <Helmet>
        <title>{`নতুন একাউন্ট তৈরি করুন — ${currentBrandName}`}</title>
      </Helmet>

      {/* Direct Back to Home Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-xs transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00BFA5]" />
          <span>হোমপেজে ফিরে যান</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" replace className="inline-flex items-center gap-2.5 justify-center">
          {currentBrandLogo ? (
            <img
              src={currentBrandLogo}
              alt={currentBrandName}
              className="h-11 w-11 object-cover rounded-2xl shadow-xs border border-slate-200/80"
            />
          ) : null}
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {currentBrandName}
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          নতুন কাস্টমার একাউন্ট তৈরি করুন
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          ইতিমধ্যে একাউন্ট আছে?{' '}
          <Link
            to="/login"
            className="font-bold text-[#00796B] hover:text-[#00BFA5] underline ml-1"
          >
            এখানে লগইন করুন
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
          {/* 1-Click Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#00BFA5]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Google দিয়ে ১-ক্লিকে সাইন-আপ</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              অথবা তথ্য পূরণ করে
            </span>
          </div>

          {/* Sign-up Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                আপনার পূর্ণ নাম (Full Name) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ সাব্বির আহমেদ"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                মোবাইল নম্বর (Phone Number)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইমেইল ঠিকানা (Email Address) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* District Selector (64 Districts) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                জেলা (District) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={district}
                  onChange={(e) => {
                    const newDistrict = e.target.value;
                    setDistrict(newDistrict);
                    const ups = getUpazilasForDistrict(newDistrict);
                    if (ups.length > 0) setUpazila(ups[0]);
                  }}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all cursor-pointer"
                >
                  {BD_ALL_DISTRICTS.map((d) => (
                    <option key={d.bnName} value={d.bnName}>
                      {d.bnName} ({d.name}) — {d.division}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upazila / Thana Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                উপজেলা / থানা (Upazila / Thana) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-[#00BFA5]" />
                </div>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all cursor-pointer"
                >
                  {getUpazilasForDistrict(district).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ডেলিভারি ঠিকানা (Full Delivery Address)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Home className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="যেমন: বাসা ১২, রোড ৫, সেক্টর ৪, উত্তরা"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#00BFA5] rounded border-slate-300 focus:ring-[#00BFA5]"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight">
                আমি BD SHOPS-এর{' '}
                <Link to="/terms" target="_blank" className="text-[#00796B] font-bold underline">
                  ব্যবহারের শর্তাবলী
                </Link>{' '}
                ও{' '}
                <Link to="/privacy-policy" target="_blank" className="text-[#00796B] font-bold underline">
                  গোপনীয়তা নীতি
                </Link>{' '}
                মেনে নিচ্ছি।
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-[#00BFA5]/25 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>একাউন্ট তৈরি করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#00BFA5]" />
            <span>১০০% নিরাপদ ও এনক্রিপ্টেড ডাটা সুরক্ষা</span>
          </div>
        </div>
      </div>

      {/* Firebase Authorized Domain Helper Modal */}
      <FirebaseAuthorizedDomainModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        title="গুগল সাইন-আপ ডোমেইন অথোরাইজেশন"
      />

      {/* Admin / Delivery Login Blocked Fullscreen Modal */}
      <AdminBlockedModal
        isOpen={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        email={blockedModalEmail}
        mode={blockedModalMode}
      />
    </div>
  );
};
