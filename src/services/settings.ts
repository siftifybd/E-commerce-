/**
 * BD SHOPS — Store Settings Service (Firestore Persistent Config)
 * Saves & loads WhatsApp number, online payment control settings, dynamic brand settings, and feature switches
 */

import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase/config';

export interface PaymentMethodConfig {
  enabled: boolean;
  number: string;
  type: 'Personal' | 'Merchant' | 'Agent';
  instructions?: string;
}

export interface OnlinePaymentSettings {
  isOnlinePaymentEnabled: boolean;
  isCodEnabled: boolean;
  bkash: PaymentMethodConfig;
  nagad: PaymentMethodConfig;
  rocket: PaymentMethodConfig;
  upay: PaymentMethodConfig;
}

export interface Banner {
  id: string;
  image: string;
  link?: string;
  title?: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  comment: string;
  rating: number;
  image?: string;
  date: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface NavButton {
  id: string;
  label: string;
  link: string;
  icon: string;
  isActive: boolean;
}

export interface MobileFooterSettings {
  enabled: boolean;
  style: 'classic' | 'modern' | 'minimal' | 'glass' | 'floating';
  bgColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  showLabels: boolean;
  buttons: NavButton[];
}

export interface FeatureToggles {
  // 1. Top Notice / Announcement Bar
  topNoticeEnabled: boolean;
  topNoticeText: string;
  topNoticeLink?: string;
  topNoticeBgColor?: string;
  topNoticeTextColor?: string;

  // 2. Hero Slider (Banner Manager)
  heroSliderEnabled: boolean;
  banners: Banner[];

  // 3. Floating WhatsApp Chat Button
  floatingWhatsAppEnabled: boolean;
  whatsappMessage?: string;
  whatsappTooltipText?: string;
  whatsappTooltipDelay?: number;
  whatsappIcon?: string;
  whatsappPosition?: 'bottom-right' | 'bottom-left';
  whatsappBgColor?: string;
  whatsappTextColor?: string;

  // 4. Flash Sale Section with Countdown Timer
  flashSaleEnabled: boolean;
  flashSaleTitle?: string;
  flashSaleEndTime?: string;

  // 5. Promotional Pop-up Modal
  promoModalEnabled: boolean;
  promoModalTitle?: string;
  promoModalSubtitle?: string;
  promoModalImage?: string;
  promoModalCoupon?: string;

  // 6. 1-Click Quick Order Form
  quickOrderEnabled: boolean;

  // 7. Delivery Charge Controls
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryThreshold?: number;

  // 8. Low Stock Badge Alert
  lowStockBadgeEnabled: boolean;
  lowStockThreshold: number;

  // 9. Coupon System
  couponSystemEnabled: boolean;

  // 10. Reviews Section
  reviewsEnabled: boolean;
  reviews: CustomerReview[];

