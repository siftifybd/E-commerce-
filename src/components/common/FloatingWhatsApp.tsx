/**
 * BD SHOPS — Floating WhatsApp Chat Button
 * Real-time configuration for number and message via Admin Portal
 * Automatically hides when reaching page footer to prevent overlapping.
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show tooltip after X seconds from admin settings
    const delay = (settings.features?.whatsappTooltipDelay ?? 5) * 1000;
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [settings.features?.whatsappTooltipDelay]);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user is near footer
      const footerEl = document.querySelector('footer');
      if (footerEl) {
        const footerRect = footerEl.getBoundingClientRect();
        // If footer is visible in viewport or close to bottom
        if (footerRect.top <= window.innerHeight - 80) {
          setIsNearFooter(true);
          return;
        }
      }

      // Fallback check based on scroll height
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      if (scrollTop + windowHeight >= documentHeight - 250) {
        setIsNearFooter(true);
      } else {
        setIsNearFooter(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isEnabled = settings.features?.floatingWhatsAppEnabled ?? true;
  const whatsappNumber = settings.whatsappNumber || '01796983725';
  const welcomeMessage = settings.features?.whatsappMessage || 'আসসালামু আলাইকুম! কীভাবে সহযোগিতা করতে পারি?';
  const position = settings.features?.whatsappPosition || 'bottom-right';
  const isLeft = position === 'bottom-left';
  const buttonBgColor = settings.features?.whatsappBgColor || '#25D366';
  const buttonTextColor = settings.features?.whatsappTextColor || '#ffffff';

  // Do not show in admin panel, if disabled, or if near footer
  if (isAdminRoute || !isEnabled || isNearFooter) return null;

  const handleChat = () => {
    const encodedMsg = encodeURIComponent(welcomeMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMsg}`, '_blank');
  };

  return (
    <div
      className={`fixed bottom-24 z-50 flex flex-col gap-3 pointer-events-none transition-all duration-300 ${
        isLeft ? 'left-4 items-start' : 'right-4 items-end'
      }`}
    >
      {/* Tooltip Message */}
      {showTooltip && (
        <div className="bg-white px-4 py-2 rounded-xl shadow-xl border border-slate-100 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-500 pointer-events-auto max-w-[200px] sm:max-w-xs">
          <p className="text-[11px] font-bold text-slate-700 leading-tight">
            {settings.features?.whatsappTooltipText || 'যেকোনো প্রয়োজনে আমাদের সাথে চ্যাট করুন'}
          </p>
          <button 
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={handleChat}
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
        className="group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto overflow-hidden animate-bounce-slow"
        aria-label="Chat on WhatsApp"
      >
        {/* Glitter/Shimmer Effect - Increased intensity */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer pointer-events-none"></div>
        
        {settings.features?.whatsappIcon ? (
          <img src={settings.features.whatsappIcon} className="w-8 h-8 object-contain" alt="WhatsApp" />
        ) : (
          <MessageCircle className="w-8 h-8 fill-current/20 drop-shadow-sm" />
        )}
        
        {/* Pulse Effect */}
        <span
          style={{ backgroundColor: buttonBgColor }}
          className="absolute inset-0 rounded-full animate-ping opacity-30 group-hover:hidden"
        ></span>
        
        {/* Label on Hover */}
        <span
          className={`absolute px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block ${
            isLeft ? 'left-full ml-4' : 'right-full mr-4'
          }`}
        >
          WHATSAPP CHAT
        </span>
      </button>
    </div>
  );
};
