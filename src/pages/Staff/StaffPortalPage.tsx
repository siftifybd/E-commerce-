/**
 * BD SHOPS — Staff & Moderator Operations Portal (মডারেটর ও স্টাফ পোর্টাল)
 * Accessible via `/portal/staff` or `/staff`
 * 
 * Features:
 * 1. Dedicated custom login system using username & password generated from Admin panel
 * 2. Role-Based Access Control (RBAC): Moderator, Order Manager, Support Staff
 * 3. Dynamic permissions check for Orders, Products, Accounting, and Customer Support
 * 4. Real-time Firestore sync for incoming customer orders and inventory management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Package,
  Boxes,
  Truck,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  User,
  Lock,
  Phone,
  Printer,
  Copy,
  ExternalLink,
  Edit,
  Save,
  Eye,
  ChevronDown,
  RefreshCw,
  Check,
  X,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSettings } from '../../context/SettingsContext';
import {
  verifyStaffLogin,
  saveStaffAccount,
  hasStaffPermission,
  ROLE_DEFINITIONS,
  ALL_PERMISSIONS,
} from '../../services/staff';
import { sanitizeForFirestore } from '../../services/settings';
import { Order, OrderStatus, Product, StaffAccount } from '../../types';

export const StaffPortalPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings: storeSettings } = useSettings();

  // Authentication State
  const [staffUser, setStaffUser] = useState<StaffAccount | null>(() => {
    const saved = sessionStorage.getItem('bdshops_staff_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const queryParams = new URLSearchParams(location.search);
  const userParam = queryParams.get('user') || '';

  const [usernameInput, setUsernameInput] = useState(userParam || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active View Tab: 'orders' | 'products' | 'profile'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'profile'>('orders');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  // Password / Profile edit state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      toast.error('ইউজারনেম ও পাসওয়ার্ড লিখুন');
      return;
    }

    setIsLoggingIn(true);
    const toastId = toast.loading('লগইন ভেরিফাই হচ্ছে...');

    try {
      const user = await verifyStaffLogin(usernameInput.trim(), passwordInput.trim());
      if (user) {
        if (user.role === 'delivery_man') {
          sessionStorage.setItem('bdshops_delivery_auth', JSON.stringify(user));
          toast.success('ডেলিভারি পোর্টালে রিডাইরেক্ট করা হচ্ছে...', { id: toastId });
          navigate('/portal/delivery');
          return;
        }

        setStaffUser(user);
        sessionStorage.setItem('bdshops_staff_auth', JSON.stringify(user));
        toast.success(`স্বাগতম, ${user.fullName || user.username}!`, { id: toastId });
      } else {
        toast.error('ভুল ইউজারনেম বা পাসওয়ার্ড অথবা অ্যাকাউন্ট নিষ্ক্রিয়', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('লগইন প্রক্রিয়ায় সমস্যা হয়েছে', { id: toastId });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('bdshops_staff_auth');
    setStaffUser(null);
    setPasswordInput('');
    toast.success('লগআউট সম্পন্ন হয়েছে');
  };

  // Real-time Orders Listener
  useEffect(() => {
    if (!staffUser) return;
    setLoadingOrders(true);

    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        setOrders(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('Staff orders subscription error:', err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [staffUser]);

  // Real-time Products Listener
  useEffect(() => {
    if (!staffUser) return;
    setLoadingProducts(true);

    const prodCol = collection(db, 'products');
    const q = query(prodCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        setProducts(list);
        setLoadingProducts(false);
      },
      (err) => {
        console.warn('Staff products subscription error:', err);
        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, [staffUser]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = (order.id || '').toLowerCase();
        const num = (order.orderNumber || '').toLowerCase();
        const name = (order.customerName || '').toLowerCase();
        const phone = (order.customerPhone || '').toLowerCase();
        const matchesItems = order.items?.some((item) =>
          ((item as any).title || (item as any).productName || item.name || '').toLowerCase().includes(q)
        );
        return id.includes(q) || num.includes(q) || name.includes(q) || phone.includes(q) || matchesItems;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Quick Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!staffUser || !hasStaffPermission(staffUser, 'orders_status')) {
      toast.error('আপনার এই স্ট্যাটাস পরিবর্তনের অনুমতি নেই');
      return;
    }

    const toastId = toast.loading('অর্ডার স্ট্যাটাস আপডেট হচ্ছে...');
    try {
      const docRef = doc(db, 'orders', orderId);
      const now = new Date().toISOString();

      await updateDoc(
        docRef,
        sanitizeForFirestore({
          orderStatus: newStatus,
          updatedAt: now,
        })
      );
      toast.success('অর্ডার স্ট্যাটাস সফলভাবে আপডেট হয়েছে!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    }
  };

  // Quick Stock Update by Staff
  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!staffUser || !hasStaffPermission(staffUser, 'products_edit')) {
      toast.error('আপনার স্টক পরিবর্তনের অনুমতি নেই');
      return;
    }

    try {
      const docRef = doc(db, 'products', productId);
      await updateDoc(
        docRef,
        sanitizeForFirestore({
          stock: Math.max(0, newStock),
          inStock: newStock > 0,
          updatedAt: new Date().toISOString(),
        })
      );
      toast.success('স্টক আপডেট সম্পন্ন হয়েছে!');
    } catch (err: any) {
      console.error(err);
      toast.error('স্টক আপডেট ব্যর্থ হয়েছে: ' + (err.message || 'Error'));
    }
  };

  // Handle Profile Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড কনফার্মেশন মিলছে না');
      return;
    }

    setIsSavingProfile(true);
    const toastId = toast.loading('পাসওয়ার্ড সেভ হচ্ছে...');

    try {
      await saveStaffAccount({
        id: staffUser.id,
        password: newPassword,
      });
      const updated = { ...staffUser, password: newPassword };
      setStaffUser(updated);
      sessionStorage.setItem('bdshops_staff_auth', JSON.stringify(updated));
      setNewPassword('');
      setConfirmPassword('');
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', { id: toastId });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const roleDef = staffUser ? ROLE_DEFINITIONS[staffUser.role] || ROLE_DEFINITIONS.staff : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      <Helmet>
        <title>স্টাফ ও মডারেটর পোর্টাল | BD SHOPS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* If not logged in, show login screen */}
      {!staffUser ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">স্টাফ ও মডারেটর পোর্টাল</h2>
              <p className="text-xs text-slate-400">
                আপনার নির্ধারিত ইউজারনেম ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">ইউজারনেম</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. moderator_rakib"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">পাসওয়ার্ড</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    লগইন করুন
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-block"
              >
                ← মূল ওয়েবসাইটে ফিরে যান
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Top Bar Header */}
          <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700 sticky top-0 z-30 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-white">{staffUser.fullName || staffUser.username}</h1>
                    {roleDef && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleDef.badgeColor}`}>
                        {roleDef.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">স্টাফ ও অপারেশন ড্যাশবোর্ড</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-rose-600 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  লগআউট
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto flex items-center gap-2 mt-3 overflow-x-auto">
              {hasStaffPermission(staffUser, 'orders_view') && (
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  অর্ডার ম্যানেজমেন্ট ({orders.length})
                </button>
              )}

              {hasStaffPermission(staffUser, 'products_view') && (
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  প্রোডাক্ট ও স্টক ({products.length})
                </button>
              )}

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                আমার প্রোফাইল ও নিরাপত্তা
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 pt-6">
            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Search & Status Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="অর্ডার আইডি, ফোন বা নাম দিয়ে খুঁজুন..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    {[
                      { id: 'all', label: 'সকল অর্ডার' },
                      { id: 'pending', label: 'পেন্ডিং' },
                      { id: 'confirmed', label: 'কনফার্মড' },
                      { id: 'processing', label: 'প্রসেসিং' },
                      { id: 'shipped', label: 'অন দ্য ওয়ে' },
                      { id: 'delivered', label: 'ডেলিভার্ড' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          statusFilter === st.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                    অর্ডার তালিকা লোড হচ্ছে...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center text-slate-400">
                    কোনো অর্ডার পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => {
                      const totalAmt = order.grandTotal || order.total || 0;
                      return (
                        <div
                          key={order.id}
                          className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 hover:border-purple-500/60 transition-all shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                              <div>
                                <span className="text-[10px] font-mono text-purple-400 block font-bold">
                                  #{order.orderNumber || order.id.slice(0, 8)}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {order.customerName || 'গ্রাহকের নাম নেই'}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  order.orderStatus === 'delivered'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : order.orderStatus === 'shipped'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : order.orderStatus === 'confirmed'
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {order.orderStatus}
                              </span>
                            </div>

                            <div className="text-xs text-slate-300 space-y-1 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">মোবাইল:</span>
                                <a
                                  href={`tel:${order.customerPhone || order.phone}`}
                                  className="text-cyan-400 font-bold hover:underline"
                                >
                                  {order.customerPhone || order.phone || 'N/A'}
                                </a>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">মোট মূল্য:</span>
                                <span className="font-bold text-emerald-400">
                                  ৳{totalAmt.toLocaleString('en-BD')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">পণ্য সংখ্যা:</span>
                                <span>{order.items?.length || 0} টি</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {hasStaffPermission(staffUser, 'orders_status') && (
                            <div className="pt-2 border-t border-slate-700 flex items-center gap-1.5">
                              {order.orderStatus === 'pending' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  কনফার্ম করুন
                                </button>
                              )}
                              {order.orderStatus === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  অন দ্য ওয়ে
                                </button>
                              )}
                              {order.orderStatus === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  ডেলিভার্ড মার্ক
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PRODUCTS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="প্রোডাক্ট নাম দিয়ে খুঁজুন..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products
                    .filter((p) =>
                      productSearch
                        ? (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
                        : true
                    )
                    .map((product) => (
                      <div
                        key={product.id}
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <img
                            src={product.images?.[0] || 'https://placehold.co/100'}
                            alt={product.name}
                            className="w-full h-36 object-cover rounded-xl bg-slate-900"
                          />
                          <h3 className="text-xs font-bold text-white line-clamp-2">{product.name}</h3>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-400">৳{product.price}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                product.stock > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              স্টক: {product.stock}
                            </span>
                          </div>
                        </div>

                        {hasStaffPermission(staffUser, 'products_edit') && (
                          <div className="pt-2 border-t border-slate-700 flex items-center gap-2">
                            <input
                              type="number"
                              defaultValue={product.stock}
                              min={0}
                              onBlur={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white"
                            />
                            <span className="text-[11px] text-slate-400">স্টক পরিবর্তন</span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-3xl p-6 space-y-6">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 bg-purple-600/30 border border-purple-500 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
                    <User className="w-7 h-7" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{staffUser.fullName || staffUser.username}</h2>
                  <p className="text-xs text-purple-400 font-bold">
                    {ROLE_DEFINITIONS[staffUser.role]?.name || staffUser.role}
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ইউজারনেম:</span>
                    <span className="font-mono text-white">{staffUser.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মোবাইল:</span>
                    <span className="text-white">{staffUser.phone || 'যুক্ত নেই'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">অ্যাক্টিভ পারমিশন:</span>
                    <span className="text-emerald-400 font-bold">{staffUser.permissions?.length || 0} টি</span>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-slate-700">
                  <h3 className="text-xs font-bold text-slate-300">পাসওয়ার্ড পরিবর্তন করুন</h3>
                  <div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isSavingProfile ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড সেভ করুন'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
