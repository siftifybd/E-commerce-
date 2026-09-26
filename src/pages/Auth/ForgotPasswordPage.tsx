/**
 * BD SHOPS — Forgot Password / Password Reset Screen (পাসওয়ার্ড রিসেট পেজ)
 * Sends secure password reset email link via Firebase Auth
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { APP_CONFIG } from '../../constants';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('আপনার ইমেইল ঠিকানা প্রদান করুন');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setIsSubmitted(true);
      toast.success('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!');
    } catch (err: any) {
      let msg = 'পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে। ইমেইলটি সঠিক কিনা যাচাই করুন।';
      if (err.code === 'auth/user-not-found') {
        msg = 'এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি!';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'সঠিক ইমেইল ফরম্যাট দিন (যেমন: user@gmail.com)';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <Helmet>
        <title>{`পাসওয়ার্ড রিসেট — ${APP_CONFIG.name}`}</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-block">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            BD<span className="text-[#00BFA5]">SHOPS</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          পাসওয়ার্ড রিসেট করুন
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          আপনার একাউন্টের ইমেইল দিন, আমরা একটি নিরাপদ পাসওয়ার্ড রিসেট লিংক পাঠিয়ে দেব।
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-[#00BFA5]" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ইমেইল পাঠানো হয়েছে!
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  আমরা <strong className="text-slate-900">{email}</strong> ঠিকানায় একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠিয়েছি।
                  অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম (Spam) ফোল্ডার চেক করুন।
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  to="/login"
                  className="w-full py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-[#00BFA5]/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>লগইন পেজে ফিরে যান</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-[#00BFA5] underline"
                >
                  অন্য কোনো ইমেইল দিয়ে চেষ্টা করবেন?
                </button>
              </div>
            </div>
          ) : (
            /* Reset Request Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="w-12 h-12 bg-teal-50 text-[#00BFA5] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-teal-100">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  নিবন্ধিত ইমেইল ঠিকানা (Registered Email)
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-[#00BFA5]/25 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>রিসেট লিঙ্ক পাঠান</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00BFA5]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  লগইন পেজে ফিরে যান
                </Link>
              </div>
            </form>
          )}

          {/* Trust Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#00BFA5]" />
            <span>১০০% নিরাপদ ও এনক্রিপ্টেড ডাটা সুরক্ষা</span>
          </div>
        </div>
      </div>
    </div>
  );
};