  // 11. Professional Features
  productVariantsEnabled?: boolean;
  advancedSearchEnabled?: boolean;
  wishlistEnabled?: boolean;
  orderTrackingEnabled?: boolean;
  quickViewEnabled?: boolean;
  salesAnalyticsEnabled?: boolean;
  stockAlertEnabled?: boolean;
  bulkEditEnabled?: boolean;
  crmEnabled?: boolean;
  multiImageGalleryEnabled?: boolean;
  autoInvoiceEnabled?: boolean;
  staffManagementEnabled?: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
}

export interface EmailSettings {
  adminEmail?: string;
  orderNotificationEmail?: string;
  smtpHost?: string;
}

export interface SmsSettings {
  enabled?: boolean;
  provider?: string;
  apiKey?: string;
  senderId?: string;
}

export interface TaxSettings {
  enabled?: boolean;
  taxRatePercentage?: number;
  isInclusive?: boolean;
}

export interface StoreSettings {
  siteName: string;
  siteLogo: string;
  favicon?: string;
  themeMode?: 'light' | 'dark' | 'system';
  themeColor?: string;
  currencySymbol?: string;
  currencyCode?: string;
  language?: 'bn' | 'en';
  address?: string;
  socialLinks?: SocialLinks;
  emailSettings?: EmailSettings;
  smsSettings?: SmsSettings;
  taxSettings?: TaxSettings;
  isStoreOnline: boolean;
  maintenanceNotice?: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  payments?: OnlinePaymentSettings;
  features?: FeatureToggles;
  customPages?: CustomPage[];
  navigationButtons?: NavButton[];
  mobileFooter?: MobileFooterSettings;
  adminPasscode?: string;
  updatedAt?: string;
}

const SETTINGS_DOC_ID = 'store_config';

export const DEFAULT_PAYMENT_SETTINGS: OnlinePaymentSettings = {
  isOnlinePaymentEnabled: true,
  isCodEnabled: true,
  bkash: {
    enabled: true,
    number: '01796983725',
    type: 'Personal',
    instructions: 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে "Send Money" করুন।',
  },
  nagad: {
    enabled: true,
    number: '01796983725',
    type: 'Personal',
    instructions: 'নগদ অ্যাপ অথবা *167# ডায়াল করে "Send Money" করুন।',
  },
  rocket: {
    enabled: true,
    number: '01796983725',
    type: 'Personal',
    instructions: 'রকেট অ্যাপ অথবা *322# ডায়াল করে "Send Money" করুন।',
  },
  upay: {
    enabled: false,
    number: '01796983725',
    type: 'Personal',
    instructions: 'উপায় অ্যাপ অথবা *268# ডায়াল করে "Send Money" করুন।',
  },
};

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  topNoticeEnabled: true,
  topNoticeText: '🎉 বিশেষ অফার: আজকের যেকোনো অর্ডারে সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি!',
  topNoticeLink: '/products',
  topNoticeBgColor: '#ea580c',
  topNoticeTextColor: '#ffffff',
  heroSliderEnabled: true,
  banners: [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop',
      title: 'Mega Eid Sale',
      link: '/category/flash-sale'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
      title: 'New Arrivals',
      link: '/products'
    }
  ],
  floatingWhatsAppEnabled: true,
  whatsappMessage: 'আসসালামু আলাইকুম! BD SHOPS এ আপনাকে স্বাগতম। কীভাবে সহযোগিতা করতে পারি?',
  whatsappTooltipText: 'আসসালামু আলাইকুম! সরাসরি হোয়াটস্অ্যাপে অর্ডার করতে এখানে ক্লিক করুন।',
  whatsappTooltipDelay: 5,
  whatsappIcon: '',
  whatsappPosition: 'bottom-right',
  whatsappBgColor: '#25D366',
  whatsappTextColor: '#ffffff',
  flashSaleEnabled: true,
  flashSaleTitle: '🔥 ধামাকা ফ্ল্যাশ সেল — সীমিত সময়ের বিশেষ ছাড়!',
  flashSaleEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  promoModalEnabled: true,
  promoModalTitle: 'ঈদ স্পেশাল মেগা ডিসকাউন্ট!',
  promoModalSubtitle: 'আমাদের প্রিমিয়াম কালেকশনে পান আকর্ষণীয় ছাড়। এখনই কেনাকাটা করুন!',
  promoModalImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop',
  promoModalCoupon: 'EID2026',
  quickOrderEnabled: true,
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  freeDeliveryEnabled: true,
  freeDeliveryThreshold: 2000,
  lowStockBadgeEnabled: true,
  lowStockThreshold: 5,
  couponSystemEnabled: true,
  reviewsEnabled: true,
  reviews: [
    {
      id: '1',
      name: 'Rahat Ahmed',
      comment: 'পণ্যটি খুব ভালো ছিল, ডেলিভারিও অনেক দ্রুত পেয়েছি। ধন্যবাদ!',
      rating: 5,
      date: new Date().toISOString()
    }
  ],
  productVariantsEnabled: true,
  advancedSearchEnabled: true,
  wishlistEnabled: true,
  orderTrackingEnabled: true,
  quickViewEnabled: true,
  salesAnalyticsEnabled: true,
  stockAlertEnabled: true,
  bulkEditEnabled: true,
  crmEnabled: true,
  multiImageGalleryEnabled: true,
  autoInvoiceEnabled: true,
  staffManagementEnabled: true,
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  siteName: 'BD SHOPS',
  siteLogo: '',
  favicon: '',
  themeMode: 'light',
  themeColor: '#ea580c',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  language: 'bn',
  address: 'ঢাকা, বাংলাদেশ',
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    tiktok: 'https://tiktok.com',
    whatsapp: 'https://wa.me/8801796983725',
  },
  emailSettings: {
    adminEmail: 'admin@bdshops.com.bd',
    orderNotificationEmail: 'orders@bdshops.com.bd',
    smtpHost: 'smtp.bdshops.com.bd',
  },
  smsSettings: {
    enabled: true,
    provider: 'Greenweb SMS',
    apiKey: '',
    senderId: 'BDSHOPS',
  },
  taxSettings: {
    enabled: false,
    taxRatePercentage: 0,
    isInclusive: true,
  },
  isStoreOnline: true,
  maintenanceNotice: 'ওয়েবসাইট মেইনটেন্যান্স বা সাময়িক উন্নয়নের কাজ চলছে। কিছুক্ষণের মধ্যে আবার চালু হবে।',
  whatsappNumber: '01796983725',
  supportPhone: '01796983725',
  supportEmail: 'support@bdshops.com.bd',
  payments: DEFAULT_PAYMENT_SETTINGS,
  features: DEFAULT_FEATURE_TOGGLES,
  customPages: [],
  navigationButtons: [
    { id: '1', label: 'হোম', link: '/', icon: 'Home', isActive: true },
    { id: '2', label: 'শপ', link: '/products', icon: 'ShoppingBag', isActive: true },
    { id: '3', label: 'ক্যাটাগরি', link: '/categories', icon: 'Grid', isActive: true },
    { id: '4', label: 'প্রোফাইল', link: '/account', icon: 'User', isActive: true },
  ],
  mobileFooter: {
    enabled: true,
    style: 'modern',
    bgColor: '#ffffff',
    activeColor: '#00BFA5',
    inactiveColor: '#64748b',
    showLabels: true,
    buttons: [
      { id: '1', label: 'হোম', link: '/', icon: 'Home', isActive: true },
      { id: '2', label: 'শপ', link: '/products', icon: 'ShoppingBag', isActive: true },
      { id: '3', label: 'অর্ডার', link: '/account/orders', icon: 'Package', isActive: true },
      { id: '4', label: 'প্রোফাইল', link: '/account', icon: 'User', isActive: true },
    ],
  },
  adminPasscode: 'admin123',
};

