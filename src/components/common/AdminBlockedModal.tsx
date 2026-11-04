import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, X, Truck, ShieldCheck } from 'lucide-react';

interface AdminBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  mode?: 'admin' | 'delivery';
}

export const AdminBlockedModal: React.FC<AdminBlockedModalProps> = ({
  isOpen,
  onClose,
  email,
  mode = 'admin',
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isAdmin = mode === 'admin';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-6 overflow-hidden">
        {/* Decorative Top Accent Banner */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            isAdmin
              ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'
              : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon with glowing effect */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-3xl ${
              isAdmin ? 'bg-rose-500/20 animate-pulse' : 'bg-cyan-500/20 animate-pulse'
            }`}
          />
          <div
            className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isAdmin
                ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-rose-500/30'
                : 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-cyan-500/30'
            }`}
          >
            {isAdmin ? <ShieldAlert className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
          </div>
        </div>

        {/* Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          <span>{isAdmin ? 'অ্যাডমিন সুরক্ষা প্রোটোকল' : 'ডেলিভারি পোর্টাল প্রোটোকল'}</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isAdmin
              ? 'ইউজার অ্যাপে অ্যাডমিন লগইন নিষিদ্ধ'
              : 'ইউজার অ্যাপে ডেলিভারি লগইন নিষিদ্ধ'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {isAdmin ? (
              <>
                আপনার ইমেইলটি{' '}
                {email && (
                  <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                    {email}
                  </span>
                )}{' '}
                অ্যাডমিন অ্যাকাউন্ট হিসেবে চিহ্নিত। সাধারণ গ্রাহকদের কেনাকাটার ওয়েবসাইটে
                অ্যাডমিন ইমেইল দিয়ে লগইন বা অ্যাকাউন্ট খোলা সম্পূর্ণ নিষিদ্ধ।
              </>
            ) : (
              <>
                আপনার অ্যাকাউন্টটি ডেলিভারি কর্মী হিসেবে নিবন্ধিত। সাধারণ ইউজার সাইটে ডেলিভারি
                অ্যাকাউন্টে লগইন অনুমোদিত নয়।
              </>
            )}
          </p>
        </div>

        {/* Notice Info Card */}
        <div
          className={`p-4 rounded-2xl text-left border text-xs sm:text-sm space-y-1.5 ${
            isAdmin
              ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
              : 'bg-cyan-50/80 border-cyan-200/80 text-cyan-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>সরাসরি পোর্টালে প্রবেশের নিয়ম:</span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            {isAdmin ? (
              <>
                অ্যাডমিন প্যানেলে ঢুকতে ব্রাউজারের অ্যাড্রেস বারে লিংকের শেষে{' '}
                <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 text-slate-900">
                  /admin
                </strong>{' '}
                লিখে এন্টার করুন এবং আপনার অ্যাডমিন তথ্য দিয়ে লগইন করুন।
              </>
            ) : (
              <>
                ডেলিভারি পোর্টালে যেতে ব্রাউজারের অ্যাড্রেস বারে লিংকের শেষে{' '}
                <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-cyan-300 text-slate-900">
                  /delivery
                </strong>{' '}
                লিখে এন্টার করুন।
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (isAdmin) {
                navigate('/admin');
              } else {
                navigate('/delivery');
              }
            }}
            className={`w-full sm:flex-1 py-3 px-5 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              isAdmin
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-rose-500/25'
                : 'bg-gradient-to-r from-[#00BFA5] to-teal-700 hover:from-[#00A892] hover:to-teal-800 shadow-teal-500/25'
            }`}
          >
            <span>{isAdmin ? 'অ্যাডমিন প্যানেলে যান' : 'ডেলিভারি পোর্টালে যান'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
