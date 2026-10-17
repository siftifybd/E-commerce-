/**
 * BD SHOPS — Shopping Cart & Financial Breakdown Page
 * Mobile-First Line Item Management, Coupon Application, Delivery Zones
 * Daraz-Style Selective Checkout (Select / Deselect All, Individual Checkboxes)
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, DeliveryZone } from '../../store/useCartStore';
import { getCheckoutWhatsAppLink } from '../../utils/whatsapp';
import { APP_CONFIG, SAMPLE_COUPONS } from '../../constants';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    removeItemsFromCart,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    deliveryZone,
    setDeliveryZone,
  } = useCartStore();

  // Daraz-style: IDs of selected items for checkout
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState('');

  // Keep selected items synchronized with available cart items
  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds((prev) => {
      // If none was previously selected, default select all (like Daraz initially)
      if (prev.length === 0) {
        return items.map((i) => i.cartItemId);
      }
      // Retain only those items that still exist in cart
      const currentIds = new Set(items.map((i) => i.cartItemId));
      const validPrev = prev.filter((id) => currentIds.has(id));
      return validPrev.length > 0 ? validPrev : items.map((i) => i.cartItemId);
    });
  }, [items]);

  // Derived selected items list
  const selectedItems = items.filter((item) => selectedItemIds.includes(item.cartItemId));
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  // Toggle selection for a single item
  const handleToggleItem = (cartItemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((id) => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  // Toggle Select All / Deselect All
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((i) => i.cartItemId));
    }
  };

  // Delete all selected items
  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`আপনি কি নির্বাচিত ${selectedItems.length}টি পণ্য কার্ট থেকে মুছে ফেলতে চান?`)) {
      removeItemsFromCart(selectedItemIds);
      toast.success('নির্বাচিত পণ্যসমূহ কার্ট থেকে মুছে ফেলা হয়েছে');
    }
  };

  // Financial Calculations for SELECTED ITEMS ONLY
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const savings = selectedItems.reduce((sum, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);

  const freeThreshold = APP_CONFIG.deliveryCharges.freeDeliveryThreshold || 2000;
  const remainingForFreeDelivery = Math.max(0, freeThreshold - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  const deliveryCharge =
    selectedItems.length === 0
      ? 0
      : subtotal >= freeThreshold
      ? 0
      : deliveryZone === 'insideDhaka'
      ? APP_CONFIG.deliveryCharges.insideDhaka
      : APP_CONFIG.deliveryCharges.outsideDhaka;

  // Calculate coupon discount on selected items
  const calculateCouponDiscount = () => {
    if (!appliedCoupon || selectedItems.length === 0) return 0;
    const minOrder = appliedCoupon.minOrderAmount || appliedCoupon.minPurchaseAmount || 0;
    if (subtotal < minOrder) return 0;

    const val = appliedCoupon.discountValue || appliedCoupon.discountAmount || 0;
    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = Math.round((subtotal * val) / 100);
    } else {
      discount = val;
    }

    const maxDisc = appliedCoupon.maxDiscountAmount || appliedCoupon.maxDiscount;
    if (maxDisc && discount > maxDisc) {
      discount = maxDisc;
    }

    return Math.min(discount, subtotal);
  };

  const couponDiscount = calculateCouponDiscount();
  const grandTotal = Math.max(0, subtotal + deliveryCharge - couponDiscount);
  const selectedItemsQuantityCount = selectedItems.reduce((count, item) => count + item.quantity, 0);

  // Checkout Handlers
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('চেকআউট করতে অনুগ্রহ করে অন্তত একটি পণ্য সিলেক্ট করুন।');
      return;
    }
    navigate('/checkout', {
      state: {
        selectedCartItemIds: selectedItemIds,
      },
    });
  };

  const handleWhatsAppCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('অর্ডার করতে অনুগ্রহ করে অন্তত একটি পণ্য সিলেক্ট করুন।');
      return;
    }

    const waLink = getCheckoutWhatsAppLink({
      items: selectedItems,
      subtotal,
      deliveryCharge,
      discount: couponDiscount,
      grandTotal,
      notes: `অর্ডার আইডি (Cart): ${Date.now()}`,
    });
    window.location.href = waLink;
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const matched = SAMPLE_COUPONS.find(
      (c) => c.code.toLowerCase() === couponInput.trim().toLowerCase() && c.isActive
    );

    if (!matched) {
      toast.error('দুঃখিত, কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।');
      return;
    }

    const res = applyCoupon(matched);
    if (res.success) {
      toast.success(res.message);
      setCouponInput('');
    } else {
      toast.error(res.message);
    }
  };

  const handleApplyPresetCoupon = (code: string) => {
    const matched = SAMPLE_COUPONS.find((c) => c.code === code && c.isActive);
    if (matched) {
      const res = applyCoupon(matched);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Helmet>
          <title>শপিং কার্ট খালি — Black Zone</title>
        </Helmet>
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">আপনার কার্ট বর্তমানে খালি</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            আপনার পছন্দের পাঞ্জাবি, সুগন্ধি আতর বা ইসলামিক কালেকশন থেকে পণ্য কার্টে যোগ করে কেনাকাটা শুরু করুন।
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
          >
            কেনাকাটা শুরু করুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-16 bg-[#F8FAFC]">
      <Helmet>
        <title>{`শপিং কার্ট (${items.length}) — Black Zone`}</title>
      </Helmet>

      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00BFA5]" />
            আপনার শপিং কার্ট ({items.length}টি পণ্য)
          </h1>
          <Link to="/products" className="text-xs font-bold text-[#00BFA5] hover:underline">
            আরও পণ্য যোগ করুন
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* FREE DELIVERY PROGRESS BAR */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#00BFA5]" />
              {remainingForFreeDelivery === 0 && selectedItems.length > 0 ? (
                <span className="text-[#00796B]">অভিনন্দন! আপনি ফ্রি ডেলিভারি উপভোগ করছেন!</span>
              ) : (
                <span>
                  আর ৳{remainingForFreeDelivery.toLocaleString('bn-BD')} টাকার অর্ডার করলেই ফ্রি ডেলিভারি!
                </span>
              )}
            </span>
            <span className="text-slate-500">{freeDeliveryProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00A892] to-[#00BFA5] transition-all duration-500 rounded-full"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* CART ITEMS LIST */}
          <div className="lg:col-span-2 space-y-3">
            {/* DARAZ-STYLE SELECT ALL & BULK DELETE BAR */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-5 h-5 rounded-md text-[#00BFA5] accent-[#00BFA5] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  সবগুলো সিলেক্ট করুন ({selectedItems.length}/{items.length})
                </span>
              </label>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>সিলেক্টেড ({selectedItems.length}) মুছুন</span>
                </button>
              )}
            </div>

            {/* PRODUCT CARDS */}
            {items.map((item) => {
              const isChecked = selectedItemIds.includes(item.cartItemId);

              return (
                <div
                  key={item.cartItemId}
                  className={`p-3.5 sm:p-4 rounded-2xl bg-white border transition-all flex items-center gap-3 sm:gap-4 shadow-xs ${
                    isChecked
                      ? 'border-[#00BFA5]/60 bg-teal-50/10 ring-1 ring-[#00BFA5]/20'
                      : 'border-slate-200/80 hover:border-slate-300 opacity-80'
                  }`}
                >
                  {/* Daraz Checkbox */}
                  <label className="cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.cartItemId)}
                      className="w-5 h-5 rounded-md text-[#00BFA5] accent-[#00BFA5] cursor-pointer"
                    />
                  </label>

                  {/* Product Image */}
                  <Link
                    to={`/product/${item.slug}`}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative group"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      className="block font-bold text-xs sm:text-sm text-slate-900 truncate hover:text-[#00BFA5] transition-colors"
                    >
                      {item.name}
                    </Link>

                    {/* Selected Attributes */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-0.5">
                      {item.selectedSize && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          সাইজ: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          কালার: {item.selectedColor}
                        </span>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-[#00796B]">
                        {APP_CONFIG.currency}{item.price.toLocaleString('bn-BD')}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {APP_CONFIG.currency}{item.originalPrice.toLocaleString('bn-BD')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls & Total Line */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      aria-label="Remove item"
                      title="আইটেম মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        disabled={item.quantity >= (item.maxStock || 99)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY & CHECKOUT SIDEBAR */}
          <div className="space-y-4">
            {/* Delivery Zone Selector */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#00BFA5]" /> ডেলিভারি এরিয়া নির্বাচন করুন
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryZone('insideDhaka')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryZone === 'insideDhaka'
                      ? 'border-[#00BFA5] bg-[#E0F2F1]/50 text-[#00796B]'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">ঢাকার ভেতরে</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {subtotal >= freeThreshold ? 'ফ্রি' : `৳${APP_CONFIG.deliveryCharges.insideDhaka}`}
                  </p>
                </button>

                <button
                  onClick={() => setDeliveryZone('outsideDhaka')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryZone === 'outsideDhaka'
                      ? 'border-[#00BFA5] bg-[#E0F2F1]/50 text-[#00796B]'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">ঢাকার বাইরে</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {subtotal >= freeThreshold ? 'ফ্রি' : `৳${APP_CONFIG.deliveryCharges.outsideDhaka}`}
                  </p>
                </button>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#00BFA5]" /> কুপন কোড
              </h3>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-800 uppercase">{appliedCoupon.code}</span>
                      <span className="text-emerald-600 block text-[11px]">ছাড় প্রয়োগ হয়েছে</span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    aria-label="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="কুপন কোড লিখুন..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00BFA5] text-white rounded-xl font-bold text-xs hover:bg-[#00A892] shadow-xs cursor-pointer"
                  >
                    প্রয়োগ
                  </button>
                </form>
              )}

              {/* Sample Coupons Suggestion */}
              {!appliedCoupon && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 mb-1.5">উপলব্ধ কুপন সমূহ:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_COUPONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleApplyPresetCoupon(c.code)}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900">
                  অর্ডার হিসাব বিবরণী
                </h3>
                <span className="text-xs font-bold text-[#00BFA5] bg-teal-50 px-2.5 py-0.5 rounded-full">
                  সিলেক্টেড: {selectedItems.length}টি
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>সাবটোটাল ({selectedItemsQuantityCount}টি আইটেম)</span>
                  <span className="font-semibold text-slate-900">
                    {APP_CONFIG.currency}{subtotal.toLocaleString('bn-BD')}
                  </span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>বিশেষ পণ্যে সাশ্রয়</span>
                    <span className="font-semibold">
                      -{APP_CONFIG.currency}{savings.toLocaleString('bn-BD')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-semibold text-slate-900">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-600 font-bold">ফ্রি</span>
                    ) : (
                      `${APP_CONFIG.currency}${deliveryCharge.toLocaleString('bn-BD')}`
                    )}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>কুপন ডিসকাউন্ট</span>
                    <span className="font-semibold">
                      -{APP_CONFIG.currency}{couponDiscount.toLocaleString('bn-BD')}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">সর্বমোট মূল্য</span>
                  <span className="font-extrabold text-lg text-[#00BFA5]">
                    {APP_CONFIG.currency}{grandTotal.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* Desktop Checkout Button */}
              <button
                disabled={selectedItems.length === 0}
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#00BFA5] hover:bg-[#00A892] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-md shadow-[#00BFA5]/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>সিলেক্টেড চেকআউট করুন ({selectedItems.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                disabled={selectedItems.length === 0}
                onClick={handleWhatsAppCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>হোয়াটসঅ্যাপে অর্ডার করুন</span>
                <span className="text-xl"></span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00BFA5]" />
                <span>১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CHECKOUT BAR (DARAZ STYLE) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-3 md:hidden flex flex-col gap-2 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.75rem)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-[#00BFA5] accent-[#00BFA5] cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-700">সব ({selectedItems.length})</span>
          </label>

          <div className="text-right flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 block leading-none">সর্বমোট</span>
            <span className="text-sm font-black text-[#00BFA5] truncate block">
              {APP_CONFIG.currency}{grandTotal.toLocaleString('bn-BD')}
            </span>
          </div>

          <button
            disabled={selectedItems.length === 0}
            onClick={handleProceedToCheckout}
            className="py-2.5 px-4 rounded-2xl bg-[#00BFA5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-[#00BFA5]/30 transition-transform cursor-pointer shrink-0"
          >
            <span>চেকআউট ({selectedItems.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          disabled={selectedItems.length === 0}
          onClick={handleWhatsAppCheckout}
          className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-xs transition-transform cursor-pointer"
        >
          <span>হোয়াটসঅ্যাপে অর্ডার ({selectedItems.length})</span>
          <span className="text-base"></span>
        </button>
      </div>
    </div>
  );
};
