/**
 * BD SHOPS / BLACK ZONE — Admin & Staff Auth Guard Service
 * 
 * Strict Multi-Tier Role Separation:
 * 1. User Storefront (/login, /register, Google Auth):
 *    - Strictly for normal customers only.
 *    - Admin and Delivery emails are BLOCKED with a full-screen alert.
 * 
 * 2. Admin Portal (/admin):
 *    - Strictly for designated Admins only.
 *    - If a non-admin / customer enters their email, that user is immediately
 *      and automatically SUSPENDED & BANNED in Firebase, visible in the Admin dashboard.
 * 
 * 3. Delivery Portal (/delivery):
 *    - Strictly for delivery riders and order handlers.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase/config';

// Designated Master Admin Emails
export const MASTER_ADMIN_EMAILS = [
  'mdaponww27@gmail.com',
  'mdaponww2025@gmail.com',
  'admin@domain.com',
  'admin@blackzone.com.bd',
];

/**
 * Checks if an email is a designated hardcoded admin email
 */
export function isDesignatedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return MASTER_ADMIN_EMAILS.includes(clean);
}

/**
 * Verifies whether an email or UID has Admin or Super Admin role in Firebase
 */
export async function verifyIsAdmin(emailOrUid: string): Promise<boolean> {
  if (!emailOrUid) return false;
  const clean = emailOrUid.toLowerCase().trim();

  // 1. Immediate match for master admin emails
  if (isDesignatedAdminEmail(clean)) {
    return true;
  }

  try {
    // 2. Check in /admins collection by document ID (UID)
    const adminDocRef = doc(db, 'admins', clean);
    const adminSnap = await getDoc(adminDocRef);
    if (adminSnap.exists()) {
      return true;
    }

    // 3. Query /admins collection by email
    const adminsQuery = query(collection(db, 'admins'), where('email', '==', clean));
    const adminsSnap = await getDocs(adminsQuery);
    if (!adminsSnap.empty) {
      return true;
    }

    // 4. Check in /staff_accounts collection for role 'admin' or 'super_admin'
    const staffQuery = query(collection(db, 'staff_accounts'), where('isActive', '==', true));
    const staffSnap = await getDocs(staffQuery);
    const foundStaff = staffSnap.docs.find((d) => {
      const data = d.data();
      const staffEmail = (data.email || '').toLowerCase().trim();
      const staffUser = (data.username || '').toLowerCase().trim();
      return (staffEmail === clean || staffUser === clean) && (data.role === 'admin' || data.role === 'super_admin');
    });

    if (foundStaff) {
      return true;
    }
  } catch (err) {
    console.warn('Error checking admin status in Firestore:', err);
  }

  return false;
}

/**
 * Checks whether an email or username belongs to a delivery rider
 */
export async function verifyIsDeliveryRider(emailOrUsername: string): Promise<boolean> {
  if (!emailOrUsername) return false;
  const clean = emailOrUsername.toLowerCase().trim();

  try {
    const staffQuery = query(collection(db, 'staff_accounts'), where('isActive', '==', true));
    const staffSnap = await getDocs(staffQuery);
    const foundStaff = staffSnap.docs.find((d) => {
      const data = d.data();
      const staffEmail = (data.email || '').toLowerCase().trim();
      const staffUser = (data.username || '').toLowerCase().trim();
      return (staffEmail === clean || staffUser === clean) && data.role === 'delivery_man';
    });

    return !!foundStaff;
  } catch (err) {
    console.warn('Error checking delivery role in Firestore:', err);
    return false;
  }
}

/**
 * Check if a user is currently banned or suspended
 */
