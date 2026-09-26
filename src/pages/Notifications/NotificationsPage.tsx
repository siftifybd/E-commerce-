/**
 * BD SHOPS — Dedicated Notifications Center Page
 * Beautiful animated view showing current user's notifications with delete & mark-as-read options
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
  ExternalLink,
  Check,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppNotification[];

        // Filter strictly for current user's data or general public notifications
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

  const handleAllowPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationFromFirestore(id);
      toast.success('নোটিফিকেশনটি মুছে ফেলা হয়েছে');
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('আপনি কি সব নোটিফিকেশন মুছে ফেলতে চান?')) return;
    try {
      await deleteAllNotificationsFromFirestore(notifications);
      toast.success('সকল নোটিফিকেশন মুছে ফেলা হয়েছে!');
    } catch {
      toast.error('মুছে ফেলা সম্ভব হয়নি');
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-emerald-500" />;
      case 'cart':
        return <ShoppingCart className="w-5 h-5 text-amber-500" />;
      case 'product':
        return <Sparkles className="w-5 h-5 text-teal-500" />;
      default:
        return <Bell className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-3 sm:px-6">
      <Helmet>
        <title>আমার নোটিফিকেশনসমূহ — BD SHOPS</title>
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#00BFA5] animate-bounce" />
                আমার নোটিফিকেশন বাক্স ({notifications.length})
              </h1>
              <p className="text-xs text-slate-500">
                আপনার অর্ডারের নতুন স্ট্যাটাস, কার্ট আপডেট ও নতুন অফার এখানে পাবেন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead(notifications)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-[#00796B] hover:bg-teal-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>সব পঠিত চিহ্নিত করুন</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="সব ডিলিট করুন"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">সব মুছুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Android Push Permission Banner */}
        {permission !== 'granted' && (
          <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-[#00796B] text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-teal-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold">অ্যান্ড্রয়েড ও ডিভাইস নোটিফিকেশন অন করুন</h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  অর্ডার কনফার্মেশন ও স্পেশাল ডিসকাউন্ট সরাসরি আপনার ফোনে দেখার জন্য এলাউ দিন।
                </p>
              </div>
            </div>
            <button
              onClick={handleAllowPermission}
              className="px-5 py-2.5 bg-white text-slate-900 rounded-2xl text-xs font-extrabold hover:bg-teal-50 transition-transform active:scale-95 shadow-md shrink-0 cursor-pointer"
            >
              এলাউ বাটন চাপুন
            </button>
          </div>
        )}

        {/* Notifications Animated Card List */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#00BFA5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">নোটিফিকেশন লোড হচ্ছে...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00BFA5] flex items-center justify-center mx-auto">
              <BellOff className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">কোনো নোটিফিকেশন পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                আপনার অ্যাকাউন্টের কোনো নতুন বার্তা বা আপডেট এই মুহূর্তে খালি আছে।
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00BFA5] text-white rounded-2xl text-xs font-bold shadow-md shadow-[#00BFA5]/25 hover:bg-[#00A892] transition-transform active:scale-95"
            >
              <span>কেনাকাটা করতে হোমপেজে যান</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, index) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`group relative p-4 sm:p-5 rounded-3xl transition-all duration-300 cursor-pointer border shadow-xs hover:shadow-md flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                  !n.isRead
                    ? 'bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-white border-teal-200/90'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Type Icon */}
                <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs shrink-0">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-xs sm:text-sm ${!n.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {n.title}
                    </h2>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full">
                        নতুন
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-400 font-semibold">
                    <span>
                      {new Date(n.createdAt).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(n.createdAt).toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {n.link && (
                      <span className="text-[#00796B] font-bold flex items-center gap-0.5 group-hover:underline">
                        <span>বিস্তারিত দেখুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteSingle(e, n.id)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="ডিলিট করুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
