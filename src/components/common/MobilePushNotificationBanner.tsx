/**
 * BD STORE — Native Mobile Push Notification Banner (Heads-Up Popup)
 * When Desktop Mode is OFF (on mobile screens), new notifications pop down smoothly from the top
 * Exactly like native Android / iOS system notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { AppNotification, markNotificationAsRead } from '../../services/notifications';
import { X, ChevronRight, Package, Sparkles, ShoppingCart, Bell } from 'lucide-react';

export const MobilePushNotificationBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeBanner, setActiveBanner] = useState<AppNotification | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const lastKnownIdRef = useRef<string | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isEnabled = settings.features?.notificationPopupEnabled !== false;
  const siteName = settings.siteName || 'Black Zone';
  const siteLogo = settings.siteLogo || '/bd_store_logo.png';

  // Listen for real-time notifications for the banner
  useEffect(() => {
    if (!isEnabled) {
      setActiveBanner(null);
      return;
    }

    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(5));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;

        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Filter for current user or all
        const relevant = docs.filter(
          (n) => n.userId === 'all' || (currentUser && n.userId === currentUser.uid)
        );

        if (relevant.length === 0) return;

        const latest = relevant[0];

        // Only pop up if it's unread and not on /notifications page
        if (!latest.isRead && latest.id !== lastKnownIdRef.current && location.pathname !== '/notifications') {
          lastKnownIdRef.current = latest.id;
          setIsDismissing(false);
          setActiveBanner(latest);

          // Mobile device haptic feedback like a real native push notification
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([25, 40, 25]);
            } catch {
              /* ignore */
            }
          }

          // Clear any old auto-dismiss timer
          if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
          }

          // Auto-hide banner after 7 seconds
          dismissTimerRef.current = setTimeout(() => {
            handleDismiss();
          }, 7000);
        }
      },
      (err) => {
        console.warn('Banner listener warning:', err);
      }
    );

    return () => {
      unsubscribe();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [currentUser, isEnabled, location.pathname]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setActiveBanner(null);
      setIsDismissing(false);
    }, 250);
  };

  const handleBannerTap = async () => {
    if (!activeBanner) return;
    const targetLink = activeBanner.link || '/notifications';
    const notifId = activeBanner.id;

    handleDismiss();

    try {
      await markNotificationAsRead(notifId);
    } catch {
      /* ignore */
    }

    navigate(targetLink);
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-3.5 h-3.5 text-emerald-400" />;
      case 'cart':
        return <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />;
      case 'product':
      case 'promo':
        return <Sparkles className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  if (!activeBanner || !isEnabled || location.pathname === '/notifications') {
    return null;
  }

  return (
    <div
      className={`fixed top-2.5 inset-x-3 z-[9999] md:max-w-md md:left-auto md:right-4 transition-all duration-300 pointer-events-auto select-none ${
        isDismissing
          ? '-translate-y-24 opacity-0 scale-95'
          : 'translate-y-0 opacity-100 scale-100 animate-in slide-in-from-top-6 duration-300'
      }`}
    >
      {/* NATIVE MOBILE PUSH NOTIFICATION CARD (iOS / Android Style) */}
      <div
        onClick={handleBannerTap}
        className="w-full bg-slate-900/95 backdrop-blur-xl text-white rounded-[24px] p-3.5 shadow-2xl border border-white/15 cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-900 ring-1 ring-black/20"
      >
        {/* Top Header: App Identity + Timestamp + Dismiss */}
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src={siteLogo}
              alt=""
              className="w-4 h-4 rounded-md object-cover shadow-2xs"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              {siteName}
            </span>
            <span className="text-[9px] text-slate-500">•</span>
            <span className="text-[9px] font-bold text-teal-400 flex items-center gap-1">
              {getIcon(activeBanner.type)}
              <span>এখনই</span>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1 -mr-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notification Body */}
        <div className="pt-2 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
            {getIcon(activeBanner.type)}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h5 className="text-xs font-black text-white leading-tight truncate">
              {activeBanner.title}
            </h5>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2 font-medium">
              {activeBanner.message}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
        </div>
      </div>
    </div>
  );
};
