/**
 * BD SHOPS — Master Checkout Page
 * Mobile-First Bangladeshi Checkout with COD, Online Payment Gateway Redirection, WhatsApp 1-Click Order
 * Supports Selective Checkout from Cart (Daraz-Style)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck,
  Truck,
  Check,
  ChevronLeft,
  Banknote,
  MapPin,
  User as UserIcon,
  Phone,
  Loader2,
  Sparkles,
  Plus,
  Home,
  Briefcase,
  CreditCard,
  ArrowRight,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import { createOrderInFirestore } from '../../services/orders';
import { validateCouponCode } from '../../services/coupons';
import { createNotificationInFirestore } from '../../services/notifications';
import { useSettings } from '../../context/SettingsContext';
import { OnlinePaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../../services/settings';
import { PaymentMethod, CartItem } from '../../types';
import { APP_CONFIG } from '../../constants';
import { BD_ALL_DISTRICTS, getUpazilasForDistrict } from '../../constants/bangladeshData';
import { getCheckoutWhatsAppLink } from '../../utils/whatsapp';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items: allCartItems,
    appliedCoupon,
    deliveryZone,
    setDeliveryZone,
    removeItemsFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const { currentUser, userProfile } = useAuth();
  const { settings } = useSettings();

  // Selected item IDs passed from CartPage state
  const selectedCartItemIds: string[] | undefined = (location.state as any)?.selectedCartItemIds;

  // Filter items: if specific items were selected in Cart, only check those out; otherwise checkout all
  const items: CartItem[] = React.useMemo(() => {
    if (selectedCartItemIds && selectedCartItemIds.length > 0) {
      const filtered = allCartItems.filter((i) => selectedCartItemIds.includes(i.cartItemId));
      return filtered.length > 0 ? filtered : allCartItems;
    }
    return allCartItems;
  }, [allCartItems, selectedCartItemIds]);

  // Form states
  const [fullName, setFullName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(
    userProfile?.phoneNumber || (userProfile as any)?.phone || ''
  );
  const [email, setEmail] = useState(currentUser?.email || userProfile?.email || '');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('উত্তরা (Uttara)');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [paymentSettings, setPaymentSettings] = useState<OnlinePaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderSubmittedRef = useRef(false);

  // Load online payment & COD settings from settings context
  useEffect(() => {
    if (settings.payments) {
      setPaymentSettings(settings.payments);
      if (!settings.payments.isCodEnabled && settings.payments.isOnlinePaymentEnabled) {
        setPaymentMethod('online_payment');
      }
    }
  }, [settings.payments]);

  // Redirect if cart / selected items are empty (only if an order was not just submitted)
  useEffect(() => {
    if (items.length === 0 && !isSubmitting && !orderSubmittedRef.current) {
      navigate('/cart');
    }
  }, [items.length, isSubmitting, navigate]);

  // Autofill user profile data & saved address if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName && !fullName) {
        setFullName(userProfile.displayName);
      }
      if (userProfile.phoneNumber && !phone) {
        setPhone(userProfile.phoneNumber);
      }

      // Check saved addresses
      const userAddresses = userProfile.addresses || (userProfile as any).savedAddresses || [];
      if (userAddresses.length > 0 && !address) {
        const defaultAddr = userAddresses.find((a: any) => a.isDefault) || userAddresses[0];
        setAddress(defaultAddr.streetAddress || defaultAddr.address || '');
        if (defaultAddr.fullName) setFullName(defaultAddr.fullName);
        if (defaultAddr.phone) setPhone(defaultAddr.phone);
        if (defaultAddr.upazilaOrArea || defaultAddr.city) {
          setUpazila(defaultAddr.upazilaOrArea || defaultAddr.city);
        }
        if (defaultAddr.district) {
          setDistrict(defaultAddr.district);
          if (defaultAddr.district === 'ঢাকা') {
            setDeliveryZone('insideDhaka');
          } else {
            setDeliveryZone('outsideDhaka');
          }
        }
      }
    }
  }, [userProfile, setDeliveryZone]);

  // Auto detect delivery zone when district changes
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDistrict(val);
    if (val === 'ঢাকা') {
      setDeliveryZone('insideDhaka');
    } else {
      setDeliveryZone('outsideDhaka');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.error('দয়া করে একটি কুপন কোড প্রবেশ করান');
      return;
    }

    setCheckingCoupon(true);
    try {
      const res = await validateCouponCode(couponInput, subtotal);
      if (res.isValid && res.coupon) {
        applyCoupon(res.coupon);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('কুপন যাচাইকরণ ব্যর্থ হয়েছে');
    } finally {
      setCheckingCoupon(false);
    }
  };

  // Precise calculations based on current checkout items
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const features = settings.features;
  const freeThreshold = features?.freeDeliveryThreshold ?? APP_CONFIG.deliveryCharges.freeDeliveryThreshold;
  const freeEnabled = features?.freeDeliveryEnabled ?? true;
  
  const deliveryCharge =
    items.length === 0
      ? 0
      : (freeEnabled && subtotal >= freeThreshold)
      ? 0
      : deliveryZone === 'insideDhaka'
      ? (features?.insideDhakaCharge ?? APP_CONFIG.deliveryCharges.insideDhaka)
      : (features?.outsideDhakaCharge ?? APP_CONFIG.deliveryCharges.outsideDhaka);

  const calculateCouponDiscount = () => {
    if (!appliedCoupon || items.length === 0) return 0;
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

  // Tax calculation
  const taxSettings = settings.taxSettings;
  const taxRate = taxSettings?.enabled ? (taxSettings.taxRatePercentage || 0) : 0;
  const isTaxInclusive = taxSettings?.isInclusive ?? true;
  const taxAmount = (!isTaxInclusive && taxRate > 0) ? Math.round((subtotal * taxRate) / 100) : 0;

  const grandTotal = Math.max(0, subtotal + deliveryCharge + taxAmount - couponDiscount);
  const currencySymbol = settings.currencySymbol || APP_CONFIG.currency;

  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error('দয়া করে আপনার পুরো নাম লিখুন');
      return false;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return false;
    }

    if (!address.trim()) {
      toast.error('পণ্য ডেলিভারির সম্পূর্ণ ঠিকানা লিখুন');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    orderSubmittedRef.current = true;
    try {
      const isOnline = paymentMethod === 'online_payment' || paymentMethod === 'bkash' || paymentMethod === 'nagad';

      const newOrder = await createOrderInFirestore({
        userId: currentUser?.uid || 'guest',
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || '',
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          slug: i.slug,
          image: i.selectedImage || i.image,
          selectedImage: i.selectedImage || i.image,
          price: i.price,
          quantity: i.quantity,
          selectedSize: i.selectedSize || null,
          selectedColor: i.selectedColor || null,
        })),
        customerInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || '',
        },
        shippingAddress: {
          id: 'addr_' + Date.now(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          district,
          city: district,
          streetAddress: address.trim(),
          address: address.trim(),
          deliveryZone,
          isDefault: true,
        },
        subtotal,
        deliveryCharge,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code || '',
        total: grandTotal,
        grandTotal,
        paymentMethod: isOnline ? 'online_payment' : 'cash_on_delivery',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        notes: `${orderNotes.trim()}`,
      });

      // Clear only the ordered items from the cart
      const orderedItemIds = items.map((i) => i.cartItemId);
      if (orderedItemIds.length >= allCartItems.length) {
        clearCart();
      } else {
        removeItemsFromCart(orderedItemIds);
      }

      // If Online Payment is chosen: redirect directly to the dedicated Payment Page
      if (isOnline) {
        toast.success('অর্ডার তৈরি হয়েছে! অনুগ্রহ করে পেমেন্ট সম্পন্ন করুন।');
        navigate(`/payment/${newOrder.id}`, { state: { order: newOrder }, replace: true });
        return;
      }

      // If Cash on Delivery is chosen: direct to Order Success
      createNotificationInFirestore({
        userId: currentUser?.uid || 'all',
        title: 'আপনার অর্ডারটি কনফার্ম হয়েছে! 🛍️',
        message: `অর্ডার আইডি #${newOrder.id.slice(-6).toUpperCase()} সফলভাবে গ্রহণ করা হয়েছে। মোট প্রদেয় ৳${grandTotal.toLocaleString('bn-BD')}`,
        type: 'order',
        link: `/checkout/success/${newOrder.id}`,
      }).catch(console.warn);

      toast.success('আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!');
      navigate(`/checkout/success/${newOrder.id}`, { state: { order: newOrder }, replace: true });
    } catch (error) {
      orderSubmittedRef.current = false;
      console.error('Failed to submit order:', error);
      toast.error('অর্ডার সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. First record order in Firestore so user and store get an order ID
      const newOrder = await createOrderInFirestore({
        userId: currentUser?.uid || 'guest',
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || '',
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          slug: i.slug,
          image: i.selectedImage || i.image,
          selectedImage: i.selectedImage || i.image,
          price: i.price,
          quantity: i.quantity,
          selectedSize: i.selectedSize || null,
          selectedColor: i.selectedColor || null,
        })),
        customerInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || '',
        },
        shippingAddress: {
          id: 'addr_' + Date.now(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          district,
          city: district,
          streetAddress: address.trim(),
          address: address.trim(),
          deliveryZone,
          isDefault: true,
        },
        subtotal,
        deliveryCharge,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code || '',
        total: grandTotal,
        grandTotal,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        notes: `হোয়াটসঅ্যাপ ১-ক্লিক অর্ডার | ${orderNotes.trim()}`,
      });

      // Clear only ordered items from the cart
      const orderedItemIds = items.map((i) => i.cartItemId);
      if (orderedItemIds.length >= allCartItems.length) {
        clearCart();
      } else {
        removeItemsFromCart(orderedItemIds);
      }

      // 2. Format WhatsApp direct chat payload
      const waLink = getCheckoutWhatsAppLink({
        items,
        subtotal,
        deliveryCharge,
        discount: couponDiscount,
        grandTotal,
        customerName: fullName.trim(),
        phone: phone.trim(),
        district,
        address: address.trim(),
        notes: `অর্ডার আইডি #${newOrder.id.slice(-6).toUpperCase()}`,
      });

      toast.success('অর্ডার তৈরি হয়েছে! হোয়াটসঅ্যাপে রিডাইরেক্ট করা হচ্ছে...');
      window.location.href = waLink;
    } catch (error) {
      console.error('Failed to submit WhatsApp order:', error);
      toast.error('হোয়াটসঅ্যাপে অর্ডার পাঠাতে সমস্যা হয়েছে। সাধারণ অর্ডারে চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUpazilas = getUpazilasForDistrict(district);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10">
      <Helmet>
        <title>নিরাপদ চেকআউট — BD SHOPS</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Back to Cart */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#00BFA5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> কার্টে ফিরে যান
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            <span>SSL সিকিউরড চেকআউট</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          {/* STEP 1: DELIVERY ZONE SELECTION */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Truck className="w-4 h-4 text-[#00BFA5]" />
              ১. ডেলিভারি এলাকা নির্বাচন করুন
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setDeliveryZone('insideDhaka')}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  deliveryZone === 'insideDhaka'
                    ? 'border-[#00BFA5] bg-teal-50/50 ring-2 ring-[#00BFA5]/20 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs font-extrabold text-slate-900">ঢাকার ভেতরে</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">২-৩ কার্যদিবসের মধ্যে ডেলিভারি</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#00796B]">
                    {deliveryCharge === 0 ? 'ফ্রি' : `৳${features?.insideDhakaCharge ?? APP_CONFIG.deliveryCharges.insideDhaka}`}
                  </span>
                  {deliveryZone === 'insideDhaka' && (
                    <Check className="w-4 h-4 text-[#00BFA5] inline-block ml-1" />
                  )}
                </div>
              </label>

              <label
                onClick={() => setDeliveryZone('outsideDhaka')}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  deliveryZone === 'outsideDhaka'
                    ? 'border-[#00BFA5] bg-teal-50/50 ring-2 ring-[#00BFA5]/20 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="text-xs font-extrabold text-slate-900">ঢাকার বাইরে</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">৩-৫ কার্যদিবসের মধ্যে ডেলিভারি</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#00796B]">
                    {deliveryCharge === 0 ? 'ফ্রি' : `৳${features?.outsideDhakaCharge ?? APP_CONFIG.deliveryCharges.outsideDhaka}`}
                  </span>
                  {deliveryZone === 'outsideDhaka' && (
                    <Check className="w-4 h-4 text-[#00BFA5] inline-block ml-1" />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* STEP 2: CUSTOMER CONTACT & SHIPPING ADDRESS */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#00BFA5]" />
                ২. আপনার নাম ও ডেলিভারি ঠিকানা
              </h2>
              {userProfile && (
                <Link
                  to="/account/profile?tab=addresses"
                  target="_blank"
                  className="text-[11px] font-bold text-[#00796B] hover:text-[#00BFA5] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন এড্রেস যোগ করুন</span>
                </Link>
              )}
            </div>

            {/* SAVED ADDRESSES QUICK SELECTION CARDS */}
            {userProfile && (userProfile.addresses?.length || 0) > 0 && (
              <div className="space-y-2 pb-2 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  সংরক্ষিত ঠিকানা থেকে সিলেক্ট করুন:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userProfile.addresses?.map((addr) => {
                    const isSelected =
                      address.trim() === (addr.streetAddress || addr.address || '').trim();
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setAddress(addr.streetAddress || addr.address || '');
                          if (addr.fullName) setFullName(addr.fullName);
                          if (addr.phone) setPhone(addr.phone);
                          if (addr.upazilaOrArea || addr.city) {
                            setUpazila(addr.upazilaOrArea || addr.city || '');
                          }
                          if (addr.district) {
                            setDistrict(addr.district);
                            if (addr.district === 'ঢাকা') {
                              setDeliveryZone('insideDhaka');
                            } else {
                              setDeliveryZone('outsideDhaka');
                            }
                          }
                          toast.success('ঠিকানা সিলেক্ট করা হয়েছে');
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#00BFA5] bg-teal-50/60 ring-2 ring-[#00BFA5]/20 font-bold'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white text-[#00796B] border border-teal-200">
                            {addr.type === 'office' ? 'অফিস' : 'বাসা'}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#00BFA5]" />}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {addr.fullName || fullName || 'গ্রাহক'}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {addr.streetAddress || addr.address}, {addr.district}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: মোঃ আব্দুল্লাহ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (সচল) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইমেইল এড্রেস (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জেলা <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={handleDistrictChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  >
                    {BD_ALL_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.bnName} ({d.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    থানা / উপজেলা / এলাকা
                  </label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder="যেমন: উত্তরা, মিরপুর বা সদর"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ডেলিভারির সম্পূর্ণ ঠিকানা (বাসা/রোড নম্বর) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="বাড়ি নং, রোড নং, এলাকার নাম ইত্যাদি বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অর্ডার সংক্রান্ত বিশেষ কোনো নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="ডেলিভারিম্যানের জন্য বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD SELECTION (COD & DEDICATED ONLINE PAYMENT) */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#00BFA5]" />
              ৩. পেমেন্ট পদ্ধতি নির্বাচন করুন
            </h2>

            <div className="space-y-3">
              {/* Option 1: Cash on Delivery (COD) */}
              {paymentSettings.isCodEnabled !== false && (
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-[#00BFA5] bg-teal-50/50 ring-2 ring-[#00BFA5]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="mt-1 w-4 h-4 text-[#00BFA5] accent-[#00BFA5]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        ক্যাশ অন ডেলিভারি (Cash on Delivery)
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        জনপ্রিয় ও নিরাপদ
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      কোনো অগ্রিম টাকা দিতে হবে না। ডেলিভারি ম্যানের কাছ থেকে পার্সেল চেক করে বুঝে পেয়ে নগদ টাকা পরিশোধ করুন।
                    </p>
                  </div>
                </label>
              )}

              {/* Option 2: Online Payment System (bKash / Nagad / Rocket / Upay Gateway) */}
              {paymentSettings.isOnlinePaymentEnabled !== false && (
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'online_payment'
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'online_payment'}
                    onChange={() => setPaymentMethod('online_payment')}
                    className="mt-1 w-4 h-4 text-indigo-600 accent-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        অনলাইন পেমেন্ট (বিকাশ / নগদ / রকেট / উপায়)
                      </span>
                      <div className="flex items-center gap-1">
                        {paymentSettings.bkash.enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-100 text-pink-700">bKash</span>
                        )}
                        {paymentSettings.nagad.enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">Nagad</span>
                        )}
                        {paymentSettings.rocket.enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">Rocket</span>
                        )}
                        {paymentSettings.upay.enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Upay</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      অর্ডার করার সাথে সাথে একটি আলাদা সিকিউরড পেমেন্ট পেজ ওপেন হবে। সেখানে বিকাশ/নগদে টাকা পাঠিয়ে TrxID এবং পেমেন্টের স্ক্রিনশট ছবি আপলোড করে ভেরিফাই করতে পারবেন।
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* STEP 4: ORDER SUMMARY & SUBMIT */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>অর্ডার সারাংশ</span>
              <span className="text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
                {items.length}টি পণ্য নির্বাচিত
              </span>
            </h2>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 max-w-[70%]">
                    <img
                      src={item.selectedImage || item.image}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.quantity} × ৳{item.price}
                        {item.selectedSize ? ` | ${item.selectedSize}` : ''}
                        {item.selectedColor ? ` | ${item.selectedColor}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input field */}
            <div className="py-3.5 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00BFA5]" />
                <span>ডিসকাউন্ট কুপন কোড প্রয়োগ করুন</span>
              </label>
              
              {!appliedCoupon ? (
                <div className="space-y-1.5">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="যেমন: SAVE500, EID2026"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#00BFA5] uppercase placeholder:normal-case"
                    />
                    <button
                      type="submit"
                      disabled={checkingCoupon}
                      className="px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                    >
                      {checkingCoupon ? 'যাচাই...' : 'প্রয়োগ'}
                    </button>
                  </form>
                  {couponInput.trim() && (
                    <p className="text-[10px] text-slate-400 font-bold">
                      ✍️ কোডটি প্রয়োগ করতে পাশে ক্লিক করুন (ন্যূনতম কার্ট ভ্যালুর জন্য প্রযোজ্য)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>কুপন কোড: {appliedCoupon.code} (সক্রিয়)</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                    >
                      বাতিল করুন
                    </button>
                  </div>
                  {couponDiscount > 0 ? (
                    <p className="text-[10px] text-emerald-600 font-bold">
                      🎉 অভিনন্দন! আপনি ৳{couponDiscount} ক্যাশ ডিসকাউন্ট পেয়েছেন।
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-bold">
                      ⚠️ কুপনটি কাজ করতে ন্যূনতম অর্ডারের পরিমাণ পূরণ করতে হবে।
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>নির্বাচিত পণ্যের মোট মূল্য:</span>
                <span className="font-bold text-slate-900">৳{subtotal.toLocaleString('bn-BD')}</span>
              </div>

              <div className="flex justify-between">
                <span>
                  ডেলিভারি চার্জ ({deliveryZone === 'insideDhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}):
                </span>
                <span className="font-bold text-slate-900">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold">ফ্রি</span>
                  ) : (
                    `৳${deliveryCharge.toLocaleString('bn-BD')}`
                  )}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>ডিসকাউন্ট ({appliedCoupon?.code}):</span>
                  <span>-৳{couponDiscount.toLocaleString('bn-BD')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-slate-900">সর্বমোট প্রদেয়:</span>
                <span className="font-extrabold text-lg sm:text-xl text-[#00BFA5]">
                  ৳{grandTotal.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#00BFA5] hover:bg-[#00A892] disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#00BFA5]/25 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : paymentMethod === 'online_payment' ? (
                  <>
                    <span>পেমেন্ট পেজে এগিয়ে যান (৳{grandTotal.toLocaleString('bn-BD')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleWhatsAppOrder}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>হোয়াটসঅ্যাপে ১-ক্লিক অর্ডার সম্পন্ন করুন</span>
                <span className="text-xl"></span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#00BFA5]" />
                <span>আপনার তথ্য সম্পূর্ণ সুরক্ষিত থাকবে। ১০০% জেনুইন পণ্য।</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
