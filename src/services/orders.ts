/**
 * BD SHOPS — Orders Service & Real-Time Firestore Persistence
 * Instant order confirmation, real-time live tracking, status progression & order history
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase/config';
import { Order, OrderStatus } from '../types';

/**
 * Utility to strip any `undefined` fields recursively before Firestore writes
 */
function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: any = {};
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        result[key] = sanitizeFirestoreData(val);
      }
    }
    return result;
  }
  return data;
}

/**
 * Returns Bengali status details & badge styling
 */
export function getBengaliOrderStatus(status: OrderStatus | string): {
  text: string;
  bg: string;
  textClass: string;
} {
  switch (status) {
    case 'pending':
      return { text: 'অপেক্ষমাণ', bg: 'bg-amber-50', textClass: 'text-amber-700 border-amber-200' };
    case 'confirmed':
      return { text: 'নিশ্চিত করা হয়েছে', bg: 'bg-blue-50', textClass: 'text-blue-700 border-blue-200' };
    case 'processing':
      return { text: 'প্যাকেজিং হচ্ছে', bg: 'bg-indigo-50', textClass: 'text-indigo-700 border-indigo-200' };
    case 'shipped':
      return { text: 'কুরিয়ারে আছে', bg: 'bg-teal-50', textClass: 'text-[#00796B] border-teal-200' };
    case 'delivered':
      return { text: 'ডেলিভারি সম্পন্ন', bg: 'bg-emerald-50', textClass: 'text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { text: 'বাতিল', bg: 'bg-rose-50', textClass: 'text-rose-700 border-rose-200' };
    default:
      return { text: status || 'অপেক্ষমাণ', bg: 'bg-slate-50', textClass: 'text-slate-700 border-slate-200' };
  }
}

/**
 * Generates an easily readable Bangladesh tracking number
 * Format: BDS-YYYY-XXXX (e.g., BDS-2026-A8F2)
 */
export function generateOrderTrackingNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BDS-${year}-${randomSuffix}`;
}

/**
 * Calculates Estimated Delivery Date range based on creation time and delivery zone
 */
export function calculateEstimatedDelivery(
  createdAtString: string,
  deliveryZone?: string,
  district?: string
): { displayText: string; minDays: number; maxDays: number; targetDate: Date } {
  const createdDate = new Date(createdAtString);
  const baseDate = isNaN(createdDate.getTime()) ? new Date() : createdDate;

  // Determine standard BD delivery duration
  const isInsideDhaka =
    deliveryZone === 'insideDhaka' || (district && district.trim() === 'ঢাকা');

  const minDays = isInsideDhaka ? 1 : 2;
  const maxDays = isInsideDhaka ? 2 : 4;

  const minDate = new Date(baseDate);
  minDate.setDate(minDate.getDate() + minDays);

  const maxDate = new Date(baseDate);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const formatBDDate = (d: Date) => {
    const months = [
      'জানুয়ারি',
      'ফেব্রুয়ারি',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টেম্বর',
      'অক্টোবর',
      'নভেম্বর',
      'ডিসেম্বর',
    ];
    return `${d.getDate().toLocaleString('bn-BD')} ${months[d.getMonth()]}`;
  };

  const displayText =
    minDays === maxDays
      ? formatBDDate(minDate)
      : `${formatBDDate(minDate)} – ${formatBDDate(maxDate)}`;

  return {
    displayText,
    minDays,
    maxDays,
    targetDate: maxDate,
  };
}

/**
 * Creates a brand new order in Firestore with local storage synchronization
 */
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>
): Promise<Order> {
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderNumber = generateOrderTrackingNumber();
  const now = new Date().toISOString();

  const initialTimeline = [
    {
      status: 'pending' as OrderStatus,
      title: 'অর্ডার গ্রহণ করা হয়েছে',
      description: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। কাস্টমার কেয়ার থেকে কনফার্মেশন কল করা হবে।',
      timestamp: now,
      completed: true,
    },
    {
      status: 'confirmed' as OrderStatus,
      title: 'অর্ডার নিশ্চিত করা হয়েছে',
      description: 'অর্ডারের বিবরণ যাচাই করে প্যাকেজিংয়ের জন্য পাঠানো হয়েছে।',
      timestamp: '',
      completed: false,
    },
    {
      status: 'processing' as OrderStatus,
      title: 'প্যাকেজিং সম্পন্ন',
      description: 'পণ্যটি মানসম্মত প্যাকিং করে কুরিয়ারে হস্তান্তরের জন্য প্রস্তুত।',
      timestamp: '',
      completed: false,
    },
    {
      status: 'shipped' as OrderStatus,
      title: 'কুরিয়ারে হস্তান্তর করা হয়েছে',
      description: 'পার্সেলটি স্টিডফাস্ট / রেডেক্স কুরিয়ারে হস্তান্তর করা হয়েছে।',
      timestamp: '',
      completed: false,
    },
    {
      status: 'delivered' as OrderStatus,
      title: 'ডেলিভারি সম্পন্ন',
      description: 'গ্রাহকের নিকট পার্সেলটি সফলভাবে হস্তান্তর ও মূল্য পরিশোধ সম্পন্ন হয়েছে।',
      timestamp: '',
      completed: false,
    },
  ];

  const fullName =
    orderPayload.customerInfo?.fullName || (orderPayload as any).customerName || 'সম্মানিত গ্রাহক';
  const phone = orderPayload.customerInfo?.phone || (orderPayload as any).customerPhone || '';
  const email = orderPayload.customerInfo?.email || (orderPayload as any).customerEmail || '';
  const calculatedGrandTotal = orderPayload.grandTotal ?? orderPayload.total ?? 0;
  const deliveryAddress =
    orderPayload.address ||
    orderPayload.shippingAddress?.streetAddress ||
    orderPayload.deliveryAddress?.streetAddress ||
    (orderPayload as any).customerAddress ||
    '';
  const district =
    orderPayload.district ||
    orderPayload.shippingAddress?.district ||
    orderPayload.deliveryAddress?.district ||
    '';
  const isPaid = orderPayload.paymentStatus === 'paid';

  const newOrder: Order = {
    ...orderPayload,
    id: orderId,
    orderNumber,
    customerName: fullName,
    customerPhone: phone,
    customerEmail: email,
    customerInfo: {
      fullName,
      phone,
      email,
    },
    address: deliveryAddress,
    district: district,
    grandTotal: calculatedGrandTotal,
    total: calculatedGrandTotal,
    paymentStatus: isPaid ? 'paid' : (orderPayload.paymentStatus || 'unpaid'),
    deliveryStatus: 'unassigned',
    createdAt: now,
    updatedAt: now,
    orderStatus: 'pending',
    timeline: initialTimeline,
  };

  const payloadToFirestore = sanitizeFirestoreData({
    ...newOrder,
    serverCreatedAt: serverTimestamp(),
  });

  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await setDoc(orderDocRef, payloadToFirestore);

    // Persist order payload to localStorage for instant offline retrieval
    try {
      const existing = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
      const filtered = existing.filter(
        (item: any) => (typeof item === 'string' ? item !== orderId : item.id !== orderId)
      );
      filtered.unshift(newOrder);
      localStorage.setItem('bdshops_my_orders', JSON.stringify(filtered.slice(0, 30)));
    } catch {
      // Ignore
    }

    return newOrder as Order;
  } catch (error) {
    console.warn('Firestore write warning, saving order to local cache:', error);

    // Save to local storage as fallback
    try {
      const existing = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
      existing.unshift(newOrder);
      localStorage.setItem('bdshops_my_orders', JSON.stringify(existing.slice(0, 30)));
    } catch {
      // Ignore
    }

    return newOrder as Order;
  }
}

export const createOrderInFirestore = createOrder;

/**
 * Updates order with online payment information and proof screenshot
 */
export async function updateOrderPaymentProof(
  orderId: string,
  paymentData: {
    transactionId: string;
    paymentChannel: 'bkash' | 'nagad' | 'rocket' | 'upay';
    senderNumber?: string;
    paymentProofUrl?: string;
    paidAmount?: number;
    notes?: string;
  }
): Promise<boolean> {
  const now = new Date().toISOString();
  const updatePayload = sanitizeFirestoreData({
    transactionId: paymentData.transactionId.trim(),
    paymentChannel: paymentData.paymentChannel,
    senderNumber: paymentData.senderNumber?.trim() || '',
    paymentProofUrl: paymentData.paymentProofUrl || '',
    paidAmount: paymentData.paidAmount,
    paymentStatus: 'pending',
    notes: paymentData.notes ? paymentData.notes.trim() : `Online payment via ${paymentData.paymentChannel} (TrxID: ${paymentData.transactionId})`,
    updatedAt: now,
  });

  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, updatePayload);

    // Update local cache
    try {
      const existing = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
      const updated = existing.map((o: any) => {
        if (typeof o === 'object' && o.id === orderId) {
          return { ...o, ...updatePayload };
        }
        return o;
      });
      localStorage.setItem('bdshops_my_orders', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    return true;
  } catch (err) {
    console.warn('Could not update order payment proof online, updating local cache:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
      const updated = existing.map((o: any) => {
        if (typeof o === 'object' && o.id === orderId) {
          return { ...o, ...updatePayload };
        }
        return o;
      });
      localStorage.setItem('bdshops_my_orders', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Fetches all orders belonging to a specific user
 */
export async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const results = snap.docs.map((d) => d.data() as Order);
      try {
        localStorage.setItem('bdshops_my_orders', JSON.stringify(results.slice(0, 30)));
      } catch {
        // Ignore
      }
      return results;
    }

    // Fallback: check local storage cached orders
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    return local.filter((o: any) => typeof o === 'object' && o.userId === userId);
  } catch (error) {
    console.warn('Could not fetch orders from Firestore online, returning local cache:', error);
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    return local.filter((o: any) => typeof o === 'object' && (o.userId === userId || !o.userId));
  }
}

/**
 * Fetches order by order ID
 */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Order;
    }

    // Try query by orderNumber
    const q = query(collection(db, 'orders'), where('orderNumber', '==', orderId.toUpperCase()));
    const snapQ = await getDocs(q);
    if (!snapQ.empty) {
      return snapQ.docs[0].data() as Order;
    }

    // Check local storage
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    const match = local.find(
      (o: any) =>
        (typeof o === 'object' && (o.id === orderId || o.orderNumber?.toUpperCase() === orderId.toUpperCase())) ||
        o === orderId
    );
    return match && typeof match === 'object' ? match : null;
  } catch (error) {
    console.warn('Could not fetch order by ID from Firestore, using local cache:', error);
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    const match = local.find(
      (o: any) =>
        (typeof o === 'object' && (o.id === orderId || o.orderNumber?.toUpperCase() === orderId.toUpperCase())) ||
        o === orderId
    );
    return match && typeof match === 'object' ? match : null;
  }
}

/**
 * Real-time listener for all orders belonging to a specific user
 */
export function subscribeToUserOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map((d) => d.data() as Order);
      // Sync with local cache for persistence
      try {
        localStorage.setItem('bdshops_my_orders', JSON.stringify(results.slice(0, 30)));
      } catch {
        // Ignore
      }
      onUpdate(results);
    },
    (err) => {
      console.warn('User orders real-time subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Tracks order by either Tracking Number (e.g. BDS-2026-XXXX) or Phone Number
 */
export async function trackOrderByNumberOrPhone(searchTerm: string): Promise<Order[]> {
  const term = searchTerm.trim().toUpperCase();
  const cleanPhone = searchTerm.trim().replace(/\D/g, '');

  try {
    // 1. Search by exact orderNumber / trackingNumber in Firestore
    const qNumber = query(collection(db, 'orders'), where('orderNumber', '==', term));
    const snapNumber = await getDocs(qNumber);
    if (!snapNumber.empty) {
      return snapNumber.docs.map((d) => d.data() as Order);
    }

    // 2. Search by phone number in customerPhone field
    if (cleanPhone.length >= 10) {
      const qPhone = query(collection(db, 'orders'), where('customerPhone', '==', cleanPhone));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        return snapPhone.docs.map((d) => d.data() as Order);
      }
    }

    // 3. Fallback to local cache search
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    const localMatches = local.filter((o: any) => {
      if (typeof o !== 'object' || !o) return false;
      const idMatch = o.id?.toLowerCase() === term.toLowerCase();
      const orderNumMatch = o.orderNumber?.toUpperCase() === term;
      const phoneMatch =
        cleanPhone.length >= 10 &&
        (o.customerPhone?.replace(/\D/g, '').includes(cleanPhone) ||
          o.customerInfo?.phone?.replace(/\D/g, '').includes(cleanPhone));
      return idMatch || orderNumMatch || phoneMatch;
    });

    return localMatches;
  } catch (error) {
    console.warn('Tracking query error in Firestore, searching local cache:', error);

    // Offline fallback to local storage
    const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
    return local.filter((o: any) => {
      if (typeof o !== 'object' || !o) return false;
      const idMatch = o.id?.toLowerCase() === term.toLowerCase();
      const orderNumMatch = o.orderNumber?.toUpperCase() === term;
      const phoneMatch =
        cleanPhone.length >= 10 &&
        (o.customerPhone?.replace(/\D/g, '').includes(cleanPhone) ||
          o.customerInfo?.phone?.replace(/\D/g, '').includes(cleanPhone));
      return idMatch || orderNumMatch || phoneMatch;
    });
  }
}

/**
 * Real-time listener for an order by Order ID or Tracking Number.
 * Invokes onUpdate callback whenever admin modifies order status, timeline or details in Firestore.
 */
export function subscribeToOrder(
  orderIdOrTracking: string,
  onUpdate: (order: Order | null) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const isDirectId = orderIdOrTracking.startsWith('ord_');

  if (isDirectId) {
    const docRef = doc(db, 'orders', orderIdOrTracking);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as Order);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('Real-time order subscription warning (offline or timeout):', error);
        if (onError) onError(error);
      }
    );
  }

  // Otherwise query by orderNumber tracking code
  const q = query(
    collection(db, 'orders'),
    where('orderNumber', '==', orderIdOrTracking.toUpperCase())
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        onUpdate(snapshot.docs[0].data() as Order);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Real-time tracking subscription warning (offline or timeout):', error);
      if (onError) onError(error);
    }
  );
}

export const subscribeToOrderRealtime = subscribeToOrder;

/**
 * Updates order status and timeline in Firestore (e.g. Confirmed, Out for Delivery, Delivered)
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus | string,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();
  
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await getDoc(docRef);
    
    let currentTimeline: any[] = [];
    if (snap.exists()) {
      const data = snap.data();
      currentTimeline = data.timeline || [];
    }

    // Map new status to timeline stages
    const updatedTimeline = currentTimeline.map((step) => {
      if (step.status === newStatus || (newStatus === 'shipped' && step.status === 'shipped') || (newStatus === 'confirmed' && step.status === 'confirmed') || (newStatus === 'delivered' && step.status === 'delivered')) {
        return {
          ...step,
          completed: true,
          timestamp: step.timestamp || now,
        };
      }
      return step;
    });

    const updatePayload: Record<string, any> = {
      orderStatus: newStatus,
      status: newStatus,
      updatedAt: now,
      timeline: updatedTimeline,
    };

    if (newStatus === 'shipped') {
      updatePayload.deliveryStatus = 'out_for_delivery';
    } else if (newStatus === 'delivered') {
      updatePayload.deliveryStatus = 'delivered';
      updatePayload.isPaid = true;
      updatePayload.paymentStatus = 'paid';
    } else if (newStatus === 'confirmed') {
      updatePayload.deliveryStatus = 'assigned';
    }

    if (note) {
      updatePayload.deliveryNote = note;
    }

    await updateDoc(docRef, sanitizeFirestoreData(updatePayload));

    // Sync local cache
    try {
      const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
      const updatedLocal = local.map((o: any) => {
        if (typeof o === 'object' && o.id === orderId) {
          return { ...o, ...updatePayload };
        }
        return o;
      });
      localStorage.setItem('bdshops_my_orders', JSON.stringify(updatedLocal));
    } catch {
      // Ignore
    }
  } catch (err) {
    console.error('Error updating order status in Firestore:', err);
    throw err;
  }
}
