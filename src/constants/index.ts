/**
 * BD SHOPS — Application Constants & Configuration
 * Mobile-First E-Commerce
 */

import { Coupon, OrderStatus, PaymentMethod } from '../types';

export const APP_CONFIG = {
  name: 'BD SHOPS',
  tagline: 'বাংলাদেশের বিশ্বস্ত প্রিমিয়াম অনলাইন শপিং',
  currency: '৳',
  currencyCode: 'BDT',
  supportPhone: '01796983725',
  supportWhatsApp: '01796983725',
  whatsappNumber: '01796983725',
  supportEmail: 'support@bdshops.com.bd',
  workingHours: 'সকাল ৯টা - রাত ১০টা (প্রতিদিন)',
  deliveryCharges: {
    insideDhaka: 70,
    outsideDhaka: 130,
    freeDeliveryThreshold: 2500, // ফ্রি ডেলিভারির জন্য ন্যূনতম অর্ডার
  },
  estimatedDelivery: {
    insideDhaka: '১ - ২ কার্যদিবস',
    outsideDhaka: '২ - ৪ কার্যদিবস',
  },
} as const;

export const BD_DISTRICTS: string[] = [
  'ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সিগঞ্জ', 'মানিকগঞ্জ', 'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'মাদারীপুর', 'গোপালগঞ্জ', 'রাজবাড়ী', 'শরীয়তপুর',
  'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ফেনী', 'ব্রাহ্মণবাড়িয়া', 'নোয়াখালী', 'চাঁদপুর', 'লক্ষ্মীপুর', 'রাঙ্গামাটি', 'খাগড়াছড়ি', 'বান্দরবান',
  'রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নাটোর', 'নওগাঁ', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট',
  'খুলনা', 'যশোর', 'কুষ্টিয়া', 'ঝিনাইদহ', 'সাতক্ষীরা', 'বাগেরহাট', 'চুয়াডাঙ্গা', 'মেহেরপুর', 'নড়াইল', 'মাগুরা',
  'বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি',
  'সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ',
  'রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'নীলফামারী', 'লালমনিরহাট', 'ঠাকুরগাঁও', 'পঞ্চগড়',
  'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'
];

export const BANGLADESH_DIVISIONS: Record<string, string[]> = {
  'ঢাকা (Dhaka)': [
    'ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'নরসিংদী', 'মুন্সিগঞ্জ', 'মানিকগঞ্জ', 
    'টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'মাদারীপুর', 'গোপালগঞ্জ', 'রাজবাড়ী', 'শরীয়তপুর'
  ],
  'চট্টগ্রাম (Chattogram)': [
    'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'ফেনী', 'ব্রাহ্মণবাড়িয়া', 'নোয়াখালী', 
    'চাঁদপুর', 'লক্ষ্মীপুর', 'রাঙ্গামাটি', 'খাগড়াছড়ি', 'বান্দরবান'
  ],
  'রাজশাহী (Rajshahi)': [
    'রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নাটোর', 'নওগাঁ', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট'
  ],
  'খুলনা (Khulna)': [
    'খুলনা', 'যশোর', 'কুষ্টিয়া', 'ঝিনাইদহ', 'সাতক্ষীরা', 'বাগেরহাট', 'চুয়াডাঙ্গা', 
    'মেহেরপুর', 'নড়াইল', 'মাগুরা'
  ],
  'বরিশাল (Barishal)': [
    'বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'
  ],
  'সিলেট (Sylhet)': [
    'সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'
  ],
  'রংপুর (Rangpur)': [
    'রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'নীলফামারী', 'লালমনিরহাট', 'ঠাকুরগাঁও', 'পঞ্চগড়'
  ],
  'ময়মনসিংহ (Mymensingh)': [
    'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'
  ]
};

export const SAMPLE_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'BDS100',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 1000,
    isActive: true,
  },
  {
    id: 'c2',
    code: 'EID2025',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 1500,
    maxDiscount: 300,
    isActive: true,
  },
  {
    id: 'c3',
    code: 'WELCOME',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 500,
    isActive: true,
  },
];