/**
 * Fetch dynamic store settings from Firestore with fallback to defaults
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as StoreSettings;
      return {
        siteName: data.siteName || DEFAULT_STORE_SETTINGS.siteName,
        siteLogo: data.siteLogo || DEFAULT_STORE_SETTINGS.siteLogo,
        favicon: data.favicon || DEFAULT_STORE_SETTINGS.favicon,
        themeMode: data.themeMode || DEFAULT_STORE_SETTINGS.themeMode,
        themeColor: data.themeColor || DEFAULT_STORE_SETTINGS.themeColor,
        currencySymbol: data.currencySymbol || DEFAULT_STORE_SETTINGS.currencySymbol,
        currencyCode: data.currencyCode || DEFAULT_STORE_SETTINGS.currencyCode,
        language: data.language || DEFAULT_STORE_SETTINGS.language,
        address: data.address || DEFAULT_STORE_SETTINGS.address,
        socialLinks: { ...DEFAULT_STORE_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
        emailSettings: { ...DEFAULT_STORE_SETTINGS.emailSettings, ...(data.emailSettings || {}) },
        smsSettings: { ...DEFAULT_STORE_SETTINGS.smsSettings, ...(data.smsSettings || {}) },
        taxSettings: { ...DEFAULT_STORE_SETTINGS.taxSettings, ...(data.taxSettings || {}) },
        isStoreOnline: data.isStoreOnline !== undefined ? data.isStoreOnline : DEFAULT_STORE_SETTINGS.isStoreOnline,
        maintenanceNotice: data.maintenanceNotice || DEFAULT_STORE_SETTINGS.maintenanceNotice,
        whatsappNumber: data.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber,
        supportPhone: data.supportPhone || DEFAULT_STORE_SETTINGS.supportPhone,
        supportEmail: data.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail,
        payments: {
          ...DEFAULT_PAYMENT_SETTINGS,
          ...(data.payments || {}),
          bkash: { ...DEFAULT_PAYMENT_SETTINGS.bkash, ...(data.payments?.bkash || {}) },
          nagad: { ...DEFAULT_PAYMENT_SETTINGS.nagad, ...(data.payments?.nagad || {}) },
          rocket: { ...DEFAULT_PAYMENT_SETTINGS.rocket, ...(data.payments?.rocket || {}) },
          upay: { ...DEFAULT_PAYMENT_SETTINGS.upay, ...(data.payments?.upay || {}) },
        },
        features: {
          ...DEFAULT_FEATURE_TOGGLES,
          ...(data.features || {}),
        },
        customPages: data.customPages || DEFAULT_STORE_SETTINGS.customPages,
        navigationButtons: data.navigationButtons || DEFAULT_STORE_SETTINGS.navigationButtons,
        mobileFooter: {
          enabled: data.mobileFooter?.enabled ?? DEFAULT_STORE_SETTINGS.mobileFooter!.enabled,
          style: data.mobileFooter?.style || DEFAULT_STORE_SETTINGS.mobileFooter!.style,
          bgColor: data.mobileFooter?.bgColor || DEFAULT_STORE_SETTINGS.mobileFooter!.bgColor,
          activeColor: data.mobileFooter?.activeColor || DEFAULT_STORE_SETTINGS.mobileFooter!.activeColor,
          inactiveColor: data.mobileFooter?.inactiveColor || DEFAULT_STORE_SETTINGS.mobileFooter!.inactiveColor,
          showLabels: data.mobileFooter?.showLabels ?? DEFAULT_STORE_SETTINGS.mobileFooter!.showLabels,
          buttons: data.mobileFooter?.buttons || DEFAULT_STORE_SETTINGS.mobileFooter?.buttons || [],
        },
        adminPasscode: data.adminPasscode || DEFAULT_STORE_SETTINGS.adminPasscode,
      };
    }
  } catch (err) {
    console.warn('Could not fetch store settings from Firestore, using default:', err);
  }

  return DEFAULT_STORE_SETTINGS;
}

/**
 * Real-time listener for store settings in Firestore.
 * Automatically notifies callback when site name, logo, payment numbers, or features change.
 */
