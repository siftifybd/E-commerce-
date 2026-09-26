/**
 * BD SHOPS — Notification Bell Component & Dropdown Menu
 * Shows unread count badge, permission prompt for Web/Android, real-time list & mark-as-read
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, ShoppingCart, Package, Sparkles, ExternalLink, ShieldCheck, X, Trash2, ArrowRight } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import {
  AppNotification,
  requestNotificationPermission,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromFirestore,
} from '../../services/notifications';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check current permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen to Firestore Notifications (Real-time)
  useEffect(() => {
    const colRef = collection(db, 'notifications');
    
    // Subscribe to top 15 recent notifications
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Filter strictly for current user's target notifications or public ones
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
  }, [currentUser]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleAllowPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationFromFirestore(id);
      toast.success('নোটিফিকেশন মোছা হয়েছে');
    } catch {
      toast.error('ডিলিট করা যায়নি');
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-emerald-500" />;
      case 'cart':
        return <ShoppingCart className="w-4 h-4 text-amber-500" />;
      case 'product':
        return <Sparkles className="w-4 h-4 text-teal-500" />;
      default:
        return <Bell className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* ANIMATED BELL TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-2xl text-slate-700 hover:text-[#00BFA5] hover:bg-teal-50/60 relative transition-all active:scale-95 cursor-pointer flex items-center group"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'animate-wiggle text-[#00BFA5]' : 'group-hover:rotate-12'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md shadow-emerald-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU WITH ENHANCED ANIMATION */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00BFA5]" />
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                নোটিফিকেশন বক্স ({notifications.length})
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead(notifications)}
                className="text-[11px] font-bold text-[#00796B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>সব পঠিত চিহ্নিত করুন</span>
              </button>
            )}
          </div>

          {/* Android / Web Permission Banner */}
          {permission !== 'granted' && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 p-3 rounded-2xl flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-800">অ্যান্ড্রয়েড ও ডিভাইস নোটিফিকেশন</p>
                <p className="text-[10px] text-slate-500">নতুন অফার ও অর্ডারের তাৎক্ষণিক অ্যালার্ট পেতে এলাউ করুন</p>
              </div>
              <button
                onClick={handleAllowPermission}
                className="px-3 py-1.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
              >
                এলাউ দিন
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto opacity-50" />
                <p>এখনো কোনো নতুন নোটিফিকেশন নেই</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative p-3 rounded-2xl transition-all cursor-pointer border flex items-start gap-3 ${
                    !n.isRead
                      ? 'bg-teal-50/60 border-teal-200/80 hover:bg-teal-50'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                      {new Date(n.createdAt).toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Quick Delete */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSingle(e, n.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Full Page View Navigation */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-[#00BFA5] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>সকল নোটিফিকেশন পেজে দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