export interface StatusConfig {
  label: string;
  enLabel: string;
  description: string;
  color: string;
  badgeBg: string;
  stepIndex: number;
}

export const ORDER_STATUS_DETAILS: Record<OrderStatus, StatusConfig> = {
  received: {
    label: 'অর্ডার গৃহিত হয়েছে',
    enLabel: 'Order Received',
    description: 'আপনার অর্ডারটি সিস্টেমে সফলভাবে গ্রহণ করা হয়েছে।',
    color: '#0284C7',
    badgeBg: '#E0F2FE',
    stepIndex: 1,
  },
  pending: {
    label: 'অপেক্ষমাণ',
    enLabel: 'Pending',
    description: 'আপনার অর্ডারটি ভেরিফিকেশনের জন্য অপেক্ষমাণ।',
    color: '#0284C7',
    badgeBg: '#E0F2FE',
    stepIndex: 1,
  },
  confirmed: {
    label: 'অর্ডার কনফার্মড',
    enLabel: 'Order Confirmed',
    description: 'আমাদের টিম আপনার অর্ডারটি যাচাই করে নিশ্চিত করেছে।',
    color: '#00BFA5',
    badgeBg: '#E0F2F1',
    stepIndex: 2,
  },
  processing: {
    label: 'প্রসেসিং হচ্ছে',
    enLabel: 'Processing',
    description: 'পণ্য প্যাকেজিং এবং ডেলিভারির জন্য প্রস্তুত করা হচ্ছে।',
    color: '#D97706',
    badgeBg: '#FEF3C7',
    stepIndex: 3,
  },
  shipped: {
    label: 'ডেলিভারিতে রয়েছে',
    enLabel: 'Shipped',
    description: 'পণ্য কুরিয়ার বা ডেলিভারি রাইডারের কাছে হস্তান্তর করা হয়েছে।',
    color: '#7C3AED',
    badgeBg: '#EDE9FE',
    stepIndex: 4,
  },
  delivered: {
    label: 'ডেলিভারি সম্পন্ন',
    enLabel: 'Delivered',
    description: 'পণ্যটি আপনার কাছে সফলভাবে পৌঁছে দেওয়া হয়েছে।',
    color: '#059669',
    badgeBg: '#D1FAE5',
    stepIndex: 5,
  },
  cancelled: {
    label: 'বাতিল করা হয়েছে',
    enLabel: 'Cancelled',
    description: 'অর্ডারটি বাতিল করা হয়েছে।',
    color: '#DC2626',
    badgeBg: '#FEE2E2',
    stepIndex: 0,
  },
  returned: {
    label: 'ফেরত পাঠানো হয়েছে',
    enLabel: 'Returned',
    description: 'পণ্যটি ফেরত নেওয়া হয়েছে।',
    color: '#6B7280',
    badgeBg: '#F3F4F6',
    stepIndex: 0,
  },
};

export const PAYMENT_METHODS_LIST: { id: PaymentMethod; title: string; subtitle: string; iconType: string }[] = [
  {
    id: 'cod',
    title: 'ক্যাশ অন ডেলিভারি (Cash on Delivery)',
    subtitle: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন',
    iconType: 'truck',
  },
  {
    id: 'bkash',
    title: 'বিকাশ (bKash Payment)',
    subtitle: 'বিকাশ ওয়ালেট থেকে দ্রুত ও নিরাপদে পেমেন্ট করুন',
    iconType: 'bkash',
  },
  {
    id: 'nagad',
    title: 'নগদ (Nagad Payment)',
    subtitle: 'নগদ ওয়ালেটের মাধ্যমে পরিশোধ করুন',
    iconType: 'nagad',
  },
];

export const SORT_OPTIONS_LIST = [
  { id: 'recommended', label: 'প্রস্তাবিত (Recommended)' },
  { id: 'newest', label: 'নতুন আগমন (Newest)' },
  { id: 'price_low', label: 'দাম: কম থেকে বেশি' },
  { id: 'price_high', label: 'দাম: বেশি থেকে কম' },
  { id: 'rating', label: 'সর্বোচ্চ রেটিং' },
  { id: 'popular', label: 'জনপ্রিয়' },
] as const;
