/**
 * BD SHOPS — Notification Center & Web/Android Push Notifications Service
 * Real-time Firestore notifications, In-App Bell Dropdown, Toast Alerts & Browser/Android Push Permissions
 */

import { doc, collection, onSnapshot, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

/**
 * Delete a single notification
 */
export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting notification:', err);
    throw err;
  }
}

/**
 * Delete all notifications for current user
 */
export async function deleteAllNotificationsFromFirestore(notifications: AppNotification[]): Promise<void> {
  try {
    if (notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      const docRef = doc(db, 'notifications', n.id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    throw err;
  }
}
import { db } from './firebase/config';
import toast from 'react-hot-toast';

export interface AppNotification {
  id: string;
  userId?: string; // Target specific user, or 'all' for public notifications
  title: string;
  message: string;
  type: 'order' | 'product' | 'cart' | 'promo' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Request Browser & Android Notification Permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this environment');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('নোটিফিকেশন পারমিশন এনাবল করা হয়েছে!');
    } else if (permission === 'denied') {
      toast.error('নোটিফিকেশন পারমিশন ডিসেবল করা আছে। ব্রাউজার সেটিং থেকে এলাউ করুন।');
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Display Web/Android System Push Notification + Toast
 */
export function triggerPushAndToastNotification(title: string, body: string, iconUrl?: string, linkUrl?: string) {
  // 1. Show In-App Toast
  toast(
    (t) => (
      <div
        onClick={() => {
          toast.dismiss(t.id);
          if (linkUrl) window.location.href = linkUrl;
        }}
        className="cursor-pointer flex flex-col gap-1"
      >
        <span className="font-bold text-teal-400 text-xs">{title}</span>
        <span className="text-xs text-slate-200">{body}</span>
      </div>
    ),
    {
      duration: 5000,
      icon: '🔔',
      style: {
        background: '#0F172A',
        color: '#FFF',
        borderRadius: '16px',
        border: '1px solid #1E293B',
      },
    }
  );

  // 2. Trigger Web/Android Native Notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon: iconUrl || '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'bd-shops-notification',
      });

      n.onclick = () => {
        window.focus();
        if (linkUrl) window.location.href = linkUrl;
        n.close();
      };
    } catch (err) {
      console.warn('Native notification error:', err);
    }
  }
}

/**
 * Create a new notification in Firestore (e.g., when new product added or order placed)
 */
export async function createNotificationInFirestore(
  notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>
): Promise<string | null> {
  try {
    const colRef = collection(db, 'notifications');
    const docRef = await addDoc(colRef, {
      ...notification,
      userId: notification.userId || 'all',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Also trigger immediate local push/toast
    triggerPushAndToastNotification(notification.title, notification.message, undefined, notification.link);

    return docRef.id;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { isRead: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
  try {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      const docRef = doc(db, 'notifications', n.id);
      batch.update(docRef, { isRead: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all as read:', err);
  }
}
