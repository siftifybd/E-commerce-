/**
 * BD SHOPS — Staff & Delivery Management Service
 * Supports dynamic domain-aware portal links, multi-role RBAC permissions,
 * real-time order dispatch, delivery updates, and financial accounting (হিসাব খাতা).
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { StaffAccount, Role, Order, DeliveryAccounting, OrderStatus } from '../types';
import { sanitizeForFirestore } from './settings';

const STAFF_COLLECTION = 'staff_accounts';

export interface RoleDefinition {
  id: Role;
  name: string;
  badgeColor: string;
  description: string;
  defaultPermissions: string[];
  portalRoute: string;
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'সুপার অ্যাডমিন (Super Admin)',
    badgeColor: 'bg-rose-500 text-white',
    description: 'পুরো সিস্টেমের পূর্ণ নিয়ন্ত্রণ (সেটিংস, অ্যাডমিন ম্যানেজমেন্ট, ডাটাবেস ও সকল ফিচার)',
    defaultPermissions: [
      'orders_view', 'orders_edit', 'orders_status', 'orders_delete',
      'products_view', 'products_create', 'products_edit', 'products_delete',
      'categories_manage', 'staff_manage', 'settings_manage', 'delivery_portal', 'accounting_view'
    ],
    portalRoute: '/admin',
  },
  admin: {
    id: 'admin',
    name: 'অ্যাডমিন (Admin)',
    badgeColor: 'bg-orange-500 text-white',
    description: 'দৈনন্দিন স্টোর পরিচালনা, প্রোডাক্ট, ক্যাটাগরি, অর্ডার ও স্টাফ ম্যানেজমেন্ট',
    defaultPermissions: [
      'orders_view', 'orders_edit', 'orders_status',
      'products_view', 'products_create', 'products_edit', 'products_delete',
      'categories_manage', 'staff_manage', 'accounting_view'
    ],
    portalRoute: '/admin',
  },
  moderator: {
    id: 'moderator',
    name: 'মডারেটর (Moderator)',
    badgeColor: 'bg-purple-600 text-white',
    description: 'প্রোডাক্ট আপলোড, এডিট, ক্যাটাগরি ও রিভিউ পর্যবেক্ষণ এবং কাস্টমার সাপোর্ট',
    defaultPermissions: [
      'products_view', 'products_create', 'products_edit',
      'categories_manage', 'orders_view'
    ],
    portalRoute: '/portal/staff',
  },
  order_manager: {
    id: 'order_manager',
    name: 'অর্ডার ম্যানেজার (Order Manager)',
    badgeColor: 'bg-blue-600 text-white',
    description: 'কাস্টমার অর্ডার কনফার্মেশন, প্যাকেজিং, ইনভয়েস প্রিন্ট এবং ডেলিভারি রাইডার নির্ধারণ',
    defaultPermissions: [
      'orders_view', 'orders_edit', 'orders_status', 'accounting_view'
    ],
    portalRoute: '/portal/staff',
  },
  delivery_man: {
    id: 'delivery_man',
    name: 'ডেলিভারি ম্যান (Delivery Rider)',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'ডেডিকেটেড মোবাইল পোর্টাল, ক্যাশ অন ডেলিভারি কালেকশন ও রুট ট্র্যাকিং',
    defaultPermissions: [
      'delivery_portal', 'orders_view', 'orders_status'
    ],
    portalRoute: '/portal/delivery',
  },
  staff: {
    id: 'staff',
    name: 'জেনারেল স্টাফ (General Staff)',
    badgeColor: 'bg-slate-600 text-white',
    description: 'সাধারণ অ্যাসিস্ট্যান্স ও অর্ডার ভিউ অ্যাক্সেস',
    defaultPermissions: ['orders_view'],
    portalRoute: '/portal/staff',
  },
  customer: {
    id: 'customer',
    name: 'কাস্টমার (Customer)',
    badgeColor: 'bg-slate-400 text-white',
    description: 'সাধারণ ইউজার অ্যাকাউন্ট',
    defaultPermissions: [],
    portalRoute: '/',
  },
};

export interface PermissionDefinition {
  id: string;
  name: string;
  category: 'অর্ডার' | 'প্রোডাক্ট' | 'স্টাফ' | 'সেটিংস' | 'ডেলিভারি';
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { id: 'orders_view', name: 'অর্ডার তালিকা দেখা', category: 'অর্ডার' },
  { id: 'orders_edit', name: 'অর্ডার পরিবর্তন ও এডিট', category: 'অর্ডার' },
  { id: 'orders_status', name: 'অর্ডার স্ট্যাটাস আপডেট', category: 'অর্ডার' },
  { id: 'orders_delete', name: 'অর্ডার ডিলিট করা', category: 'অর্ডার' },
  { id: 'products_view', name: 'প্রোডাক্ট তালিকা দেখা', category: 'প্রোডাক্ট' },
  { id: 'products_create', name: 'নতুন প্রোডাক্ট যোগ করা', category: 'প্রোডাক্ট' },
  { id: 'products_edit', name: 'প্রোডাক্ট ও স্টক এডিট করা', category: 'প্রোডাক্ট' },
  { id: 'products_delete', name: 'প্রোডাক্ট ডিলিট করা', category: 'প্রোডাক্ট' },
  { id: 'categories_manage', name: 'ক্যাটাগরি তৈরি ও এডিট', category: 'প্রোডাক্ট' },
  { id: 'staff_manage', name: 'অ্যাডমিন/মডারেটর/স্টাফ ম্যানেজমেন্ট', category: 'স্টাফ' },
  { id: 'settings_manage', name: 'স্টোর ও সাইট সেটিংস পরিবর্তন', category: 'সেটিংস' },
  { id: 'delivery_portal', name: 'ডেলিভারি রাইডার পোর্টাল অ্যাক্সেস', category: 'ডেলিভারি' },
  { id: 'accounting_view', name: 'হিসাব খাতা ও ক্যাশ কালেকশন ভিউ', category: 'অর্ডার' },
];

/**
 * Check if a staff account has a specific permission
 */
