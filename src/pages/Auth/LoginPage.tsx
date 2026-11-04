/**
 * BD SHOPS — Customer Login Screen (লগইন পেজ)
 * Email & Password Sign-in, 1-Click Google Authentication & Password Reset Redirection
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { APP_CONFIG } from '../../constants';
import { FirebaseAuthorizedDomainModal } from '../../components/common/FirebaseAuthorizedDomainModal';
import { AdminBlockedModal } from '../../components/common/AdminBlockedModal';
import { verifyIsAdmin, verifyIsDeliveryRider, checkUserBanStatus } from '../../services/adminAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, loginWithGoogle, currentUser, logout } = useAuth();
  const { settings: storeSettings } = useSettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  // Admin/Delivery Blocked Fullscreen Modal State
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedModalEmail, setBlockedModalEmail] = useState('');
  const [blockedModalMode, setBlockedModalMode] = useState<'admin' | 'delivery'>('admin');

  // Return to intended page after login (default to /profile)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  // If already logged in, navigate to profile or return page
  React.useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('ইমেইল ও পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Strict Admin Email Protection: NEVER allow Admin to log into User app!
      const isAdmin = await verifyIsAdmin(cleanEmail);
      if (isAdmin) {
        setBlockedModalEmail(cleanEmail);
        setBlockedModalMode('admin');
        setBlockedModalOpen(true);
        setLoading(false);
        return;
      }

      // 2. Strict Delivery Email Protection: NEVER allow Delivery man to log into User app!
      const isDelivery = await verifyIsDeliveryRider(cleanEmail);
      if (isDelivery) {
        setBlockedModalEmail(cleanEmail);
        setBlockedModalMode('delivery');
        setBlockedModalOpen(true);
        setLoading(false);
        return;
      }

      // 3. Check if user is banned or suspended
      const banCheck = await checkUserBanStatus(cleanEmail);
      if (banCheck.isBanned) {
        toast.error(
          `🚫 আপনার অ্যাকাউন্টটি সাসপেন্ড / ব্যান করা হয়েছে। কারণ: ${banCheck.reason || 'নিরাপত্তা নিষেধাজ্ঞা'}`,
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      await loginWithEmail(cleanEmail, password);
      toast.success('সফলভাবে লগইন হয়েছে!');
      navigate(from, { replace: true });
    } catch (err: any) {
      let msg = 'লগইন করতে ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড পুনরায় যাচাই করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন!';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();

      // Verify Google login account role after popup completes
      // If an admin logged in with Google on the user app, immediately sign out and show blocked modal!
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

      toast.success('গুগল দিয়ে সফলভাবে লগইন হয়েছে!');
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setShowDomainModal(true);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error('গুগল লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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
        <title>{`লগইন করুন — ${currentBrandName}`}</title>
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
          আপনার কাস্টমার একাউন্টে লগইন করুন
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          নতুন গ্রাহক?{' '}
          <Link
            to="/register"
            className="font-bold text-[#00796B] hover:text-[#00BFA5] underline ml-1"
          >
            এখানে নতুন একাউন্ট তৈরি করুন
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
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
            <span>Google দিয়ে ১-ক্লিকে লগইন</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              অথবা ইমেইল দিয়ে
            </span>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ইমেইল ঠিকানা (Email Address)
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  পাসওয়ার্ড (Password)
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-[#00796B] hover:text-[#00BFA5]"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
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

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-[#00BFA5]/25 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>লগইন করুন</span>
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
