import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { Order, OrderStatus, StaffAccount } from '../types';
import { sanitizeForFirestore } from '../services/settings';
import toast from 'react-hot-toast';

export interface UseDeliveryOrdersOptions {
  deliveryUserId?: string;
  role?: string;
  statusFilter?: 'all' | 'assigned' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
  paymentFilter?: 'all' | 'cod' | 'paid';
  searchQuery?: string;
}

export interface DeliveryOrdersStats {
  total: number;
  assigned: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  returned: number;
  cancelled: number;
  codCount: number;
  paidCount: number;
  totalCashCollected: number;
  totalOrderValue: number;
}

export function useDeliveryOrders(options: UseDeliveryOrdersOptions = {}) {
  const {
    deliveryUserId,
    role = 'delivery_man',
    statusFilter = 'all',
    paymentFilter = 'all',
    searchQuery = '',
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Set up real-time listener for Firestore orders
  useEffect(() => {
    setLoading(true);
    setError(null);

    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching real-time delivery orders:', err);
        setError('অর্ডার তালিকা লোড করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter orders relevant to this delivery personnel (or all if admin/manager)
  const scopedOrders = useMemo(() => {
    if (!deliveryUserId) return orders;

    // If super admin or general admin, show all orders
    if (role === 'admin' || role === 'super_admin' || role === 'order_manager') {
      return orders;
    }

    // For delivery riders: show orders assigned to them OR unassigned orders ready for pickup
    return orders.filter((order) => {
      const isAssignedToMe = order.assignedDeliveryManId === deliveryUserId;
      const isUnassigned = !order.assignedDeliveryManId || order.assignedDeliveryManId === '';
      const isActionable =
        order.orderStatus === 'confirmed' ||
        order.orderStatus === 'processing' ||
        order.orderStatus === 'shipped';

      return isAssignedToMe || (isUnassigned && isActionable);
    });
  }, [orders, deliveryUserId, role]);

  // Compute live statistics for categories & tabs
  const stats: DeliveryOrdersStats = useMemo(() => {
    let assigned = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let returned = 0;
    let cancelled = 0;
    let codCount = 0;
    let paidCount = 0;
    let totalCashCollected = 0;
    let totalOrderValue = 0;

    scopedOrders.forEach((order) => {
      const status = order.orderStatus;
      const isAssigned = order.assignedDeliveryManId === deliveryUserId;

      if (isAssigned) assigned++;
      if (status === 'confirmed') confirmed++;
      else if (status === 'shipped') shipped++;
      else if (status === 'delivered') {
        delivered++;
        if (isAssigned) {
          totalCashCollected +=
            order.cashCollectedAmount ||
            order.paidAmount ||
            order.grandTotal ||
            order.total ||
            0;
        }
      } else if (status === 'returned') returned++;
      else if (status === 'cancelled') cancelled++;

      const isCod = order.paymentMethod === 'cash_on_delivery' || (order.paymentMethod as string) === 'cod';
      if (isCod) codCount++;
      else if (order.paymentStatus === 'paid' || !isCod) paidCount++;

      totalOrderValue += order.grandTotal || order.total || 0;
    });

    return {
      total: scopedOrders.length,
      assigned,
      confirmed,
      shipped,
      delivered,
      returned,
      cancelled,
      codCount,
      paidCount,
      totalCashCollected,
      totalOrderValue,
    };
  }, [scopedOrders, deliveryUserId]);

  // Filtered orders based on selected status, payment, and search text
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'assigned') {
          if (order.assignedDeliveryManId !== deliveryUserId) return false;
        } else if (order.orderStatus !== statusFilter) {
          return false;
        }
      }

      const isCod = order.paymentMethod === 'cash_on_delivery' || (order.paymentMethod as string) === 'cod';

      // 2. Payment Filter
      if (paymentFilter === 'cod' && !isCod) return false;
      if (paymentFilter === 'paid') {
        const isPaid = order.paymentStatus === 'paid' || (!isCod && order.paymentStatus !== 'pending');
        if (!isPaid) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (order.id || '').toLowerCase().includes(q) || (order.orderNumber || '').toLowerCase().includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.customerPhone || '').toLowerCase().includes(q);
        
        const addrStr = typeof order.deliveryAddress === 'string'
          ? order.deliveryAddress
          : typeof order.address === 'string'
          ? order.address
          : typeof order.shippingAddress === 'string'
          ? order.shippingAddress
          : '';
        const matchesAddress = addrStr.toLowerCase().includes(q);
        
        const matchesItems = order.items?.some((item) =>
          ((item as any).title || (item as any).productName || item.name || '').toLowerCase().includes(q)
        );

        if (!matchesId && !matchesName && !matchesPhone && !matchesAddress && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [scopedOrders, statusFilter, paymentFilter, searchQuery, deliveryUserId]);

  // Direct status update handler with backend commit
  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: OrderStatus,
      deliveryMan: StaffAccount,
      details?: {
        cashCollected?: number;
        returnReason?: string;
        note?: string;
      }
    ): Promise<boolean> => {
      setIsUpdating(true);
      const toastId = toast.loading('অর্ডার স্ট্যাটাস আপডেট ও সেভ হচ্ছে...');

      try {
        const docRef = doc(db, 'orders', orderId);
        const now = new Date().toISOString();
        const orderSnap = await getDoc(docRef);

        if (!orderSnap.exists()) {
          throw new Error('অর্ডার ডাটাবেসে পাওয়া যায়নি');
        }

        const existingOrder = orderSnap.data() as Order;
        const updatePayload: Record<string, any> = {
          orderStatus: newStatus,
          updatedAt: now,
        };

        if (newStatus === 'delivered') {
          updatePayload.deliveryCompletedAt = now;
          updatePayload.paymentStatus = 'paid';
          const collected =
            details?.cashCollected !== undefined
              ? details.cashCollected
              : existingOrder.grandTotal || existingOrder.total || 0;
          updatePayload.cashCollectedAmount = collected;
          updatePayload.paidAmount = collected;
        } else if (newStatus === 'returned') {
          updatePayload.returnReason = details?.returnReason || 'গ্রাহক পণ্য গ্রহণ করেননি';
          updatePayload.returnNote = details?.note || '';
          updatePayload.returnedAt = now;
        }

        if (details?.note) {
          updatePayload.deliveryNotes = details.note;
        }

        // Timeline log
        const timeline = existingOrder.timeline || [];
        timeline.push({
          status: newStatus,
          title:
            newStatus === 'delivered'
              ? 'ডেলিভারি সফল ও ক্যাশ কালেকশন সম্পন্ন'
              : newStatus === 'shipped'
              ? 'অন দ্য ওয়ে (Out for Delivery)'
              : newStatus === 'confirmed'
              ? 'অর্ডার নিশ্চিত (Confirmed)'
              : newStatus === 'returned'
              ? 'অর্ডার রিটার্ন নথিভুক্ত'
              : 'স্ট্যাটাস আপডেট',
          description: `ডেলিভারি কর্মী ${deliveryMan.fullName || deliveryMan.username} কর্তৃক আপডেট সম্পন্ন।`,
          timestamp: now,
          completed: true,
        });
        updatePayload.timeline = timeline;

        await updateDoc(docRef, sanitizeForFirestore(updatePayload));

        toast.success(
          newStatus === 'delivered'
            ? 'ডেলিভারি ও ক্যাশ কালেকশন সফলভাবে সম্পন্ন হয়েছে!'
            : newStatus === 'shipped'
            ? 'অর্ডার অন দ্য ওয়ে (Out for Delivery) আপডেট হয়েছে!'
            : 'অর্ডার স্ট্যাটাস আপডেট সফল হয়েছে!',
          { id: toastId }
        );

        return true;
      } catch (err: any) {
        console.error('Error in updateOrderStatus hook:', err);
        toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return {
    orders: filteredOrders,
    rawOrders: scopedOrders,
    allOrders: orders,
    stats,
    loading,
    error,
    isUpdating,
    updateOrderStatus,
  };
}
