/**
 * BD SHOPS — Shopping Cart & Wishlist State Management
 * Powered by Zustand with Persistence & Dynamic Calculations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, WishlistItem, Product, Coupon } from '../types';
import { APP_CONFIG } from '../constants';
import { StoreSettings, DEFAULT_STORE_SETTINGS } from '../services/settings';

export type DeliveryZone = 'insideDhaka' | 'outsideDhaka';

interface CartStore {
  items: CartItem[];
  wishlist: WishlistItem[];
  appliedCoupon: Coupon | null;
  deliveryZone: DeliveryZone;
  settings: StoreSettings;

  // Actions
  setSettings: (settings: StoreSettings) => void;

  // Cart Operations
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariantId?: string,
    selectedSize?: string,
    selectedColor?: string,
    selectedImage?: string
  ) => boolean;
  removeFromCart: (cartItemId: string) => void;
  removeItemsFromCart: (cartItemIds: string[]) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;

  // Coupon & Delivery Operations
  applyCoupon: (coupon: Coupon) => { success: boolean; message: string };
  removeCoupon: () => void;
  setDeliveryZone: (zone: DeliveryZone) => void;

  // Wishlist Operations
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (item: WishlistItem) => void;

  // Financial Calculators
  getSubtotal: () => number;
  getSavings: () => number;
  getDeliveryCharge: () => number;
  getCouponDiscount: () => number;
  getGrandTotal: () => number;
  getTotalItemsCount: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      appliedCoupon: null,
      deliveryZone: 'insideDhaka',
      settings: DEFAULT_STORE_SETTINGS,

      setSettings: (settings) => set({ settings }),

      addToCart: (product, quantity = 1, selectedVariantId, selectedSize, selectedColor, selectedImage) => {
        // Construct unique line identifier for cart item
        const variantSuffix = [selectedVariantId, selectedSize, selectedColor].filter(Boolean).join('_');
        const cartItemId = variantSuffix ? `${product.id}_${variantSuffix}` : product.id;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.cartItemId === cartItemId);

        // Determine price according to variant if selected
        let unitPrice = product.price;
        let unitOriginalPrice = product.compareAtPrice;
        let availableStock = product.stock || 20;

        if (selectedVariantId && product.variants) {
          const matchedVariant = product.variants.find((v) => v.id === selectedVariantId);
          if (matchedVariant) {
            unitPrice = matchedVariant.price || unitPrice;
            unitOriginalPrice = matchedVariant.compareAtPrice || product.compareAtPrice;
            availableStock = matchedVariant.stock || availableStock;
          }
        }

        if (availableStock <= 0) {
          return false;
        }

        const chosenImg = selectedImage || product.images?.[0] || product.image || '';

        let updatedItems: CartItem[];

        if (existingIndex > -1) {
          const currentItem = currentItems[existingIndex];
          const targetQty = currentItem.quantity + quantity;
          const finalQty = Math.min(targetQty, availableStock);

          updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: finalQty,
            price: unitPrice,
            image: chosenImg || currentItem.image,
            selectedImage: chosenImg || currentItem.selectedImage,
            maxStock: availableStock,
          };
        } else {
          const newItem: CartItem = {
            cartItemId,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: chosenImg,
            selectedImage: chosenImg,
            price: unitPrice,
            originalPrice: unitOriginalPrice,
            quantity: Math.min(quantity, availableStock),
            selectedSize,
            selectedColor,
            selectedVariantId,
            sku: product.sku || '',
            maxStock: availableStock,
          };
          updatedItems = [newItem, ...currentItems];
        }

        set({ items: updatedItems });

        // Trigger cart notification
        import('../services/notifications').then(({ createNotificationInFirestore }) => {
          createNotificationInFirestore({
            title: 'কার্টে পণ্য যোগ হয়েছে 🛒',
            message: `"${product.name}" আপনার শপিং কার্টে যুক্ত হয়েছে।`,
            type: 'cart',
            link: '/cart',
          }).catch(console.warn);
        });

        return true;
      },

      removeFromCart: (cartItemId) => {
        set({
          items: get().items.filter((item) => item.cartItemId !== cartItemId),
        });
      },

      removeItemsFromCart: (cartItemIds) => {
        const idSet = new Set(cartItemIds);
        set({
          items: get().items.filter((item) => !idSet.has(item.cartItemId)),
        });
      },

      updateQuantity: (cartItemId, newQuantity) => {
        if (newQuantity <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }

        const updated = get().items.map((item) => {
          if (item.cartItemId === cartItemId) {
            const capped = Math.min(newQuantity, item.maxStock || 99);
            return { ...item, quantity: capped };
          }
          return item;
        });

        set({ items: updated });
      },

      clearCart: () => {
        set({
          items: [],
          appliedCoupon: null,
        });
      },

      applyCoupon: (coupon) => {
        const subtotal = get().getSubtotal();
        const minOrder = coupon.minOrderAmount || coupon.minPurchaseAmount || 0;
        if (subtotal < minOrder) {
          return {
            success: false,
            message: `এই কুপনটি ব্যবহার করতে ন্যূনতম ৳${minOrder} মূল্যের অর্ডার করতে হবে।`,
          };
        }

        set({ appliedCoupon: coupon });
        return {
          success: true,
          message: `কুপন '${coupon.code}' সফলভাবে প্রয়োগ করা হয়েছে!`,
        };
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      setDeliveryZone: (zone) => {
        set({ deliveryZone: zone });
      },

      // Wishlist Operations
      toggleWishlist: (product) => {
        const { wishlist } = get();
        const exists = wishlist.some((item) => item.productId === product.id);

        if (exists) {
          set({
            wishlist: wishlist.filter((item) => item.productId !== product.id),
          });
        } else {
          const newItem: WishlistItem = {
            id: `wish_${product.id}`,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images?.[0] || product.image || '',
            price: product.price,
            originalPrice: product.compareAtPrice,
            stock: product.stock,
            addedAt: new Date().toISOString(),
          };
          set({ wishlist: [newItem, ...wishlist] });
        }
      },

      removeFromWishlist: (productId) => {
        set({
          wishlist: get().wishlist.filter((item) => item.productId !== productId),
        });
      },

      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.productId === productId);
      },

      moveToCart: (wishlistItem) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.productId === wishlistItem.productId);

        const cartItem: CartItem = {
          cartItemId: wishlistItem.productId,
          productId: wishlistItem.productId,
          name: wishlistItem.name,
          slug: wishlistItem.slug,
          image: wishlistItem.image,
          price: wishlistItem.price,
          originalPrice: wishlistItem.originalPrice,
          quantity: 1,
          maxStock: wishlistItem.stock || 20,
        };

        let updatedItems: CartItem[];

        if (existing) {
          updatedItems = currentItems.map((i) =>
            i.cartItemId === cartItem.cartItemId ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updatedItems = [cartItem, ...currentItems];
        }

        set({
          items: updatedItems,
          wishlist: get().wishlist.filter((w) => w.productId !== wishlistItem.productId),
        });
      },

      // Financial Calculation Getters
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getSavings: () => {
        return get().items.reduce((sum, item) => {
          if (item.originalPrice && item.originalPrice > item.price) {
            return sum + (item.originalPrice - item.price) * item.quantity;
          }
          return sum;
        }, 0);
      },

      getDeliveryCharge: () => {
        const { items, deliveryZone, settings } = get();
        const subtotal = get().getSubtotal();
        if (subtotal === 0 || items.length === 0) return 0;
        
        const features = settings.features || DEFAULT_STORE_SETTINGS.features;
        const insideCharge = features?.insideDhakaCharge ?? APP_CONFIG.deliveryCharges.insideDhaka;
        const outsideCharge = features?.outsideDhakaCharge ?? APP_CONFIG.deliveryCharges.outsideDhaka;
        const freeThreshold = features?.freeDeliveryThreshold ?? APP_CONFIG.deliveryCharges.freeDeliveryThreshold;
        const freeEnabled = features?.freeDeliveryEnabled ?? true;

        if (freeEnabled && subtotal >= freeThreshold) {
          return 0; // Free Delivery threshold reached
        }
        return deliveryZone === 'insideDhaka' ? insideCharge : outsideCharge;
      },

      getCouponDiscount: () => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        const minOrder = coupon.minOrderAmount || coupon.minPurchaseAmount || 0;
        if (subtotal < minOrder) return 0;

        const val = coupon.discountValue || coupon.discountAmount || 0;
        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * val) / 100);
        } else {
          discount = val;
        }

        const maxDisc = coupon.maxDiscountAmount || coupon.maxDiscount;
        if (maxDisc && discount > maxDisc) {
          discount = maxDisc;
        }

        return Math.min(discount, subtotal);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const delivery = get().getDeliveryCharge();
        const discount = get().getCouponDiscount();
        return Math.max(0, subtotal + delivery - discount);
      },

      getTotalItemsCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getTotalCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'bdshops-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        wishlist: state.wishlist,
        deliveryZone: state.deliveryZone,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
