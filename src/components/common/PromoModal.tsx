/**
 * BD SHOPS — Promotional Pop-up Modal
 * Managed via Admin Portal settings
 */

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ShoppingBag } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const PromoModal: React.FC = () => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if feature is enabled
    const isEnabled = settings.features?.promoModalEnabled ?? false;
    
    // Only show if enabled and not seen in this session
    const hasSeen = sessionStorage.getItem('bd_shops_promo_seen');
    if (isEnabled && !hasSeen) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [settings.features?.promoModalEnabled]);

  const closePromo = () => {
    setIsOpen(false);
    sessionStorage.setItem('bd_shops_promo_seen', 'true');
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !settings?.features) return null;

  const { promoModalTitle, promoModalSubtitle, promoModalImage, promoModalCoupon } = settings.features;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={closePromo}
          className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image side */}
          <div className="w-full md:w-1/2 h-48 md:h-auto overflow-hidden">
            <img
              src={promoModalImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop'}
              alt="Promotion"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content side */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center text-center md:text-left">
            <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">
              {promoModalTitle || 'বিগ ডিসকাউন্ট অফার!'}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {promoModalSubtitle || 'আমাদের সেরা পণ্যগুলোতে পান ধামাকা ছাড়। এখনই অর্ডার করুন!'}
            </p>

            {promoModalCoupon && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  ব্যবহার করুন কুপন কোড
                </p>
                <div className="flex items-center gap-2 p-1 pl-3 bg-slate-100 rounded-lg border border-slate-200">
                  <span className="flex-1 font-mono font-bold text-slate-800 text-sm tracking-wider">
                    {promoModalCoupon}
                  </span>
                  <button
                    onClick={() => copyCoupon(promoModalCoupon)}
                    className="p-2 bg-white text-orange-600 rounded-md shadow-sm border border-slate-200 hover:bg-orange-50 transition-colors"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={closePromo}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>কেনাকাটা শুরু করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