export async function checkUserBanStatus(emailOrUid: string): Promise<{ isBanned: boolean; reason?: string }> {
  if (!emailOrUid) return { isBanned: false };
  const clean = emailOrUid.toLowerCase().trim();

  try {
    // 1. Check in security_bans collection
    const banKey = clean.replace(/[@.]/g, '_');
    const banDoc = await getDoc(doc(db, 'security_bans', banKey));
    if (banDoc.exists()) {
      const data = banDoc.data();
      return {
        isBanned: true,
        reason: data.reason || 'অ্যাকাউন্টটি নিরাপত্তা কারণে ব্যান করা হয়েছে',
      };
    }

    // 2. Check in /users collection
    // Check by UID
    const userDocRef = doc(db, 'users', clean);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.isBanned || data.isSuspended || data.status === 'suspended') {
        return {
          isBanned: true,
          reason: data.banReason || 'অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে',
        };
      }
    }

    // Check by email query
    const usersByEmail = query(collection(db, 'users'), where('email', '==', clean));
    const emailSnap = await getDocs(usersByEmail);
    for (const d of emailSnap.docs) {
      const data = d.data();
      if (data.isBanned || data.isSuspended || data.status === 'suspended') {
        return {
          isBanned: true,
          reason: data.banReason || 'অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে',
        };
      }
    }
  } catch (err) {
    console.warn('Error checking ban status:', err);
  }

  return { isBanned: false };
}

/**
 * Triggered when a non-admin user attempts to enter the Admin Portal (/admin)
 * Automatically and permanently suspends/bans the user account in Firebase!
 */
export async function suspendUserDueToAdminBreach(
  enteredEmail: string
): Promise<{ wasSuspended: boolean; userId?: string; userName?: string }> {
  const clean = enteredEmail.toLowerCase().trim();
  if (!clean || isDesignatedAdminEmail(clean)) {
    return { wasSuspended: false };
  }

  try {
    // 1. Search for user in /users collection by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', clean));
    const querySnap = await getDocs(usersQuery);

    let targetUserId: string | undefined;
    let targetUserName: string | undefined;

    const banReason = 'অননুমোদিত অ্যাডমিন প্যানেলে (/admin) অনুপ্রবেশের চেষ্টার কারণে সিস্টেম কর্তৃক স্বয়ংক্রিয়ভাবে অ্যাকাউন্টটি সাসপেন্ড ও ব্যান করা হয়েছে।';
    const timestamp = new Date().toISOString();

    if (!querySnap.empty) {
      // Suspend all matching documents for this email
      for (const userDoc of querySnap.docs) {
        targetUserId = userDoc.id;
        const uData = userDoc.data();
        targetUserName = uData.displayName || uData.name || 'কাস্টমার';

        await updateDoc(userDoc.ref, {
          status: 'suspended',
          isSuspended: true,
          isBanned: true,
          bannedAt: timestamp,
          banReason,
          updatedAt: timestamp,
        });
      }
    }

    // 2. Record permanent ban in security_bans collection
    const banKey = clean.replace(/[@.]/g, '_');
    await setDoc(doc(db, 'security_bans', banKey), {
      email: clean,
      userId: targetUserId || null,
      userName: targetUserName || null,
      bannedAt: timestamp,
      reason: banReason,
      incident: 'UNAUTHORIZED_ADMIN_PORTAL_BREACH_ATTEMPT',
      sourceUrl: '/admin',
    }, { merge: true });

    // 3. Record in securityAlerts for Admin Dashboard live visibility
    await addDoc(collection(db, 'securityAlerts'), {
      type: 'ADMIN_BREACH_ATTEMPT',
      severity: 'HIGH',
      email: clean,
      userId: targetUserId || null,
      userName: targetUserName || null,
      message: `অনুপ্রবেশ প্রচেষ্টা: ${clean} অ্যাডমিন প্যানেলে লগইন করার চেষ্টা করেছে। অ্যাকাউন্টটি অবিলম্বে সাসপেন্ড করা হয়েছে।`,
      timestamp: serverTimestamp(),
      actionTaken: 'USER_AUTOMATICALLY_SUSPENDED_AND_BANNED',
      resolved: false,
    });

    return {
      wasSuspended: true,
      userId: targetUserId,
      userName: targetUserName,
    };
  } catch (err) {
    console.error('Error suspending user for admin breach:', err);
    return { wasSuspended: false };
  }
}
