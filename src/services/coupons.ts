/**
 * BD SHOPS — Coupon Data Services & Firestore Synchronization
 * Handles coupon querying, creation, deletion, and validation
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { Coupon } from '../types';

const COLLECTION_NAME = 'coupons';

/**
 * Fetch all coupons from Firestore
 */
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Coupon[] = [];
    qSnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Coupon);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    return [];
  }
};

/**
 * Create or save a coupon to Firestore
 */
export const saveCoupon = async (coupon: Coupon): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, coupon.id);
    await setDoc(docRef, coupon);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${coupon.id}`);
  }
};

/**
 * Delete a coupon from Firestore
 */
export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, couponId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${couponId}`);
  }
};

/**
 * Validate a coupon code and calculate the discount amount
 * @param code The coupon code to validate
 * @param orderAmount Current total price of the items in cart
 */
export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount?: number;
}

export const validateCouponCode = async (
  code: string,
  orderAmount: number
): Promise<CouponValidationResult> => {
  if (!code || !code.trim()) {
    return { isValid: false, message: 'দয়া করে একটি কুপন কোড প্রবেশ করান' };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    // Search for code
    const q = query(
      collection(db, COLLECTION_NAME),
      where('code', '==', cleanCode),
      limit(1)
    );
    const qSnapshot = await getDocs(q);

    if (qSnapshot.empty) {
      return { isValid: false, message: 'ভুল কুপন কোড! দয়া করে সঠিক কোড দিন।' };
    }

    const couponDoc = qSnapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    // Check if active
    if (!coupon.isActive) {
      return { isValid: false, message: 'দুঃখিত, এই কুপনটি বর্তমানে সচল নেই।' };
    }

    // Check expiry
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate);
      const now = new Date();
      if (expiry < now) {
        return { isValid: false, message: 'দুঃখিত, কুপনটির মেয়াদ শেষ হয়ে গেছে!' };
      }
    }

    // Check min purchase
    const minRequired = coupon.minOrderAmount || coupon.minPurchaseAmount || 0;
    if (orderAmount < minRequired) {
      return {
        isValid: false,
        message: `এই কুপনটি ব্যবহার করতে ন্যূনতম ৳${minRequired.toLocaleString('bn-BD')} টাকার অর্ডার করতে হবে।`,
      };
    }

    // Calculate discount
    let discount = 0;
    const value = coupon.discountValue || coupon.discountAmount || 0;

    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderAmount * value) / 100);
      // Cap discount if max limit is set
      const maxLimit = coupon.maxDiscountAmount || coupon.maxDiscount || 0;
      if (maxLimit > 0 && discount > maxLimit) {
        discount = maxLimit;
      }
    } else {
      // Fixed discount
      discount = value;
    }

    // Ensure discount doesn't exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }

    return {
      isValid: true,
      message: 'কুপনটি সফলভাবে প্রয়োগ করা হয়েছে!',
      coupon,
      discountAmount: discount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { isValid: false, message: 'কুপন যাচাইকরণ ব্যর্থ হয়েছে, আবার চেষ্টা করুন।' };
  }
};