export function hasStaffPermission(staff: StaffAccount | null | undefined, permissionId: string): boolean {
  if (!staff) return false;
  if (staff.role === 'super_admin') return true;
  if (!staff.permissions || !Array.isArray(staff.permissions)) return false;
  return staff.permissions.includes(permissionId);
}

/**
 * Generate dynamic portal link according to role and domain
 */
export function generateStaffPortalUrl(username: string, role: Role, customOrigin?: string): string {
  let origin = customOrigin;
  if (!origin) {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      origin = window.location.origin;
    } else {
      origin = '';
    }
  }
  origin = origin.replace(/\/+$/, '');
  const encodedUser = encodeURIComponent((username || '').trim());

  if (role === 'delivery_man') {
    return `${origin}/portal/delivery?user=${encodedUser}`;
  } else if (role === 'moderator' || role === 'order_manager' || role === 'staff') {
    return `${origin}/portal/staff?user=${encodedUser}`;
  }
  return `${origin}/admin?user=${encodedUser}`;
}

/**
 * Fetch all staff accounts
 */
export async function fetchStaffAccounts(): Promise<StaffAccount[]> {
  try {
    const staffRef = collection(db, STAFF_COLLECTION);
    const snap = await getDocs(staffRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffAccount));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, STAFF_COLLECTION);
    return [];
  }
}

/**
 * Subscribe to staff accounts for real-time admin view
 */
export function subscribeToStaff(onUpdate: (staff: StaffAccount[]) => void): Unsubscribe {
  const staffRef = collection(db, STAFF_COLLECTION);
  return onSnapshot(
    staffRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StaffAccount));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, STAFF_COLLECTION);
    }
  );
}

/**
 * Create or Update a Staff / Admin / Moderator Account
 */
