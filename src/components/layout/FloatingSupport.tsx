/**
 * BD SHOPS — Floating Customer Support System ("সাহায্য লাগবে?")
 * Mobile-First Support Dock with Quick Call & WhatsApp Integration
 */

import React, { useState } from 'react';
import { PhoneCall, MessageCircle, HelpCircle, X, Headphones, Clock, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../../constants';

export const FloatingSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed right-4 bottom-20 md:bottom-8 z-30 flex flex-col items-end">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#00A892] to-[#00BFA5] text-white rounded-full shadow-lg shadow-[#00BFA5]/30 hover:scale-105 active:scale-95 transition-all duration-200 group"
            aria-label="Customer Support Assistance"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-100"></span>
            </span>
            <Headphones className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold tracking-wide pr-1">
              সাহায্য লাগবে?
            </span>
          </button>
        )}
      </div>

      {/* Support Popup Sheet / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00796B] to-[#00BFA5] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">BD SHOPS কাস্টমার হেল্পলাইন</h3>
                  <p className="text-xs text-white/85 mt-0.5">আমরা আপনাকে সহযোগিতা করতে সর্বদা প্রস্তুত</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Options */}
            <div className="p-4 sm:p-5 space-y-3">
              {/* Call Option */}
              <a
                href={`tel:${APP_CONFIG.supportPhone}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/60 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#00BFA5] text-white flex items-center justify-center shadow-xs">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">সরাসরি কল করুন</h4>
                    <p className="text-[11px] text-slate-600 font-medium">{APP_CONFIG.supportPhone}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#00BFA5] transition-colors" />
              </a>

              {/* WhatsApp Option */}
              <a
                href={`https://wa.me/${APP_CONFIG.supportWhatsApp}?text=${encodeURIComponent('হ্যালো BD SHOPS, আমি একটি পণ্য/অর্ডার সম্পর্কে জানতে চাই।')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/15 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">WhatsApp এ চ্যাট করুন</h4>
                    <p className="text-[11px] text-slate-600 font-medium">তাৎক্ষণিক মেসেজ ও অর্ডার ট্র্যাকিং</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#25D366] transition-colors" />
              </a>

              {/* Working Hours Info */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 text-slate-600 text-xs">
                <Clock className="w-4 h-4 text-[#00BFA5] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">কাস্টমার কেয়ার সময়সূচি: </span>
                  {APP_CONFIG.workingHours}
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#00BFA5]" />
                <span>যেকোনো প্রশ্ন বা সমস্যায় নির্দ্বিধায় যোগাযোগ করুন</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
