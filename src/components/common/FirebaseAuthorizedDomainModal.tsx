/**
 * BD SHOPS — Firebase Authorized Domain Helper Modal
 * Explains how to add the current preview domain to Firebase Console
 * and provides 1-click fallback demo login so testing is never blocked.
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, Sparkles, X, UserCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const FirebaseAuthorizedDomainModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title = 'গুগল সাইন-ইন ডোমেইন অথোরাইজেশন',
}) => {
  const { loginWithDemoAccount } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
  const firebaseSettingsUrl = 'https://console.firebase.google.com/project/telecom-18f17/authentication/settings';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      toast.success('ডোমেইন কপি করা হয়েছে!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDemoCustomerLogin = async () => {
    setDemoLoading(true);
    try {
      await loginWithDemoAccount('customer');
      toast.success('গ্রাহক একাউন্টে সফলভাবে লগইন হয়েছে!');
      onClose();
      navigate('/profile', { replace: true });
    } catch {
      toast.error('ডেমো লগইনে সমস্যা হয়েছে');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setDemoLoading(true);
    try {
      await loginWithDemoAccount('admin');
      toast.success('মাস্টার অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে!');
      onClose();
      navigate('/admin', { replace: true });
    } catch {
      toast.error('ডেমো লগইনে সমস্যা হয়েছে');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">{title}</h3>
              <p className="text-xs text-amber-100 mt-0.5">Firebase Auth Authorized Domain Required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-700">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            গুগল সিকিউরিটি পলিসি অনুযায়ী, বর্তমান প্রিভিউ ডোমেইনটি আপনার Firebase প্রোজেক্টের (<span className="font-mono font-bold text-slate-900">telecom-18f17</span>) Authorized Domains তালিকায় যুক্ত করতে হবে।
          </p>

          {/* Current Domain Box with Copy */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              বর্তমান ডোমেইন (কপি করে ফায়ারবেসে পেস্ট করুন):
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <code className="text-xs sm:text-sm font-mono text-slate-800 break-all flex-1 font-semibold">
                {currentHost}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
            </div>
          </div>

          {/* 3 Step Instructions */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-slate-800">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>📌 মাত্র ৩০ সেকেন্ডে ডোমেইন যুক্ত করার নিয়ম:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
              <li>
                নিচের বাটনে ক্লিক করে <strong>Firebase Console</strong> ওপেন করুন।
              </li>
              <li>
                <strong>Authorized domains</strong> সেকশনে স্ক্রল করে <strong>&quot;Add domain&quot;</strong> ক্লিক করুন।
              </li>
              <li>
                উপরের কপি করা ডোমেইনটি পেস্ট করে <strong>Done</strong> চাপুন।
              </li>
            </ol>

            <a
              href={firebaseSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Firebase Authentication Settings ওপেন করুন</span>
            </a>
          </div>

          {/* Instant 1-Click Fallback Options */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>দেরি না করে এখনই টেস্ট করতে নিচের ১-ক্লিক অপশন বেছে নিন:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleDemoCustomerLogin}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>গ্রাহক ডেমো লগইন</span>
              </button>

              <button
                type="button"
                disabled={demoLoading}
                onClick={handleDemoAdminLogin}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>মাস্টার অ্যাডমিন ডেমো লগইন</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">অথবা নিচে ইমেইল/পাসওয়ার্ড ফর্ম ব্যবহার করুন</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