export async function saveStaffAccount(staff: Partial<StaffAccount>): Promise<void> {
  const staffId = staff.id || `staff_${Date.now()}`;
  const docRef = doc(db, STAFF_COLLECTION, staffId);
  const now = new Date().toISOString();

  const role: Role = staff.role || 'staff';
  const username = (staff.username || '').trim();
  const portalUrl = generateStaffPortalUrl(username, role);
  const roleDef = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.staff;

  const defaultPerms = roleDef.defaultPermissions;
  const permissions = staff.permissions && staff.permissions.length > 0 ? staff.permissions : defaultPerms;

  const staffData: StaffAccount = {
    id: staffId,
    username: username,
    password: staff.password || '123456',
    fullName: staff.fullName || username,
    email: staff.email || '',
    phone: staff.phone || '',
    role: role,
    isActive: staff.isActive !== undefined ? staff.isActive : true,
    permissions: permissions,
    loginUrl: portalUrl,
    portalUrl: portalUrl,
    portalType: (role === 'delivery_man' ? 'delivery' : role === 'moderator' ? 'moderator' : role === 'order_manager' ? 'order_manager' : 'admin') as any,
    assignedOrdersCount: staff.assignedOrdersCount || 0,
    completedDeliveriesCount: staff.completedDeliveriesCount || 0,
    totalCashCollected: staff.totalCashCollected || 0,
    cashInHand: staff.cashInHand || 0,
    createdAt: staff.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, sanitizeForFirestore(staffData), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${STAFF_COLLECTION}/${staffId}`);
    throw err;
  }
}

/**
 * Delete a Staff Account
 */
export async function deleteStaffAccount(staffId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STAFF_COLLECTION, staffId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${STAFF_COLLECTION}/${staffId}`);
    throw err;
  }
}

/**
 * Toggle Staff active/inactive status
 */
