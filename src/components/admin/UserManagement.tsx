import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Ban,
  CheckCircle,
  Clock,
  ShoppingBag,
  MapPin,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  X,
  Save,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Shield,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { UserProfile, Order, Role } from '../../types';
import toast from 'react-hot-toast';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'staff'>('all');

  // Modals state
  const [selectedUserHistory, setSelectedUserHistory] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);

  // Form edit state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('customer');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // 1. Subscribe to Firestore Users Real-time
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(collection(db, 'users'));
    
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const fetchedUsers: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          fetchedUsers.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });

        setUsers(fetchedUsers);
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore users subscription fallback:', error);
        setUsers([]);
        setLoading(false);
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // 2. Subscribe to Orders to match User Order History and calculate Total Spent
  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(fetchedOrders);
      },
      (error) => {
        console.warn('Orders subscription error in UserManagement:', error);
      }
    );

    return () => unsubscribeOrders();
  }, []);

  // Calculate order metrics per user
  const userOrderMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; totalSpent: number; userOrders: Order[] }> = {};

    orders.forEach((ord) => {
      // match by userId or phone or email
      const matchedUser = users.find(
        (u) =>
          (u.uid && ord.userId === u.uid) ||
          (u.phoneNumber && ord.customerPhone === u.phoneNumber) ||
          (u.phone && ord.phone === u.phone) ||
          (u.email && ord.customerEmail && u.email.toLowerCase() === ord.customerEmail.toLowerCase())
      );

      const targetUid = matchedUser ? matchedUser.uid : ord.userId || ord.customerPhone || 'unknown';

      if (!metrics[targetUid]) {
        metrics[targetUid] = { count: 0, totalSpent: 0, userOrders: [] };
      }

      metrics[targetUid].count += 1;
      metrics[targetUid].userOrders.push(ord);
      if (ord.orderStatus !== 'cancelled') {
        metrics[targetUid].totalSpent += Number(ord.grandTotal || ord.total || 0);
      }
    });

    return metrics;
  }, [orders, users]);

  // Combined stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => !u.isSuspended && u.status !== 'suspended').length;
    const suspendedUsers = users.filter((u) => u.isSuspended || u.status === 'suspended').length;
    const staffCount = users.filter((u) => u.role && u.role !== 'customer').length;

    let totalCustomerRevenue = 0;
    Object.values(userOrderMetrics).forEach((m) => {
      totalCustomerRevenue += m.totalSpent;
    });

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      staffCount,
      totalCustomerRevenue
    };
  }, [users, userOrderMetrics]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.displayName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(search) || email.includes(search) || phone.includes(search) || u.uid.includes(search);

      const isSuspended = u.isSuspended || u.status === 'suspended';

      if (statusFilter === 'active') {
        return matchesSearch && !isSuspended;
      }
      if (statusFilter === 'suspended') {
        return matchesSearch && isSuspended;
      }
      if (statusFilter === 'staff') {
        return matchesSearch && u.role && u.role !== 'customer';
      }

      return matchesSearch;
    });
  }, [users, searchTerm, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.displayName || user.name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phoneNumber || user.phone || '');
    setEditRole(user.role || 'customer');
    setEditNotes(user.notes || '');
  };

  // Save Edit User
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);

    const updatedData: Partial<UserProfile> = {
      displayName: editName,
      name: editName,
      email: editEmail,
      phoneNumber: editPhone,
      phone: editPhone,
      role: editRole,
      notes: editNotes,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingUser.uid.startsWith('usr_sample_')) {
        // Sample user local state update
        setUsers((prev) =>
          prev.map((u) => (u.uid === editingUser.uid ? { ...u, ...updatedData } : u))
        );
        toast.success('ইউজার প্রোফাইল আপডেট করা হয়েছে!');
      } else {
        const userRef = doc(db, 'users', editingUser.uid);
        await updateDoc(userRef, updatedData);
        toast.success('ফায়ারস্টোর ইউজার তথ্য আপডেট হয়েছে!');
      }
      setEditingUser(null);
    } catch (err: any) {
      toast.error('ইউজার আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle Suspend / Unsuspend
  const handleToggleSuspend = async (user: UserProfile) => {
    const isCurrentlySuspended = user.isSuspended || user.status === 'suspended';
    const nextSuspendedState = !isCurrentlySuspended;

    try {
      if (user.uid.startsWith('usr_sample_')) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid
              ? {
                  ...u,
                  isSuspended: nextSuspendedState,
                  status: nextSuspendedState ? 'suspended' : 'active',
                }
              : u
          )
        );
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          isSuspended: nextSuspendedState,
          status: nextSuspendedState ? 'suspended' : 'active',
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success(
        nextSuspendedState
          ? `ইউজার (${user.displayName || user.email}) কে সাসপেন্ড করা হয়েছে!`
          : `ইউজার (${user.displayName || user.email}) কে আন-সাসপেন্ড (সক্রিয়) করা হয়েছে!`
      );
      setSuspendingUser(null);
    } catch (err: any) {
      toast.error('সাসপেন্ড স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserProfile) => {
    try {
      if (user.uid.startsWith('usr_sample_')) {
        setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      } else {
        await deleteDoc(doc(db, 'users', user.uid));
      }

      toast.success('ইউজার অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে!');
      setDeletingUser(null);
    } catch (err: any) {
      toast.error('ইউজার মুছতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Get orders for selected history user
  const userHistoryOrders = useMemo(() => {
    if (!selectedUserHistory) return [];

    const uid = selectedUserHistory.uid;
    const phone = selectedUserHistory.phoneNumber || selectedUserHistory.phone;
    const email = selectedUserHistory.email;

    return orders.filter(
      (o) =>
        (o.userId && o.userId === uid) ||
        (phone && o.customerPhone === phone) ||
        (phone && o.phone === phone) ||
        (email && o.customerEmail && email.toLowerCase() === o.customerEmail.toLowerCase())
    );
  }, [selectedUserHistory, orders]);

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ইউজার ম্যানেজমেন্ট ও কাস্টমার হিস্ট্রি</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                গ্রাহকদের প্রোফাইল, অর্ডার হিস্ট্রি পর্যবেক্ষণ, তথ্য সংশোধন, সাসপেন্ড ও ডিলিট কন্ট্রোল
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            রিয়েল-টাইম সিঙ্ক সক্রিয়
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">মোট রেজিস্টার্ড ইউজার</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalUsers}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">প্ল্যাটফর্মের সর্বমোট গ্রাহক</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">সক্রিয় ইউজার</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">সক্রিয় ও কেনাকাটায় অনুমোদিত</p>
          </div>
        </div>

        {/* Suspended Users */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">সাসপেন্ডেড ইউজার</span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.suspendedUsers}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">অর্ডার প্রদান সাময়িক বন্ধ</p>
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">কাস্টমার কেনাকাটা (মোট)</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              ৳{stats.totalCustomerRevenue.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">গ্রাহকদের মোট সম্পন্ন কেনাকাটা</p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-md'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            সকল ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            সক্রিয় ({stats.activeUsers})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'suspended'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            সাসপেন্ডেড ({stats.suspendedUsers})
          </button>
          <button
            onClick={() => setStatusFilter('staff')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'staff'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            স্টাফ/এডমিন ({stats.staffCount})
          </button>
        </div>
      </div>

      {/* User List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
            <p className="text-sm font-medium">ইউজার লিস্ট লোড হচ্ছে...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">কোনো ইউজার পাওয়া যায়নি</h4>
            <p className="text-xs mt-1">সার্চ বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="p-4">গ্রাহকের নাম ও ছবি</th>
                  <th className="p-4">যোগাযোগ</th>
                  <th className="p-4">রোল ও অবস্থা</th>
                  <th className="p-4 text-center">মোট অর্ডার</th>
                  <th className="p-4 text-right">মোট খরচ</th>
                  <th className="p-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filteredUsers.map((user) => {
                  const name = user.displayName || user.name || 'সম্মানিত গ্রাহক';
                  const email = user.email || 'ইমেইল নেই';
                  const phone = user.phoneNumber || user.phone || 'ফোন নম্বর নেই';
                  const isSuspended = user.isSuspended || user.status === 'suspended';
                  const metrics = userOrderMetrics[user.uid] || { count: 0, totalSpent: 0 };

                  return (
                    <tr
                      key={user.uid}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSuspended ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-300 dark:border-slate-700">
                              {name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {name}
                              {user.role === 'admin' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-xs block truncate max-w-[180px]">
                              UID: {user.uid.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[160px]">{email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div>
                            {isSuspended ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  {user.banReason?.includes('অ্যাডমিন') ? '🚨 অটো ব্যানড (অ্যাডমিন অনুপ্রবেশের চেষ্টা)' : 'সাসপেন্ডেড'}
                                </span>
                                {user.banReason && (
                                  <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold max-w-[200px] truncate" title={user.banReason}>
                                    {user.banReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                সক্রিয়
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 capitalize">
                            রোল: {user.role || 'customer'}
                          </div>
                        </div>
                      </td>

                      {/* Total Orders */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs">
                          <ShoppingBag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {metrics.count} টি
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="p-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ৳{metrics.totalSpent.toLocaleString()}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Order History */}
                          <button
                            onClick={() => setSelectedUserHistory(user)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            title="ইউজার হিস্ট্রি ও অর্ডারসমূহ দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit User Info */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                            title="ইউজার এডিট করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => setSuspendingUser(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100'
                            }`}
                            title={isSuspended ? 'আন-সাসপেন্ড করুন' : 'সাসপেন্ড করুন'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                            title="ইউজার ডিলিট করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------- USER HISTORY MODAL ----------------- */}
      {selectedUserHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {(selectedUserHistory.displayName || selectedUserHistory.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUserHistory.displayName || selectedUserHistory.name || 'সম্মানিত গ্রাহক'}
                    {selectedUserHistory.isSuspended && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                        সাসপেন্ডেড
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUserHistory.email || 'ইমেইল নেই'} • {selectedUserHistory.phoneNumber || selectedUserHistory.phone || 'ফোন নেই'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserHistory(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Details Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">অ্যাকাউন্ট তৈরির তারিখ</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUserHistory.createdAt
                      ? new Date(selectedUserHistory.createdAt).toLocaleDateString('bn-BD')
                      : 'অজানা'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">মোট অর্ডার</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                    {userHistoryOrders.length} টি সফল বা প্যান্ডিং অর্ডার
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">মোট খরচ</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    ৳
                    {userHistoryOrders
                      .filter((o) => o.orderStatus !== 'cancelled')
                      .reduce((acc, curr) => acc + (curr.grandTotal || curr.total || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>

              {/* User Address */}
              {selectedUserHistory.addresses && selectedUserHistory.addresses.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" /> কাস্টমারের ঠিকানা
                  </h4>
                  <div className="space-y-2">
                    {selectedUserHistory.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="font-semibold">{addr.district}:</span> {addr.address || addr.streetAddress}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" /> কাস্টমারের অর্ডারের ইতিহাস (History)
                </h4>

                {userHistoryOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-500">এই কাস্টমার এখনও কোনো অর্ডার করেননি।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userHistoryOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              অর্ডার #{ord.orderNumber || ord.id.slice(0, 8)}
                            </span>
                            <span className="text-slate-400">
                              • {new Date(ord.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                ord.orderStatus === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              }`}
                            >
                              {ord.orderStatus}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ৳{(ord.grandTotal || ord.total || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {ord.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-xs">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px]">
                                  ছবি নেই
                                </div>
                              )}
                              <div className="flex-1">
                                <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                  {item.name}
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                  পরিমাণ: {item.quantity} টি × ৳{item.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSelectedUserHistory(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- EDIT USER MODAL ----------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" /> ইউজার প্রোফাইল এডিট
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  পুরো নাম (Display Name)
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">ইমেইল এড্রেস</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">ইউজার রোল</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="customer">কাস্টমার (Customer)</option>
                  <option value="staff">স্টাফ (Staff)</option>
                  <option value="moderator">মডারেটর (Moderator)</option>
                  <option value="admin">এডমিন (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">এডমিন নোট</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ইউজার সম্পর্কিত অতিরিক্ত তথ্য..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUSPEND CONFIRMATION MODAL ----------------- */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {suspendingUser.isSuspended || suspendingUser.status === 'suspended'
                  ? 'ইউজার কে আন-সাসপেন্ড করতে চান?'
                  : 'ইউজার কে সাসপেন্ড করতে চান?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                গ্রাহক: <span className="font-bold">{suspendingUser.displayName || suspendingUser.email}</span>
                <br />
                {suspendingUser.isSuspended || suspendingUser.status === 'suspended'
                  ? 'আন-সাসপেন্ড করলে ইউজার পুনরায় অর্ডার করতে পারবেন।'
                  : 'সাসপেন্ড করলে এই ইউজার অ্যাকাউন্টে লগইন বা নতুন অর্ডার করতে পারবে না।'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSuspendingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl"
              >
                ফিরে যান
              </button>
              <button
                onClick={() => handleToggleSuspend(suspendingUser)}
                className={`px-5 py-2 text-white font-medium text-xs rounded-xl shadow-md ${
                  suspendingUser.isSuspended || suspendingUser.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {suspendingUser.isSuspended || suspendingUser.status === 'suspended'
                  ? 'হ্যাঁ, আন-সাসপেন্ড করুন'
                  : 'হ্যাঁ, সাসপেন্ড করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- DELETE CONFIRMATION MODAL ----------------- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ইউজার মুছে ফেলার নিশ্চিতকরণ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                আপনি কি নিশ্চিত যে <span className="font-bold text-rose-600">{deletingUser.displayName || deletingUser.email}</span> এর অ্যাকাউন্টটি স্থায়ীভাবে ডিলিট করতে চান?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-xl"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleDeleteUser(deletingUser)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-md"
              >
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