export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StoreSettings;
        const mergedSettings: StoreSettings = {
          siteName: data.siteName || DEFAULT_STORE_SETTINGS.siteName,
          siteLogo: data.siteLogo || DEFAULT_STORE_SETTINGS.siteLogo,
          favicon: data.favicon || DEFAULT_STORE_SETTINGS.favicon,
          themeMode: data.themeMode || DEFAULT_STORE_SETTINGS.themeMode,
          themeColor: data.themeColor || DEFAULT_STORE_SETTINGS.themeColor,
          currencySymbol: data.currencySymbol || DEFAULT_STORE_SETTINGS.currencySymbol,
          currencyCode: data.currencyCode || DEFAULT_STORE_SETTINGS.currencyCode,
          language: data.language || DEFAULT_STORE_SETTINGS.language,
          address: data.address || DEFAULT_STORE_SETTINGS.address,
          socialLinks: { ...DEFAULT_STORE_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
          emailSettings: { ...DEFAULT_STORE_SETTINGS.emailSettings, ...(data.emailSettings || {}) },
          smsSettings: { ...DEFAULT_STORE_SETTINGS.smsSettings, ...(data.smsSettings || {}) },
          taxSettings: { ...DEFAULT_STORE_SETTINGS.taxSettings, ...(data.taxSettings || {}) },
          isStoreOnline: data.isStoreOnline !== undefined ? data.isStoreOnline : DEFAULT_STORE_SETTINGS.isStoreOnline,
          maintenanceNotice: data.maintenanceNotice || DEFAULT_STORE_SETTINGS.maintenanceNotice,
          whatsappNumber: data.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber,
          supportPhone: data.supportPhone || DEFAULT_STORE_SETTINGS.supportPhone,
          supportEmail: data.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail,
          payments: {
            ...DEFAULT_PAYMENT_SETTINGS,
            ...(data.payments || {}),
            bkash: { ...DEFAULT_PAYMENT_SETTINGS.bkash, ...(data.payments?.bkash || {}) },
            nagad: { ...DEFAULT_PAYMENT_SETTINGS.nagad, ...(data.payments?.nagad || {}) },
            rocket: { ...DEFAULT_PAYMENT_SETTINGS.rocket, ...(data.payments?.rocket || {}) },
            upay: { ...DEFAULT_PAYMENT_SETTINGS.upay, ...(data.payments?.upay || {}) },
          },
          features: {
            ...DEFAULT_FEATURE_TOGGLES,
            ...(data.features || {}),
          },
          customPages: data.customPages || DEFAULT_STORE_SETTINGS.customPages,
          navigationButtons: data.navigationButtons || DEFAULT_STORE_SETTINGS.navigationButtons,
          mobileFooter: {
            enabled: data.mobileFooter?.enabled ?? DEFAULT_STORE_SETTINGS.mobileFooter!.enabled,
            style: data.mobileFooter?.style || DEFAULT_STORE_SETTINGS.mobileFooter!.style,
            bgColor: data.mobileFooter?.bgColor || DEFAULT_STORE_SETTINGS.mobileFooter!.bgColor,
            activeColor: data.mobileFooter?.activeColor || DEFAULT_STORE_SETTINGS.mobileFooter!.activeColor,
            inactiveColor: data.mobileFooter?.inactiveColor || DEFAULT_STORE_SETTINGS.mobileFooter!.inactiveColor,
            showLabels: data.mobileFooter?.showLabels ?? DEFAULT_STORE_SETTINGS.mobileFooter!.showLabels,
            buttons: data.mobileFooter?.buttons || DEFAULT_STORE_SETTINGS.mobileFooter?.buttons || [],
          },
          adminPasscode: data.adminPasscode || DEFAULT_STORE_SETTINGS.adminPasscode,
        };
        onUpdate(mergedSettings);
      } else {
        onUpdate(DEFAULT_STORE_SETTINGS);
      }
    },
    (err) => {
      console.warn('Settings real-time subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Helper to recursively remove undefined fields so Firestore never rejects setDoc/updateDoc
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Update store settings in Firestore
 */
export async function saveStoreSettingsInFirestore(settings: StoreSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const cleanedData = sanitizeForFirestore({
      ...settings,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, cleanedData, { merge: true });

    // Update local storage for instant sync across components
    if (typeof window !== 'undefined') {
      if (settings.whatsappNumber) localStorage.setItem('bd_shops_whatsapp_number', settings.whatsappNumber);
      if (settings.siteName) localStorage.setItem('bd_shops_site_name', settings.siteName);
      if (settings.siteLogo) localStorage.setItem('bd_shops_site_logo', settings.siteLogo);
    }
  } catch (err) {
    console.error('Error saving store settings in Firestore:', err);
    throw err;
  }
}
