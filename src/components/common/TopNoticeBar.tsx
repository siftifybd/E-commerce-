/**
 * BD SHOPS — Dynamic Top Announcement / Marquee Notice Bar
 * Controlled in Real-Time via Admin Portal (Show / Hide / Custom Message)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const TopNoticeBar: React.FC = () => {
  const { settings } = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if feature is enabled in admin settings
  const isEnabled = settings.features?.topNoticeEnabled ?? true;
  const noticeText = settings.features?.topNoticeText || '🎉 বিশেষ অফার: আজকের যেকোনো অর্ডারে সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি!';
  const noticeLink = settings.features?.topNoticeLink || '/products';
  const bgColor = settings.features?.topNoticeBgColor || '#f59e0b'; // Default amber-500
  const textColor = settings.features?.topNoticeTextColor || '#000000';

  if (!isEnabled || isDismissed) {
    return null;
  }

  return (
    <div 
      className="relative text-xs py-2 px-4 shadow-xs z-40 transition-all border-b border-black/5"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center justify-center gap-2 text-center overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/30 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0">
            <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
            অফার
          </span>
          <span className="truncate text-xs sm:text-sm font-extrabold tracking-tight">
            {noticeText}
          </span>
          {noticeLink && (
            <Link
              to={noticeLink}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] underline underline-offset-2 hover:text-white transition-colors shrink-0 ml-1 font-black"
            >
              <span>বিস্তারিত দেখুন</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg hover:bg-black/10 text-slate-900 transition-colors cursor-pointer shrink-0"
          title="বন্ধ করুন"
          aria-label="Dismiss Announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
