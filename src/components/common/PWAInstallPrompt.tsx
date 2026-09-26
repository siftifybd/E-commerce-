import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA installed successfully');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 bg-white rounded-2xl p-4 shadow-2xl border border-teal-100 flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E0F2F1] text-[#00BFA5] flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900">BD SHOPS অ্যাপ ইনস্টল করুন</h4>
          <p className="text-[11px] text-slate-500">দ্রুত শপিং ও অফলাইন এক্সেসের জন্য ইনস্টল করুন</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ইনস্টল</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
