/**
 * BD STORE — Master Notifications Center Page
 * Native Mobile App Feel (When Desktop Mode is Off) & Ultra-Smooth Page Entrance Animations
 * Includes Order Tracking Alerts, Promotional Updates, Category Filters, Swipe/Delete & Haptic Feedback
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Trash2,
  CheckCheck,
  Package,
  ShoppingCart,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  BellOff,
  Clock,
  Filter,
  Volume2,
  ExternalLink,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  AppNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromFirestore,
  deleteAllNotificationsFromFirestore,
  requestNotificationPermission,
} from '../../services/notifications';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'order' | 'promo'>('all');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const siteName = settings.siteName || 'BD STORE';
  const siteLogo = settings.siteLogo || '/bd_store_logo.png';

  // Check device notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Real-time Firestore subscription
  useEffect(() => {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(60));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Filter strictly for current user or global notifications
        const userOnlyList = list.filter(
          (n) => n.userId === 'all' || (currentUser && n.userId === currentUser.uid)
        );

        setNotifications(userOnlyList);
        setLoading(false);
      },
      (err) => {
        console.warn('Notifications snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Trigger mobile vibration
  const triggerHaptic = (duration = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        /* ignore */
      }
    }
  };

  const handleAllowPermission = async () => {
    triggerHaptic(25);
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      toast.success('নোটিফিকেশন অ্যালার্ট সফলভাবে চালু হয়েছে!');
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic(20);
    try {
      await deleteNotificationFromFirestore(id);
      toast.success('নোটিফিকেশন মোছা হয়েছে');
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('আপনি কি সকল নোটিফিকেশন মুছে ফেলতে চান?')) return;
    triggerHaptic(35);
    try {
      await deleteAllNotificationsFromFirestore(notifications);
      toast.success('সকল নোটিফিকেশন মুছে ফেলা হয়েছে!');
    } catch {
      toast.error('মুছে ফেলা সম্ভব হয়নি');
    }
  };

  const handleMarkAllRead = async () => {
    triggerHaptic(15);
    try {
      await markAllNotificationsAsRead(notifications);
      toast.success('সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত');
    } catch {
      toast.error('ব্যর্থ হয়েছে');
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    triggerHaptic(20);
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  // Human friendly relative time formatting
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'এইমাত্র';
      if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
      if (diff < 172800) return 'গতকাল';
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return 'অল্প কিছুক্ষণ আগে';
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-emerald-600" />;
      case 'cart':
        return <ShoppingCart className="w-5 h-5 text-amber-600" />;
      case 'product':
        return <Sparkles className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-sky-600" />;
    }
  };

  // Filtered List
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'order') return n.type === 'order';
    if (activeFilter === 'promo') return n.type === 'promo' || n.type === 'product';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Helmet>
        <title>নোটিফিকেশন সেন্টার — {siteName}</title>
      </Helmet>

      {/* FULL PAGE CONTAINER WITH ENTRANCE ANIMATION */}
      <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-16 animate-in fade-in slide-in-from-bottom-4 zoom-in-[0.99] duration-300">
        
        {/* NATIVE MOBILE APP TOP BAR (Visible on mobile, elegant on desktop) */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-1 rounded-2xl hover:bg-slate-100 text-slate-700 active:scale-90 transition-all cursor-pointer"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src={siteLogo}
                    alt={siteName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-xs border border-slate-200"
                  />
                  <div>
                    <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none flex items-center gap-1.5">
                      <span>নোটিফিকেশন</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold hidden sm:block mt-0.5">
                      অর্ডার আপডেট ও অফার অ্যালার্ট
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#00796B] text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="সব পঠিত করুন"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">সব পঠিত</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 cursor-pointer"
                    title="সব মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* NATIVE APP STYLE HORIZONTAL FILTER PILLS */}
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none mt-1">
              {[
                { id: 'all', label: 'সকল', count: notifications.length },
                { id: 'unread', label: 'অপঠিত', count: unreadCount },
                { id: 'order', label: 'অর্ডার সমূহ', count: notifications.filter((n) => n.type === 'order').length },
                { id: 'promo', label: 'অফার ও আপডেট', count: notifications.filter((n) => n.type === 'promo' || n.type === 'product').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic(10);
                    setActiveFilter(tab.id as typeof activeFilter);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-sm scale-102'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        activeFilter === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-slate-600 shadow-2xs'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 space-y-3">
          
          {/* ANDROID/WEB NATIVE PUSH PERMISSION PROMPT BANNER */}
          {permission !== 'granted' && permission !== 'unsupported' && (
            <div className="bg-gradient-to-r from-teal-500 via-[#00BFA5] to-emerald-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-[#00BFA5]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-white animate-wiggle" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-tight">
                    মোবাইল নোটিফিকেশন চালু করুন
                  </h3>
                  <p className="text-[11px] text-white/90 font-medium">
                    অর্ডার কনফার্মেশন ও ডিসকাউন্ট ভাউচারের তাৎক্ষণিক পুশ অ্যালার্ট পান
                  </p>
                </div>
              </div>
              <button
                onClick={handleAllowPermission}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-[#00796B] hover:bg-teal-50 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer text-center"
              >
                অনুমতি দিন (Allow)
              </button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-white rounded-3xl border border-slate-200 animate-pulse p-4 flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* EMPTY NOTIFICATIONS STATE */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-14 text-center shadow-xs space-y-4 my-6">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                <BellOff className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  {activeFilter === 'unread'
                    ? 'কোনো অপঠিত নোটিফিকেশন নেই'
                    : 'কোনো নোটিফিকেশন পাওয়া যায়নি'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                  {activeFilter === 'unread'
                    ? 'আপনি সব নোটিফিকেশন ইতোমধ্যে দেখে নিয়েছেন।'
                    : 'নতুন কোনো অর্ডার আপডেট বা বিশেষ ছাড় আসলে এখানে সাথে সাথে প্রদর্শিত হবে।'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl text-xs font-black shadow-md shadow-[#00BFA5]/25 active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>পণ্যসমূহ ব্রাউজ করুন</span>
                </Link>
              </div>
            </div>
          ) : (
            /* NOTIFICATION CARDS LIST (MOBILE NATIVE APP STYLE) */
            <div className="space-y-2.5 pt-1">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative p-3.5 sm:p-4 rounded-3xl transition-all cursor-pointer border flex items-start gap-3.5 active:scale-[0.99] select-none ${
                    !n.isRead
                      ? 'bg-gradient-to-r from-teal-50/70 via-white to-white border-teal-200 shadow-sm shadow-teal-500/5 hover:border-[#00BFA5]'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:bg-slate-50/50'
                  }`}
                >
                  {/* APP / CATEGORY ICON BADGE */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs transition-transform group-hover:scale-105 ${
                      !n.isRead
                        ? 'bg-teal-100/70 border border-teal-200'
                        : 'bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* NOTIFICATION TEXT CONTENT */}
                  <div className="flex-1 min-w-0 pr-8">
                    {/* Header line: app title + relative time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                        {siteName}
                      </span>
                      <span className="text-[9px] text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="ml-auto inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                          নতুন
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-xs sm:text-sm tracking-tight leading-snug ${
                        !n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                      }`}
                    >
                      {n.title}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-3">
                      {n.message}
                    </p>

                    {/* Action link pill if present */}
                    {n.link && (
                      <div className="mt-2.5 flex items-center gap-1 text-[11px] font-black text-[#00796B] group-hover:text-[#00BFA5]">
                        <span>বিস্তারিত দেখুন</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSingle(e, n.id)}
                    className="absolute top-3 right-3 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    title="নোটিফিকেশন মুছুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