export async function toggleStaffStatus(staffId: string, isActive: boolean): Promise<void> {
  try {
    const docRef = doc(db, STAFF_COLLECTION, staffId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${STAFF_COLLECTION}/${staffId}`);
    throw err;
  }
}

/**
 * Verify staff login (Credentials check against Firestore)
 */
export async function verifyStaffLogin(usernameOrEmail: string, password: string): Promise<StaffAccount | null> {
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // 1. Direct Master Admin Bypass / Auto-grant
  const isMasterUser = cleanInput === 'mdaponww2025@gmail.com' || cleanInput === 'admin' || cleanInput === 'mdapon';
  const isMasterPass = cleanPass === 'admin123' || cleanPass === '7860';

  if (isMasterUser && isMasterPass) {
    const masterAdmin: StaffAccount = {
      id: 'admin_master_owner',
      username: cleanInput === 'mdaponww2025@gmail.com' ? 'mdapon' : cleanInput,
      password: cleanPass,
      fullName: 'Master Admin (mdaponww2025@gmail.com)',
      email: 'mdaponww2025@gmail.com',
      phone: '01700000000',
      role: 'super_admin',
      isActive: true,
      permissions: ALL_PERMISSIONS.map((p) => p.id),
      loginUrl: '/admin',
      portalUrl: '/admin',
      portalType: 'admin',
      assignedOrdersCount: 0,
      completedDeliveriesCount: 0,
      totalCashCollected: 0,
      cashInHand: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-seed to Firestore if possible in background
    try {
      setDoc(doc(db, STAFF_COLLECTION, 'admin_master_owner'), sanitizeForFirestore(masterAdmin), { merge: true });
    } catch {
      // Ignore
    }

    return masterAdmin;
  }

  try {
    const staffRef = collection(db, STAFF_COLLECTION);
    const snap = await getDocs(staffRef);

    if (!snap.empty) {
      const match = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as StaffAccount))
        .find(
          (s) =>
            s.isActive &&
            (s.username.toLowerCase() === cleanInput || (s.email && s.email.toLowerCase() === cleanInput)) &&
            s.password === cleanPass
        );

      if (match) {
        return match;
      }
    }
    return null;
  } catch (err) {
    console.error('Login verification error:', err);
    return null;
  }
}

/**
 * Calculate Delivery Accounting (হিসাব খাতা)
 */
export function calculateDeliveryManAccounting(
  deliveryManIdOrOrders: string | Order[],
  ordersOrDeliveryManId?: Order[] | string,
  deliveryCommissionRate: number = 50,
  period: string = 'all'
): DeliveryAccounting {
  let deliveryManId: string | undefined;
  let orders: Order[] = [];

  if (typeof deliveryManIdOrOrders === 'string') {
    deliveryManId = deliveryManIdOrOrders;
    orders = Array.isArray(ordersOrDeliveryManId) ? ordersOrDeliveryManId : [];
  } else if (Array.isArray(deliveryManIdOrOrders)) {
    orders = deliveryManIdOrOrders;
    deliveryManId = typeof ordersOrDeliveryManId === 'string' ? ordersOrDeliveryManId : undefined;
  }

  const filtered = deliveryManId
    ? orders.filter((o) => o.assignedDeliveryManId === deliveryManId)
    : orders;

  const todayStr = new Date().toISOString().split('T')[0];

  let completedOrders = 0;
  let pendingOrders = 0;
  let returnedOrders = 0;
  let totalCashToCollect = 0;
  let totalCashCollected = 0;
  let todayCashCollected = 0;
  let todayCompletedCount = 0;

  filtered.forEach((order) => {
    const isCod = order.paymentMethod === 'cash_on_delivery' || (order.paymentMethod as string) === 'cod';
    const amount = order.grandTotal || order.total || 0;
    const isToday = (order.updatedAt || order.createdAt || '').startsWith(todayStr);

    if (order.orderStatus === 'delivered') {
      completedOrders++;
      const collected = order.cashCollectedAmount !== undefined ? order.cashCollectedAmount : (isCod ? amount : 0);
      totalCashCollected += collected;

      if (isToday) {
        todayCompletedCount++;
        todayCashCollected += collected;
      }
    } else if (order.orderStatus === 'returned' || order.orderStatus === 'cancelled') {
      returnedOrders++;
    } else {
      pendingOrders++;
      if (isCod) {
        totalCashToCollect += amount;
      }
    }
  });

  const deliveryFeeEarned = completedOrders * deliveryCommissionRate;
  const cashInHandToAdmin = Math.max(0, totalCashCollected - deliveryFeeEarned);

  return {
    totalAssignedOrders: filtered.length,
    completedOrders,
    pendingOrders,
    returnedOrders,
    totalCashToCollect,
    totalCashCollected,
    deliveryFeeEarned,
    cashInHandToAdmin,
    todayCashCollected,
    todayCompletedCount,
    period,
  };
}

/**
 * Assign Delivery Man alias for backward compatibility
 */
export const assignDeliveryManToOrder = assignOrderToDeliveryMan;

/**
 * Record a financial cash settlement for a staff/rider
 */
export async function recordStaffSettlement(
  staffId: string,
  settledAmount: number,
  notes?: string
): Promise<void> {
  const staffDocRef = doc(db, STAFF_COLLECTION, staffId);
  const now = new Date().toISOString();

  const snap = await getDoc(staffDocRef);
  if (snap.exists()) {
    const data = snap.data() as StaffAccount;
    const currentCollected = data.totalCashCollected || 0;
    const newTotal = Math.max(0, currentCollected - settledAmount);

    await updateDoc(
      staffDocRef,
      sanitizeForFirestore({
        totalCashCollected: newTotal,
        lastSettlementDate: now,
        lastSettlementAmount: settledAmount,
        lastSettlementNote: notes || '',
        updatedAt: now,
      })
    );
  }
}

export async function assignOrderToDeliveryMan(
  orderId: string,
  deliveryStaff: StaffAccount,
  notes?: string
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const now = new Date().toISOString();

  const updatePayload: Record<string, any> = {
    assignedDeliveryManId: deliveryStaff.id,
    assignedDeliveryManName: deliveryStaff.fullName || deliveryStaff.username,
    assignedDeliveryManPhone: deliveryStaff.phone || '',
    updatedAt: now,
  };

  if (notes) {
    updatePayload.deliveryNotes = notes;
  }

  // Add timeline entry
  const orderSnap = await getDoc(docRef);
  if (orderSnap.exists()) {
    const data = orderSnap.data() as Order;
    const existingTimeline = data.timeline || [];
    updatePayload.timeline = [
      ...existingTimeline,
      {
        status: data.orderStatus || 'processing',
        title: `ডেলিভারি ম্যান নির্ধারণ: ${deliveryStaff.fullName}`,
        description: `অর্ডারটি ডেলিভারি কর্মী ${deliveryStaff.fullName} (${deliveryStaff.phone || 'মোবাইল যুক্ত নেই'}) এর কাছে হস্তান্তর করা হয়েছে।`,
        timestamp: now,
        completed: true,
      },
    ];
  }

  await updateDoc(docRef, sanitizeForFirestore(updatePayload));
}

/**
 * Update Delivery Status directly from the Delivery Man Portal
 */
export async function updateDeliveryStatusByDeliveryMan(
  orderId: string,
  newStatus: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled',
  deliveryMan: StaffAccount,
  options?: {
    cashCollected?: number;
    returnReason?: string;
    note?: string;
  }
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const now = new Date().toISOString();

  const orderSnap = await getDoc(docRef);
  if (!orderSnap.exists()) {
    throw new Error('অর্ডার পাওয়া যায়নি');
  }

  const order = orderSnap.data() as Order;
  const updatePayload: Record<string, any> = {
    orderStatus: newStatus as OrderStatus,
    updatedAt: now,
  };

  let title = '';
  let description = '';

  if (newStatus === 'confirmed') {
    title = 'অর্ডার নিশ্চিত করা হয়েছে (Confirmed)';
    description = `ডেলিভারি কর্মী ${deliveryMan.fullName} কাস্টমারের সাথে যোগাযোগ করে অর্ডারটি কনফার্ম করেছেন।`;
  } else if (newStatus === 'shipped') {
    title = 'ডেলিভারি শুরু হয়েছে (Out for Delivery)';
    description = `ডেলিভারি কর্মী ${deliveryMan.fullName} পণ্যটি নিয়ে কাস্টমারের ঠিকানার উদ্দেশ্যে রওনা দিয়েছেন।`;
  } else if (newStatus === 'delivered') {
    title = 'পণ্য সফলভাবে ডেলিভারি সম্পন্ন';
    description = `ডেলিভারি কর্মী ${deliveryMan.fullName} পণ্যটি হস্তান্তর করেছেন এবং ক্যাশ কালেকশন সম্পন্ন হয়েছে।`;
    updatePayload.deliveryCompletedAt = now;
    updatePayload.paymentStatus = 'paid';
    const collected =
      options?.cashCollected !== undefined
        ? options.cashCollected
        : (order.grandTotal || order.total || 0);
    updatePayload.cashCollectedAmount = collected;
    updatePayload.paidAmount = collected;
  } else if (newStatus === 'returned') {
    title = 'পণ্য ডেলিভারি ব্যর্থ / রিটার্ন';
    description = `পণ্যটি রিটার্ন করা হয়েছে। কারণ: ${options?.returnReason || 'গ্রাহক পণ্য গ্রহণ করেননি'}`;
    updatePayload.returnedAt = now;
    updatePayload.returnReason = options?.returnReason || 'গ্রাহক পণ্য গ্রহণ করেননি';
    updatePayload.returnNote = options?.note || '';
  } else if (newStatus === 'cancelled') {
    title = 'অর্ডার বাতিল করা হয়েছে';
    description = `ডেলিভারি কর্মী কর্তৃক অর্ডার বাতিল করা হয়েছে। নোট: ${options?.note || 'বাতিল'}`;
  }

  if (options?.note) {
    updatePayload.deliveryNotes = options.note;
  }

  // Update order timeline
  const existingTimeline = order.timeline || [];
  updatePayload.timeline = [
    ...existingTimeline,
    {
      status: newStatus,
      title,
      description,
      timestamp: now,
      completed: true,
    },
  ];

  await updateDoc(docRef, sanitizeForFirestore(updatePayload));

  // If delivered, update delivery man's stats in Firestore
  if (newStatus === 'delivered') {
    try {
      const staffDocRef = doc(db, STAFF_COLLECTION, deliveryMan.id);
      const staffSnap = await getDoc(staffDocRef);
      if (staffSnap.exists()) {
        const staffData = staffSnap.data() as StaffAccount;
        const currentCompleted = staffData.completedDeliveriesCount || 0;
        const currentCash = staffData.totalCashCollected || 0;
        const addCash =
          options?.cashCollected !== undefined
            ? options.cashCollected
            : (order.grandTotal || order.total || 0);

        await updateDoc(
          staffDocRef,
          sanitizeForFirestore({
            completedDeliveriesCount: currentCompleted + 1,
            totalCashCollected: currentCash + addCash,
            updatedAt: now,
          })
        );
      }
    } catch (e) {
      console.warn('Failed to update rider personal stat count', e);
    }
  }
}
