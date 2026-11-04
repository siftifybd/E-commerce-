/**
 * BD SHOPS — Comprehensive TypeScript Interfaces & Models
 * Defines all domain entities for Products, Categories, Cart, Orders, Reviews, and Users
 */

export type Role = 'customer' | 'admin' | 'super_admin' | 'moderator' | 'order_manager' | 'delivery_man' | 'staff';

export interface StaffPermission {
  id: string;
  name: string;
  description: string;
  module: 'orders' | 'products' | 'categories' | 'system' | 'users' | 'delivery' | 'analytics';
  enabled: boolean;
}

export interface StaffAccount {
  id: string;
  username: string;
  password?: string; // Plain password for simple custom login (not recommended for production, but fulfilling request)
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  permissions: string[]; // List of permission IDs or module names
  loginUrl?: string; // Custom login URL generated for them
  portalUrl?: string; // Dynamic portal URL for delivery man or staff
  portalType?: 'admin' | 'delivery' | 'moderator' | 'order_manager';
  assignedOrdersCount?: number;
  completedDeliveriesCount?: number;
  totalCashCollected?: number;
  cashInHand?: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryAccounting {
  totalAssignedOrders: number;
  completedOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  totalCashToCollect: number;
  totalCashCollected: number;
  deliveryFeeEarned: number;
  cashInHandToAdmin: number;
  todayCashCollected?: number;
  todayCompletedCount?: number;
  period?: string;
}

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'cod'
  | 'online_payment'
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'upay'
  | 'card';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus =
  | 'received'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type SortOption =
  | 'featured'
  | 'popular'
  | 'newest'
  | 'price_low_high'
  | 'price_high_low'
  | 'price_low'
  | 'price_high'
  | 'rating'
  | 'discount'
  | 'recommended';

export interface FilterState {
  categoryId?: string;
  categorySlug?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  discountOnly?: boolean;
  sortBy?: SortOption;
  rating?: number;
  searchQuery?: string;
  tags?: string[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  categoryId?: string;
  productCount?: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  icon?: string;
  description?: string;
  productCount?: number;
  featured?: boolean;
  order?: number;
  subcategories?: SubCategory[];
}

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  stock: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  subCategory?: string;
  costPrice?: number;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  originalPrice?: number;
  discountPercentage?: number;
  discountPercent?: number;
  discountPrice?: number;
  stock: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sku?: string;
  image: string;
  images: string[];
  description: string;
  richDescription?: string;
  shortDescription?: string;
  specifications?: Record<string, string>;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  estimatedDeliveryTime?: string;
  deliveryDays?: string | number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFlashSale?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  verified?: boolean;
  videoUrl?: string;
  barcode?: string;
  attributes?: Record<string, string>;
  outOfStockAction?: 'hide' | 'backorder' | 'show_out_of_stock';
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  selectedImage?: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  selectedVariantId?: string;
  sku?: string;
  stock?: number;
  maxStock?: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  stock?: number;
  inStock?: boolean;
  rating?: number;
  categoryName?: string;
  addedAt?: string;
}

export interface Address {
  id: string;
  label?: string;
  recipientName?: string;
  fullName?: string;
  phone?: string;
  division?: string;
  district: string;
  city?: string;
  upazilaOrArea?: string;
  streetAddress?: string;
  address?: string;
  deliveryZone?: 'insideDhaka' | 'outsideDhaka';
  type?: 'home' | 'work' | 'office' | 'other';
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  photoURL?: string;
  role?: Role;
  addresses?: Address[];
  savedAddresses?: Address[];
  defaultAddressId?: string;
  createdAt?: string;
  updatedAt?: string;
  isSuspended?: boolean;
  isBanned?: boolean;
  status?: 'active' | 'suspended';
  banReason?: string;
  bannedAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug?: string;
  image: string;
  selectedImage?: string;
  price: number;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface OrderTimelineStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  completed?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  customerName: string;
  customerPhone?: string;
  phone?: string;
  email?: string;
  customerEmail?: string;
  district?: string;
  address?: string;
  customerInfo?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  shippingAddress?: Address;
  deliveryAddress?: Address;
  total: number;
  grandTotal: number;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponDiscount?: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  timeline?: OrderTimelineStep[];
  trackingTimeline?: OrderTimelineStep[];
  notes?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  senderNumber?: string;
  paidAmount?: number;
  paymentChannel?: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'cod';
  // Delivery Management & Accounting fields
  deliveryStatus?: 'unassigned' | 'assigned' | 'in_transit' | 'delivered' | 'returned' | string;
  assignedDeliveryManId?: string;
  assignedDeliveryManName?: string;
  assignedDeliveryManPhone?: string;
  deliveryNotes?: string;
  cashCollectedAmount?: number;
  deliveryCompletedAt?: string;
  deliveryReturnedAt?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountAmount?: number;
  discountValue: number;
  minPurchaseAmount?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  timesUsed?: number;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  order?: number;
  displayOrder?: number;
}

export interface PromotionalBanner extends Banner {}

export interface FlashSaleCampaign {
  id: string;
  title: string;
  subtitle?: string;
  endDate: string;
  discountPercentage: number;
  productIds: string[];
  isActive: boolean;
}
