/**
 * BD STORE — Notification Bell Component
 * Admin-controlled visibility (ON/OFF) via settings
 * Direct one-tap animated navigation to dedicated /notifications page
 * Live unread badges, wiggle animation & mobile haptic feedback
 */

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { AppNotification } from '../../services/notifications';
import { useNavigate, useLocation } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 1. Check if admin enabled the Notification Popup Icon
  const isEnabled = settings.features?.notificationPopupEnabled !== false;

  // 2. Real-time Firestore notification count listener
  useEffect(() => {
    if (!isEnabled) return;

    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(25));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Filter for all-users or current user
        const filtered = list.filter(
          (n) => n.userId === 'all' || (currentUser && n.userId === currentUser.uid)
        );

        setNotifications(filtered);
      },
      (err) => {
        console.warn('Notification snapshot listener warning:', err);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isEnabled]);

  // If Admin has switched OFF the notification icon, render nothing
  if (!isEnabled) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isCurrentPage = location.pathname === '/notifications';

  const handleOpenNotifications = () => {
    // Mobile haptic vibration feel like native mobile apps
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        /* ignore */
      }
    }

    navigate('/notifications');
  };

  return (
    <button
      onClick={handleOpenNotifications}
      className={`p-2.5 rounded-2xl relative transition-all active:scale-90 cursor-pointer flex items-center group ${
        isCurrentPage
          ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25 ring-2 ring-[#00BFA5]/30'
          : 'text-slate-700 hover:text-[#00BFA5] hover:bg-teal-50/70'
      }`}
      aria-label="নোটিফিকেশন সেন্টার"
      title="নোটিফিকেশন দেখুন"
    >
      <Bell
        className={`w-5 h-5 transition-transform duration-300 ${
          unreadCount > 0
            ? 'animate-wiggle text-[#00BFA5] group-hover:scale-110'
            : isCurrentPage
            ? 'text-white'
            : 'group-hover:rotate-12'
        }`}
      />

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce shadow-md shadow-rose-500/30 ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Pulsing ring indicator for fresh notifications */}
      {unreadCount > 0 && !isCurrentPage && (
        <span className="absolute inset-0 rounded-2xl ring-2 ring-[#00BFA5]/40 animate-ping pointer-events-none" />
      )}
    </button>
  );
};
