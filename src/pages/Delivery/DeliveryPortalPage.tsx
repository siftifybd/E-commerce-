/**
 * BD SHOPS — Rider Express Delivery Portal (ডেলিভারি ম্যান পোর্টাল ও অর্ডার ম্যানেজমেন্ট)
 * Standalone Delivery Rider Portal accessible via `/delivery` or `/portal/delivery`
 * 
 * Features:
 * 1. Dedicated Rider Express Branding (লোগো, টাইটেল ও আলাদা রাউটিং)
 * 2. Mobile-First rider interface designed for delivery riders on the road.
 * 3. Real-time Firestore sync (onSnapshot) for live order dispatch and status.
 * 4. Total Orders Stats & Payment Filters:
 *    - Total Orders, Cash on Delivery (COD) Count, Online Paid Count
 *    - Separate Filter Buttons: "সকল ডেলিভারি", "ক্যাশ অন ডেলিভারি (COD)", "অনলাইন পেমেন্ট (Paid)"
 * 5. Order Details & Confirmation System:
 *    - Order items list, customer phone call, WhatsApp prefilled message, Google Maps
 *    - 1-Click Delivery Confirmation, Cash Collected Confirmation, Return status with reason
 * 6. Financial Accounting (হিসাব খাতা): Total cash collected, store cash settlement, rider commission earned, date filtering, and printable invoice.
 * 7. Rider Profile & Profile Edit System: Name, Phone, Email, Vehicle Type, Delivery Zone, Duty Status, Password.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Boxes,
  Search,
  LogOut,
  Navigation,
  MessageCircle,
  Calendar,
  RefreshCw,
  Lock,
  User,
  ShieldCheck,
  Check,
  X,
  Printer,
  Copy,
  ExternalLink,
  Edit,
  Save,
  CreditCard,
  Banknote,
  Eye,
  ChevronDown,
  ChevronUp,
  Bike,
  Compass,
  AlertCircle,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSettings } from '../../context/SettingsContext';
import { sanitizeForFirestore } from '../../services/settings';
import {
  verifyStaffLogin,
  updateDeliveryStatusByDeliveryMan,
  calculateDeliveryManAccounting,
  generateStaffPortalUrl,
  saveStaffAccount,
} from '../../services/staff';
import { Order, OrderStatus, StaffAccount } from '../../types';

export const DeliveryPortalPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings: storeSettings } = useSettings();

  // Authentication State
  const [deliveryUser, setDeliveryUser] = useState<StaffAccount | null>(() => {
    const saved = sessionStorage.getItem('bdshops_delivery_auth');
    return saved ? JSON.parse(saved) : null;
  });

  // Query parameter for quick link / user login
  const queryParams = new URLSearchParams(location.search);
  const userParam = queryParams.get('user') || '';

  const [usernameInput, setUsernameInput] = useState(userParam || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active View Tab: 'orders' | 'accounts' | 'profile'
  const [activeTab, setActiveTab] = useState<'orders' | 'accounts' | 'profile'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Search & Filter States
  const [scopeFilter, setScopeFilter] = useState<'all_orders' | 'my_assigned' | 'available'>('all_orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Full Details Modal
  const [viewingOrderDetail, setViewingOrderDetail] = useState<Order | null>(null);

  // Date Filter for Accounting Tab (হিসাব খাতার ফিল্টার)
  const [datePeriod, setDatePeriod] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month'>('all');

  // Status Update Modal State
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'delivered' | 'returned' | 'shipped' | 'confirmed' | null>(null);
  const [collectedCashInput, setCollectedCashInput] = useState<string>('');
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('গ্রাহক ফোন রিসিভ করেননি');
  const [actionNoteInput, setActionNoteInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileVehicle, setProfileVehicle] = useState('Motorbike / বাইক');
  const [profileZone, setProfileZone] = useState('Dhaka Metro / ঢাকা সিটি');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Per Delivery commission rate (default ৳50)
  const deliveryCommission = 50;

  // Initialize Profile form when user state is set
  useEffect(() => {
    if (deliveryUser) {
      setProfileFullName(deliveryUser.fullName || deliveryUser.username);
      setProfilePhone(deliveryUser.phone || '');
      setProfileEmail(deliveryUser.email || '');
    }
  }, [deliveryUser]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      toast.error('ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setIsLoggingIn(true);
    try {
      const staff = await verifyStaffLogin(usernameInput.trim(), passwordInput.trim());
      if (staff) {
        if (staff.role !== 'delivery_man' && staff.role !== 'admin' && staff.role !== 'super_admin') {
          toast.error('শুধুমাত্র ডেলিভারি কর্মীরা এই পোর্টালে প্রবেশ করতে পারবেন');
          setIsLoggingIn(false);
          return;
        }
        setDeliveryUser(staff);
        sessionStorage.setItem('bdshops_delivery_auth', JSON.stringify(staff));
        toast.success(`স্বাগতম, ${staff.fullName || staff.username}!`);
      } else {
        toast.error('ভুল ইউজারনেম বা পাসওয়ার্ড! অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
      }
    } catch (err) {
      console.error(err);
      toast.error('লগইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('bdshops_delivery_auth');
    setDeliveryUser(null);
    toast.success('সফলভাবে লগআউট করা হয়েছে');
  };

  // Real-time Firestore Orders Subscription
  useEffect(() => {
    if (!deliveryUser) return;

    setLoadingOrders(true);
    const ordersCol = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      ordersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          // Robust in-memory sorting by creation date
          list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setOrders(list);
        } else {
          const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
          setOrders(local);
        }
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('Real-time delivery orders subscription error:', err);
        const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
        setOrders(local);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [deliveryUser]);

  // Scoped Orders based on selected tab: 'all_orders' | 'my_assigned' | 'available'
  const scopedOrders = useMemo(() => {
    if (!deliveryUser) return [];
    if (scopeFilter === 'my_assigned') {
      return orders.filter((o) => o.assignedDeliveryManId === deliveryUser.id);
    }
    if (scopeFilter === 'available') {
      return orders.filter((o) => !o.assignedDeliveryManId && !['delivered', 'cancelled', 'returned'].includes(o.orderStatus));
    }
    // 'all_orders' view
    return orders;
  }, [orders, deliveryUser, scopeFilter]);

  // Order Counts by Payment Method & Total
  const orderCounts = useMemo(() => {
    const total = scopedOrders.length;
    const codCount = scopedOrders.filter(
      (o) => o.paymentMethod === 'cash_on_delivery' || o.paymentMethod === 'cod' || o.paymentStatus !== 'paid'
    ).length;
    const onlineCount = scopedOrders.filter((o) => o.paymentStatus === 'paid').length;

    return { total, codCount, onlineCount };
  }, [scopedOrders]);

  // Apply Search, Status Filter & Payment Method Filter
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((order) => {
      // 1. Status Filter
      if (statusFilter === 'pending' && order.orderStatus !== 'pending') return false;
      if (statusFilter === 'confirmed' && !['confirmed', 'processing'].includes(order.orderStatus)) return false;
      if (statusFilter === 'shipped' && order.orderStatus !== 'shipped') return false;
      if (statusFilter === 'delivered' && order.orderStatus !== 'delivered') return false;
      if (statusFilter === 'returned' && !['returned', 'cancelled'].includes(order.orderStatus)) return false;

      // 2. Payment Method Filter (COD vs Online Paid)
      const isPaidOnline = order.paymentStatus === 'paid';
      if (paymentFilter === 'cod' && isPaidOnline) return false;
      if (paymentFilter === 'online' && !isPaidOnline) return false;

      // 3. Search Query Match
      if (searchQuery.trim()) {
        const queryStr = searchQuery.toLowerCase();
        const num = (order.orderNumber || order.id || '').toLowerCase();
        const name = (order.customerName || order.customerInfo?.fullName || '').toLowerCase();
        const phone = (order.phone || order.customerPhone || order.customerInfo?.phone || '').toLowerCase();
        const address = (
          order.address ||
          order.shippingAddress?.streetAddress ||
          order.deliveryAddress?.streetAddress ||
          order.district ||
          order.shippingAddress?.district ||
          ''
        ).toLowerCase();
        return num.includes(queryStr) || name.includes(queryStr) || phone.includes(queryStr) || address.includes(queryStr);
      }

      return true;
    });
  }, [scopedOrders, statusFilter, paymentFilter, searchQuery]);

  // Quick Accept / Self-Assign Order handler
  const handleAcceptOrder = async (order: Order) => {
    if (!deliveryUser) return;
    const toastId = toast.loading('অর্ডারটি নিজের নামে যুক্ত করা হচ্ছে...');
    try {
      const docRef = doc(db, 'orders', order.id);
      await updateDoc(
        docRef,
        sanitizeForFirestore({
          assignedDeliveryManId: deliveryUser.id,
          assignedDeliveryManName: deliveryUser.fullName || deliveryUser.username,
          deliveryStatus: 'assigned',
          updatedAt: new Date().toISOString(),
        })
      );
      toast.success('অর্ডারটি সফলভাবে আপনার নামের সাথে যুক্ত হয়েছে!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('অর্ডার গ্রহণ করতে সমস্যা হয়েছে', { id: toastId });
    }
  };

  // Quick 1-Click Order Confirmation
  const handleQuickConfirmOrder = async (order: Order) => {
    if (!deliveryUser) return;
    const toastId = toast.loading('অর্ডার নিশ্চিত (Confirmed) করা হচ্ছে...');
    try {
      await updateDeliveryStatusByDeliveryMan(order.id, 'confirmed', deliveryUser, {
        note: 'ডেলিভারি ম্যান সরাসরি অর্ডারটি কনফার্ম করেছেন',
      });
      toast.success('অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('কনফার্ম করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    }
  };

  // Quick 1-Click Out for Delivery
  const handleQuickShipOrder = async (order: Order) => {
    if (!deliveryUser) return;
    const toastId = toast.loading('অন দ্য ওয়ে (Out for Delivery) মার্ক করা হচ্ছে...');
    try {
      await updateDeliveryStatusByDeliveryMan(order.id, 'shipped', deliveryUser, {
        note: 'ডেলিভারি কর্মী পণ্য নিয়ে রওনা হয়েছেন',
      });
      toast.success('অর্ডারটি অন দ্য ওয়ে মার্ক করা হয়েছে!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    }
  };

  // Orders specifically assigned to this delivery rider for personal accounting/ledger
  const myAssignedOrders = useMemo(() => {
    if (!deliveryUser) return [];
    return orders.filter(
      (o: Order) => o.assignedDeliveryManId === deliveryUser.id || deliveryUser.role === 'admin' || deliveryUser.role === 'super_admin'
    );
  }, [orders, deliveryUser]);

  // Financial Accounting Calculations
  const accounting = useMemo(() => {
    if (!deliveryUser) {
      return {
        period: 'all' as const,
        totalAssignedOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        returnedOrders: 0,
        totalCashToCollect: 0,
        totalCashCollected: 0,
        deliveryFeeEarned: 0,
        cashInHandToAdmin: 0,
        todayCashCollected: 0,
        todayCompletedCount: 0,
      };
    }
    return calculateDeliveryManAccounting(deliveryUser.id, myAssignedOrders, deliveryCommission, datePeriod);
  }, [deliveryUser, myAssignedOrders, deliveryCommission, datePeriod]);

  // Open status change modal
  const handleOpenActionModal = (order: Order, type: 'delivered' | 'returned' | 'shipped' | 'confirmed') => {
    setSelectedOrderForAction(order);
    setActionType(type);
    if (type === 'delivered') {
      const grandTotal = order.grandTotal || order.total || 0;
      setCollectedCashInput(order.paymentStatus === 'paid' ? '0' : String(grandTotal));
    } else {
      setCollectedCashInput('');
    }
    setSelectedReturnReason('গ্রাহক ফোন রিসিভ করেননি');
    setActionNoteInput('');
  };

  // Submit Status Update directly to Firestore
  const handleConfirmStatusUpdate = async () => {
    if (!selectedOrderForAction || !actionType || !deliveryUser) return;

    setIsUpdatingStatus(true);
    const toastId = toast.loading('অর্ডার স্ট্যাটাস আপডেট হচ্ছে...');

    try {
      const cashAmount = actionType === 'delivered' ? parseFloat(collectedCashInput) || 0 : undefined;
      const finalReturnReason =
        actionType === 'returned'
          ? actionNoteInput.trim()
            ? `${selectedReturnReason} - ${actionNoteInput.trim()}`
            : selectedReturnReason
          : undefined;

      await updateDeliveryStatusByDeliveryMan(selectedOrderForAction.id, actionType, deliveryUser, {
        cashCollected: cashAmount,
        returnReason: finalReturnReason,
        note: actionNoteInput,
      });

      toast.success(
        actionType === 'delivered'
          ? 'ডেলিভারি ও ক্যাশ কালেকশন সফলভাবে সম্পন্ন হয়েছে (Delivered)!'
          : actionType === 'shipped'
          ? 'অর্ডার অন দ্য ওয়ে (Out for Delivery) মার্ক করা হয়েছে!'
          : actionType === 'confirmed'
          ? 'অর্ডারটি কনফার্মড (Confirmed) মার্ক করা হয়েছে!'
          : 'অর্ডারটি রিটার্ন হিসাবে নথিভুক্ত করা হয়েছে!',
        { id: toastId }
      );

      setSelectedOrderForAction(null);
      setActionType(null);
      if (viewingOrderDetail?.id === selectedOrderForAction.id) {
        setViewingOrderDetail(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Rider Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryUser) return;

    setIsSavingProfile(true);
    try {
      const updatedAccount: StaffAccount = {
        ...deliveryUser,
        fullName: profileFullName,
        phone: profilePhone,
        email: profileEmail,
        password: profileNewPassword.trim() ? profileNewPassword.trim() : deliveryUser.password,
        updatedAt: new Date().toISOString(),
      };

      await saveStaffAccount(updatedAccount);
      setDeliveryUser(updatedAccount);
      sessionStorage.setItem('bdshops_delivery_auth', JSON.stringify(updatedAccount));

      toast.success('রাইডার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      setIsEditingProfile(false);
      setProfileNewPassword('');
    } catch (err: any) {
      toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Copy portal URL shortcut
  const handleCopyPortalLink = () => {
    if (!deliveryUser) return;
    const url = generateStaffPortalUrl(deliveryUser.username, deliveryUser.role);
    navigator.clipboard.writeText(url);
    toast.success('আপনার লাইভ পোর্টাল লিংক কপি করা হয়েছে!');
  };

  // =========================================================================
  // VIEW: LOGIN SCREEN (If not authenticated)
  // =========================================================================
  if (!deliveryUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <Helmet>
          <title>ডেলিভারি ম্যান পোর্টাল — {storeSettings?.siteName || 'BD SHOPS'}</title>
        </Helmet>

        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Header Rider Express Logo & Branding */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/25 border border-amber-400/30">
              <Truck className="w-10 h-10 text-white animate-bounce" />
              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900">
                EXPRESS
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>{storeSettings?.siteName || 'BD SHOPS'}</span>
              <span className="text-amber-400">RIDER</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              অফিশিয়াল ডেলিভারি ম্যান পোর্টাল ও রিয়েল-টাইম অর্ডার ট্র্যাকিং
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                ইউজারনেম (Rider Username)
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: rider_rahim"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="আপনার সিক্রেট পাসওয়ার্ড"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  যাচাই করা হচ্ছে...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  পোর্টালে লগইন করুন
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            সমস্যা হলে শপ অ্যাডমিনের সাথে যোগাযোগ করুন
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN DELIVERY DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <Helmet>
        <title>রাইডার পোর্টাল — {deliveryUser.fullName || deliveryUser.username}</title>
      </Helmet>

      {/* TOP HEADER BRANDING */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20 font-bold">
              <Truck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-base leading-tight">
                  {deliveryUser.fullName || deliveryUser.username}
                </h1>
                <button
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    isOnDuty
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                  title="অন-ডিউটি স্ট্যাটাস টগল করুন"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {isOnDuty ? 'অন-ডিউটি' : 'অফ-ডিউটি'}
                </button>
              </div>
              <p className="text-xs text-slate-400">{storeSettings?.siteName || 'BD SHOPS'} রাইডার এক্সপ্রেস</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPortalLink}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="পোর্টাল লিংক কপি করুন"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="রিফ্রেশ"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            ডেলিভারি অর্ডারস ({orderCounts.total})
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            হিসাব খাতা ও ক্যাশ কালেকশন
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            রাইডার প্রোফাইল
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* =================================================================== */}
        {/* TOP TOTAL ORDERS & PAYMENT METHOD STAT CARDS */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Orders Card */}
          <div
            onClick={() => {
              setActiveTab('orders');
              setPaymentFilter('all');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              paymentFilter === 'all' && activeTab === 'orders'
                ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase">মোট অর্ডার (Total Orders)</span>
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{orderCounts.total} টি</div>
            <p className="text-[11px] text-slate-400 mt-1">সকল ধরনের পিকআপ ও ডেলিভারি</p>
          </div>

          {/* Cash on Delivery Card */}
          <div
            onClick={() => {
              setActiveTab('orders');
              setPaymentFilter('cod');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              paymentFilter === 'cod' && activeTab === 'orders'
                ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase text-amber-300">ক্যাশ অন ডেলিভারি (COD)</span>
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{orderCounts.codCount} টি</div>
            <p className="text-[11px] text-amber-300/80 mt-1">কাস্টমার ডেলিভারির সময় ক্যাশ দেবে</p>
          </div>

          {/* Online Payment Card */}
          <div
            onClick={() => {
              setActiveTab('orders');
              setPaymentFilter('online');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              paymentFilter === 'online' && activeTab === 'orders'
                ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase text-emerald-300">অনলাইন পেমেন্ট (Online Paid)</span>
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{orderCounts.onlineCount} টি</div>
            <p className="text-[11px] text-emerald-300/80 mt-1">অনলাইনে পে করা (ক্যাশ নিতে হবে না)</p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: ORDERS DASHBOARD */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* SCOPE SELECTOR & PAYMENT METHOD SELECTION BUTTONS */}
            <div className="space-y-3">
              {/* Scope Switcher: All Store Orders vs My Assigned */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setScopeFilter('all_orders')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    scopeFilter === 'all_orders'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  সকল ইউজারের অর্ডার ({orders.length})
                </button>
                <button
                  onClick={() => setScopeFilter('my_assigned')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    scopeFilter === 'my_assigned'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  আমার ডেলিভারি ({orders.filter(o => o.assignedDeliveryManId === deliveryUser?.id).length})
                </button>
                <button
                  onClick={() => setScopeFilter('available')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    scopeFilter === 'available'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  আন-অ্যাসাইনড ({orders.filter(o => !o.assignedDeliveryManId && !['delivered', 'cancelled', 'returned'].includes(o.orderStatus)).length})
                </button>
              </div>

              {/* Payment Method Filter Bar */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  <button
                    onClick={() => setPaymentFilter('all')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                      paymentFilter === 'all'
                        ? 'bg-slate-100 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    সব ডেলিভারি ({orderCounts.total})
                  </button>

                  <button
                    onClick={() => setPaymentFilter('cod')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                      paymentFilter === 'cod'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border border-slate-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    ক্যাশ অন ডেলিভারি / COD ({orderCounts.codCount})
                  </button>

                  <button
                    onClick={() => setPaymentFilter('online')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                      paymentFilter === 'online'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 text-emerald-400/90 hover:text-emerald-300 border border-slate-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    অনলাইন পেমেন্ট / Paid ({orderCounts.onlineCount})
                  </button>
                </div>

                {/* Status Filter Badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  {[
                    { id: 'all', label: 'সব স্ট্যাটাস', count: scopedOrders.length },
                    { id: 'pending', label: 'নতুন অর্ডার', count: scopedOrders.filter(o => o.orderStatus === 'pending').length },
                    { id: 'confirmed', label: 'কনফার্মড', count: scopedOrders.filter(o => o.orderStatus === 'confirmed' || o.orderStatus === 'processing').length },
                    { id: 'shipped', label: 'অন দ্য ওয়ে', count: scopedOrders.filter(o => o.orderStatus === 'shipped').length },
                    { id: 'delivered', label: 'ডেলিভার্ড', count: scopedOrders.filter(o => o.orderStatus === 'delivered').length },
                    { id: 'returned', label: 'রিটার্ন', count: scopedOrders.filter(o => ['returned', 'cancelled'].includes(o.orderStatus)).length },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        statusFilter === st.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{st.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        statusFilter === st.id ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {st.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="অর্ডার নাম্বার, কাস্টমার নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Orders Feed */}
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
                <p className="text-sm">লাইভ অর্ডার লোড হচ্ছে...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-white">কোনো অর্ডার পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery
                    ? 'সার্চ ফিল্টারে কোনো ম্যাচিং নেই'
                    : paymentFilter === 'cod'
                    ? 'কোনো ক্যাশ অন ডেলিভারি অর্ডার নেই'
                    : paymentFilter === 'online'
                    ? 'কোনো অনলাইন পরিশোধিত অর্ডার নেই'
                    : 'আপনাকে কোনো অর্ডার এখনো অ্যাসাইন করা হয়নি'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  const customerPhone =
                    order.phone || order.customerPhone || order.customerInfo?.phone || '';
                  const customerName =
                    order.customerName || order.customerInfo?.fullName || 'সম্মানিত গ্রাহক';
                  const deliveryAddress =
                    order.address ||
                    order.shippingAddress?.streetAddress ||
                    order.deliveryAddress?.streetAddress ||
                    order.shippingAddress?.district ||
                    'ঠিকানা উল্লেখ নেই';
                  const grandTotal = order.grandTotal || order.total || 0;
                  const isPrepaid = order.paymentStatus === 'paid';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Top Bar: Order ID & Status Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-amber-400 font-bold">
                                #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                              </span>
                              {isPrepaid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                  ONLINE PAID
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                                  COD
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {order.orderStatus === 'delivered' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ডেলিভার্ড
                              </span>
                            ) : order.orderStatus === 'shipped' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Truck className="w-3.5 h-3.5 animate-pulse" />
                                অন দ্য ওয়ে
                              </span>
                            ) : order.orderStatus === 'returned' || order.orderStatus === 'cancelled' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                রিটার্ন
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" />
                                প্রসেসিং
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-white text-base leading-snug">
                                {customerName}
                              </h4>
                              {customerPhone && (
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                  {customerPhone}
                                </p>
                              )}
                            </div>

                            {/* Direct Quick Actions: Call & WhatsApp */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {customerPhone && (
                                <>
                                  <a
                                    href={`tel:${customerPhone}`}
                                    className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center cursor-pointer"
                                    title="সরাসরি কল করুন"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={`https://wa.me/88${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `আসসালামু আলাইকুম ${customerName}, আপনার ${storeSettings?.siteName || 'BD SHOPS'}-এর অর্ডার #${order.orderNumber || order.id.slice(-6)} নিয়ে ডেলিভারির জন্য আসছি।`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center cursor-pointer"
                                    title="WhatsApp মেসেজ দিন"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Address with Google Maps link */}
                          <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 text-xs text-slate-300 leading-relaxed">
                              {deliveryAddress}
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                deliveryAddress
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold shrink-0 cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              ম্যাপ
                            </a>
                          </div>
                        </div>

                        {/* Order Products Preview & View Details Button */}
                        <div className="border-t border-slate-800/80 pt-2 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              পণ্যের বিবরণ ({order.items?.length || 0} টি আইটেম)
                            </span>
                            <button
                              onClick={() => setViewingOrderDetail(order)}
                              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              সম্পূর্ণ ডিটেইলস
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                            {order.items?.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-slate-950/70 rounded-xl border border-slate-800/60">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {it.image ? (
                                    <img src={it.image} alt={it.name} className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 shrink-0">
                                      পণ্য
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-200 text-xs truncate">{it.name}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {it.quantity} টি × ৳{it.price}
                                      {it.selectedSize ? ` • সাইজ: ${it.selectedSize}` : ''}
                                      {it.selectedColor ? ` • কালার: ${it.selectedColor}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-amber-400 text-xs">৳{(it.quantity * it.price).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cash Collection Banner */}
                        <div
                          className={`p-3 rounded-2xl border flex items-center justify-between mb-4 ${
                            isPrepaid
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          }`}
                        >
                          <div>
                            <span className="text-[11px] font-semibold block uppercase">
                              {isPrepaid ? 'অনলাইনে পরিশোধিত (Paid)' : 'ক্যাশ অন ডেলিভারি (COD)'}
                            </span>
                            <span className="text-lg font-bold">
                              {isPrepaid ? '৳০ সংগ্রহ করতে হবে' : `৳${grandTotal.toLocaleString('en-BD')} ক্যাশ কালেকশন`}
                            </span>
                          </div>
                          <DollarSign className="w-6 h-6 opacity-60" />
                        </div>
                      </div>

                      {/* Status Action Buttons for Delivery Rider */}
                      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
                        {!order.assignedDeliveryManId && (
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Bike className="w-4 h-4" />
                            অর্ডারটি গ্রহণ করুন (Accept & Assign to Me)
                          </button>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {order.orderStatus !== 'delivered' && order.orderStatus !== 'returned' && (
                            <>
                              {order.orderStatus === 'pending' && (
                                <button
                                  onClick={() => handleQuickConfirmOrder(order)}
                                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer active:scale-95"
                                  title="১-ক্লিকে অর্ডার কনফার্ম করুন"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  কনফার্ম করুন
                                </button>
                              )}

                              {order.orderStatus !== 'shipped' && (
                                <button
                                  onClick={() => handleQuickShipOrder(order)}
                                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer active:scale-95"
                                  title="১-ক্লিকে অন দ্য ওয়ে মার্ক করুন"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Out for Delivery
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenActionModal(order, 'delivered')}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Delivered
                              </button>

                              <button
                                onClick={() => handleOpenActionModal(order, 'returned')}
                                className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                রিটার্ন
                              </button>
                            </>
                          )}
                        </div>

                        {order.orderStatus === 'delivered' && (
                          <div className="w-full text-center py-1.5 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <Check className="w-4 h-4" />
                            সফলভাবে ডেলিভারি করা হয়েছে (৳{order.cashCollectedAmount !== undefined ? order.cashCollectedAmount : grandTotal} সংগৃহীত)
                          </div>
                        )}

                        {order.orderStatus === 'returned' && (
                          <div className="w-full text-center py-1.5 text-xs text-rose-400 font-semibold flex items-center justify-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-4 h-4" />
                            অর্ডারটি রিটার্ন হয়েছে ({order.returnReason || 'কাস্টমার রিসিভ করেননি'})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: FINANCIAL ACCOUNTING & CASH SETTLEMENT (হিসাব খাতা) */}
        {/* =================================================================== */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl print:p-0 print:border-none print:bg-white print:text-black">
              {/* Header and Date Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:border-b-2 print:border-black">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                    <DollarSign className="w-5 h-5 text-amber-400 print:text-black" />
                    ডেলিভারি ক্যাশ হিসাব খাতা ও সামারি
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 print:text-gray-600">
                    কোম্পানি এবং রাইডারের মধ্যকার ক্যাশ কালেকশন ও কমিশন সেটেলমেন্ট হিসাব
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    {[
                      { id: 'all', label: 'সব সময়' },
                      { id: 'today', label: 'আজ' },
                      { id: 'yesterday', label: 'গতকাল' },
                      { id: 'this_week', label: 'এই সপ্তাহ' },
                      { id: 'this_month', label: 'এই মাস' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setDatePeriod(p.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          datePeriod === p.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    প্রিন্ট চালান
                  </button>
                </div>
              </div>

              {/* Printable Header Info */}
              <div className="hidden print:block my-4 text-xs space-y-1">
                <div className="text-base font-bold">{storeSettings?.siteName || 'BD SHOPS'} - ডেলিভারি হিসাব চালান</div>
                <div>ডেলিভারি কর্মী: {deliveryUser.fullName} ({deliveryUser.username}) | মোবাইল: {deliveryUser.phone || 'N/A'}</div>
                <div>তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>

              {/* Detailed Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:border print:border-gray-300 print:bg-gray-50">
                  <span className="text-xs text-slate-400 block mb-1 print:text-gray-600">মোট ক্যাশ সংগ্রহ</span>
                  <span className="text-2xl font-bold text-cyan-400 print:text-black">
                    ৳{accounting.totalCashCollected.toLocaleString('en-BD')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1 print:text-gray-500">
                    {accounting.completedOrders} টি সফল ডেলিভারি থেকে
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:border print:border-gray-300 print:bg-gray-50">
                  <span className="text-xs text-slate-400 block mb-1 print:text-gray-600">রাইডার কমিশন (অর্জিত)</span>
                  <span className="text-2xl font-bold text-emerald-400 print:text-black">
                    ৳{accounting.deliveryFeeEarned.toLocaleString('en-BD')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1 print:text-gray-500">
                    প্রতি অর্ডারে ৳{deliveryCommission} হারে
                  </span>
                </div>

                <div className="bg-gradient-to-tr from-amber-500/20 to-orange-500/20 p-4 rounded-2xl border border-amber-500/40 print:border print:border-gray-300 print:bg-gray-50">
                  <span className="text-xs text-amber-300 block mb-1 print:text-gray-600">শপ মালিককে জমা দেওয়ার টাকা</span>
                  <span className="text-2xl font-bold text-amber-400 print:text-black">
                    ৳{accounting.cashInHandToAdmin.toLocaleString('en-BD')}
                  </span>
                  <span className="text-[11px] text-amber-300/80 block mt-1 print:text-gray-500">
                    (ক্যাশ সংগৃহীত - রাইডার কমিশন)
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:border print:border-gray-300 print:bg-gray-50">
                  <span className="text-xs text-slate-400 block mb-1 print:text-gray-600">আজকের ক্যাশ কালেকশন</span>
                  <span className="text-2xl font-bold text-purple-400 print:text-black">
                    ৳{(accounting.todayCashCollected || 0).toLocaleString('en-BD')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1 print:text-gray-500">
                    আজকের সফল: {accounting.todayCompletedCount || 0} টি
                  </span>
                </div>
              </div>

              {/* Delivered Orders History */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 print:text-black">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
                  সফল ডেলিভারি ও সংগৃহীত ক্যাশের তালিকা ({myAssignedOrders.filter((o) => o.orderStatus === 'delivered').length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 print:text-black">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase border-y border-slate-800 print:bg-gray-100 print:text-black print:border-gray-400">
                      <tr>
                        <th className="py-3 px-4">অর্ডার আইডি</th>
                        <th className="py-3 px-4">গ্রাহক</th>
                        <th className="py-3 px-4">তারিখ</th>
                        <th className="py-3 px-4">অর্ডার মোট</th>
                        <th className="py-3 px-4">সংগৃহীত ক্যাশ</th>
                        <th className="py-3 px-4">কমিশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                      {myAssignedOrders
                        .filter((o) => o.orderStatus === 'delivered')
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-amber-400 print:text-black">
                              #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4 font-medium text-white print:text-black">
                              {order.customerName || order.customerInfo?.fullName}
                              <div className="text-[10px] text-slate-500 print:text-gray-600">{order.phone}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-400 print:text-gray-600">
                              {new Date(order.deliveryCompletedAt || order.updatedAt || order.createdAt).toLocaleDateString(
                                'bn-BD',
                                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              ৳{(order.grandTotal || order.total || 0).toLocaleString('en-BD')}
                            </td>
                            <td className="py-3 px-4 font-bold text-cyan-400 print:text-black">
                              ৳{(order.cashCollectedAmount !== undefined
                                ? order.cashCollectedAmount
                                : order.grandTotal || order.total || 0
                              ).toLocaleString('en-BD')}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-400 print:text-black">
                              ৳{deliveryCommission}
                            </td>
                          </tr>
                        ))}

                      {myAssignedOrders.filter((o) => o.orderStatus === 'delivered').length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            এখনো কোনো ডেলিভারি সম্পন্ন হয়নি
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable Signature Footers */}
              <div className="hidden print:flex justify-between items-end mt-16 pt-8 border-t border-gray-400 text-xs text-black">
                <div className="text-center">
                  <div className="w-40 border-b border-black mb-1"></div>
                  <div>ডেলিভারি কর্মীর স্বাক্ষর</div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-black mb-1"></div>
                  <div>দোকান ম্যানেজার/অ্যাডমিনের স্বাক্ষর</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: RIDER PROFILE & EDIT SYSTEM */}
        {/* =================================================================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-800 pb-6 text-center sm:text-left">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 border-2 border-amber-400/30 shrink-0">
                  {(deliveryUser.fullName || deliveryUser.username || 'R').slice(0, 1).toUpperCase()}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl font-bold text-white">
                      {deliveryUser.fullName || deliveryUser.username}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                      OFFICIAL RIDER
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ইউজারনেম: <span className="font-mono text-amber-300">@{deliveryUser.username}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    পোর্টালে যোগদানের তারিখ: {deliveryUser.createdAt ? new Date(deliveryUser.createdAt).toLocaleDateString('bn-BD') : 'নভেম্বর ২০২৪'}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  {isEditingProfile ? 'বাতিল করুন' : 'প্রোফাইল এডিট'}
                </button>
              </div>

              {/* Profile Details or Edit Form */}
              {!isEditingProfile ? (
                <div className="pt-6 space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 text-xs block mb-1">ফোন নম্বর</span>
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 text-amber-400" />
                        {deliveryUser.phone || 'ফোন আপডেট করা হয়নি'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 text-xs block mb-1">ইমেইল এড্রেস</span>
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-400" />
                        {deliveryUser.email || 'ইমেইল আপডেট করা হয়নি'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 text-xs block mb-1">যানবাহন প্রকার (Vehicle)</span>
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Bike className="w-4 h-4 text-emerald-400" />
                        {profileVehicle}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-400 text-xs block mb-1">ডেলিভারি এরিয়া / জোন</span>
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400" />
                        {profileZone}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300/90 leading-relaxed">
                    💡 <span className="font-bold text-amber-400">টিপস:</span> পোর্টালে আপনার যেকোনো গ্রাহকের সাথে যোগাযোগ, সরাসরি কল অথবা ম্যাপ লিঙ্ক ব্যবহারে কোনো সমস্যা হলে আপনার ফোন নম্বর আপডেট রাখুন।
                  </div>
                </div>
              ) : (
                /* Profile Edit Form */
                <form onSubmit={handleSaveProfile} className="pt-6 space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      পুরো নাম (Full Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        মোবাইল নম্বর (Phone)
                      </label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        ইমেইল (Email)
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        যানবাহনের বিবরণ (Vehicle Type)
                      </label>
                      <select
                        value={profileVehicle}
                        onChange={(e) => setProfileVehicle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                      >
                        <option value="Motorbike / বাইক">Motorbike / মোটরসাইকেল</option>
                        <option value="Bicycle / বাইসাইকেল">Bicycle / বাইসাইকেল</option>
                        <option value="Electric Scooter / স্কুটার">Electric Scooter / স্কুটার</option>
                        <option value="Easy Bike / অটো">Easy Bike / অটো</option>
                        <option value="Foot Rider / পায়ে হেঁটে">Foot Rider / পায়ে হেঁটে</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        ডেলিভারি জোন (Zone Area)
                      </label>
                      <select
                        value={profileZone}
                        onChange={(e) => setProfileZone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                      >
                        <option value="Dhaka Metro / ঢাকা সিটি">Dhaka Metro / ঢাকা সিটি</option>
                        <option value="Chittagong Metro / চট্টগ্রাম">Chittagong Metro / চট্টগ্রাম</option>
                        <option value="Dhaka Suburb / সাভার-গাজীপুর">Dhaka Suburb / সাভার-গাজীপুর</option>
                        <option value="All Bangladesh / সমগ্র বাংলাদেশ">All Bangladesh / সমগ্র বাংলাদেশ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      নতুন পাসওয়ার্ড (Password — পরিবর্তন করতে চাইলে লিখুন)
                    </label>
                    <input
                      type="password"
                      placeholder="নতুন পাসওয়ার্ড দিন (না বদলাতে চাইলে ফাঁকা রাখুন)"
                      value={profileNewPassword}
                      onChange={(e) => setProfileNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      {isSavingProfile ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      প্রোফাইল সেভ করুন
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FULL ORDER DETAILS MODAL */}
      {viewingOrderDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  অর্ডার ডিটেইলস #{viewingOrderDetail.orderNumber || viewingOrderDetail.id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setViewingOrderDetail(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>পেমেন্ট টাইপ:</span>
                {viewingOrderDetail.paymentStatus === 'paid' ? (
                  <span className="font-bold text-emerald-400">অনলাইন পেইড (Paid)</span>
                ) : (
                  <span className="font-bold text-amber-400">ক্যাশ অন ডেলিভারি (COD)</span>
                )}
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>কাস্টমারের নাম:</span>
                <span className="font-bold text-white">
                  {viewingOrderDetail.customerName || viewingOrderDetail.customerInfo?.fullName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>ফোন নম্বর:</span>
                <span className="font-mono font-bold text-white">
                  {viewingOrderDetail.phone || viewingOrderDetail.customerPhone || viewingOrderDetail.customerInfo?.phone}
                </span>
              </div>
              <div className="text-slate-400">
                <span>ডেলিভারি ঠিকানা:</span>
                <p className="text-white font-medium mt-0.5 leading-relaxed">
                  {viewingOrderDetail.address ||
                    viewingOrderDetail.shippingAddress?.streetAddress ||
                    viewingOrderDetail.deliveryAddress?.streetAddress}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                অর্ডারের প্রোডাক্টসমূহ ({viewingOrderDetail.items?.length || 0} টি)
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {viewingOrderDetail.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[10px]">
                          ছবি নেই
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white line-clamp-1">{item.name}</div>
                        <div className="text-slate-400 text-[11px]">
                          পরিমাণ: {item.quantity} টি × ৳{item.price}
                          {item.selectedSize ? ` • সাইজ: ${item.selectedSize}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-amber-400">
                      ৳{item.quantity * item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>সাব-টোটাল:</span>
                <span>৳{(viewingOrderDetail.subtotal || viewingOrderDetail.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ডেলিভারি চার্জ:</span>
                <span>৳{viewingOrderDetail.deliveryCharge || 0}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>সর্বমোট (Grand Total):</span>
                <span className="text-amber-400">
                  ৳{(viewingOrderDetail.grandTotal || viewingOrderDetail.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {viewingOrderDetail.orderStatus !== 'delivered' && viewingOrderDetail.orderStatus !== 'returned' && (
                <>
                  <button
                    onClick={() => handleOpenActionModal(viewingOrderDetail, 'delivered')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ডেলিভারি সম্পন্ন
                  </button>
                  <button
                    onClick={() => handleOpenActionModal(viewingOrderDetail, 'returned')}
                    className="py-2.5 px-4 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    রিটার্ন
                  </button>
                </>
              )}
              <button
                onClick={() => setViewingOrderDetail(null)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS UPDATE ACTION MODAL */}
      {selectedOrderForAction && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {actionType === 'delivered' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ডেলিভারি সম্পন্ন নিশ্চিতকরণ (Delivered)
                  </>
                ) : actionType === 'shipped' ? (
                  <>
                    <Truck className="w-5 h-5 text-cyan-400" />
                    অন দ্য ওয়ে (Out for Delivery)
                  </>
                ) : actionType === 'confirmed' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    অর্ডার কনফার্মেশন (Confirmed)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    অর্ডার রিটার্ন নথিভুক্তকরণ
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setSelectedOrderForAction(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                <span className="text-slate-400">অর্ডার: </span>
                <span className="font-mono font-bold text-amber-400">
                  #{selectedOrderForAction.orderNumber || selectedOrderForAction.id.slice(-6).toUpperCase()}
                </span>
                <div className="mt-1 text-slate-300 font-semibold">
                  গ্রাহক: {selectedOrderForAction.customerName || selectedOrderForAction.customerInfo?.fullName}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  মোট বিল: ৳{(selectedOrderForAction.grandTotal || selectedOrderForAction.total || 0).toLocaleString('en-BD')}
                </div>
              </div>

              {actionType === 'delivered' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    সংগৃহীত ক্যাশ টাকা (টাকা না নিলে ০ লিখুন)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={collectedCashInput}
                      onChange={(e) => setCollectedCashInput(e.target.value)}
                      placeholder="টাকার পরিমাণ লিখুন"
                      className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {actionType === 'returned' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    রিটার্নের কারণ নির্বাচন করুন
                  </label>
                  <select
                    value={selectedReturnReason}
                    onChange={(e) => setSelectedReturnReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="গ্রাহক ফোন রিসিভ করেননি">গ্রাহক ফোন রিসিভ করেননি</option>
                    <option value="ভুল ঠিকানা অথবা এলাকা খুঁজে পাওয়া যায়নি">ভুল ঠিকানা অথবা এলাকা খুঁজে পাওয়া যায়নি</option>
                    <option value="গ্রাহক পণ্য নিতে অস্বীকৃতি জানিয়েছেন">গ্রাহক পণ্য নিতে অস্বীকৃতি জানিয়েছেন</option>
                    <option value="গ্রাহক অর্ডার বাতিল করতে চেয়েছেন">গ্রাহক অর্ডার বাতিল করতে চেয়েছেন</option>
                    <option value="প্যাকেজ বা পণ্যে কোনো সমস্যা দেখা গেছে">প্যাকেজ বা পণ্যে কোনো সমস্যা দেখা গেছে</option>
                    <option value="পরবর্তীতে ডেলিভারি নেওয়ার অনুরোধ">পরবর্তীতে ডেলিভারি নেওয়ার অনুরোধ</option>
                    <option value="অন্যান্য কারণ">অন্যান্য কারণ</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {actionType === 'returned'
                    ? 'অতিরিক্ত বিবরণ / নোট (ঐচ্ছিক)'
                    : 'রাইডার নোট (ঐচ্ছিক)'}
                </label>
                <textarea
                  rows={2}
                  value={actionNoteInput}
                  onChange={(e) => setActionNoteInput(e.target.value)}
                  placeholder={
                    actionType === 'returned'
                      ? 'রিটার্ন সম্পর্কে বিস্তারিত কিছু লিখুন (ঐচ্ছিক)'
                      : 'অর্ডার বা ডেলিভারি সম্পর্কিত কোনো বিশেষ নোট'
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForAction(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatusUpdate}
                className={`flex-1 py-2.5 px-4 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                  actionType === 'delivered'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : actionType === 'shipped'
                    ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25'
                    : actionType === 'confirmed'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    নিশ্চিত করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPortalPage;
