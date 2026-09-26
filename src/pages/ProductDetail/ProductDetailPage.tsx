/**
 * BD SHOPS — Master Product Details Page (Daraz & Bangladeshi E-commerce Style)
 * Full Interactive Gallery, Live Size/Color Variant Selectors, Live Delivery Calculator,
 * Direct 1-Click Fast Order Form on Page, Sticky Mobile Dock & Customer Reviews
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Plus,
  Minus,
  Check,
  ChevronRight,
  MessageSquare,
  Share2,
  Sparkles,
  Send,
  MapPin,
  Clock,
  Phone,
  User,
  Loader2,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProductBySlug, fetchRelatedProducts } from '../../services/products';
import { createOrderInFirestore } from '../../services/orders';
import { validateCouponCode } from '../../services/coupons';
import { ProductCard } from '../../components/product/ProductCard';
import { useCartStore, DeliveryZone } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductReview } from '../../types';
import { APP_CONFIG, BD_DISTRICTS } from '../../constants';
import { getProductWhatsAppLink, getCheckoutWhatsAppLink } from '../../utils/whatsapp';
import { useSettings } from '../../context/SettingsContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCartStore();
  const { currentUser, userProfile } = useAuth();
  const { settings } = useSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Selection states
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Direct Order Form on Page
  const [orderName, setOrderName] = useState(userProfile?.displayName || '');
  const [orderPhone, setOrderPhone] = useState(
    userProfile?.phoneNumber || (userProfile as any)?.phone || ''
  );
  const [orderDistrict, setOrderDistrict] = useState('ঢাকা');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderDeliveryZone, setOrderDeliveryZone] = useState<DeliveryZone>('insideDhaka');
  const [isSubmittingDirectOrder, setIsSubmittingDirectOrder] = useState(false);
  const directOrderRef = useRef<HTMLDivElement>(null);

  // Direct order coupon states
  const [directCouponCode, setDirectCouponCode] = useState('');
  const [directCouponDiscount, setDirectCouponDiscount] = useState(0);
  const [appliedDirectCoupon, setAppliedDirectCoupon] = useState<any>(null);
  const [checkingDirectCoupon, setCheckingDirectCoupon] = useState(false);

  // Customer Reviews state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewerName, setReviewerName] = useState(userProfile?.displayName || '');
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([
    {
      id: 'rev_1',
      productId: 'prod_1',
      userId: 'u1',
      userName: 'তানভীর আহমেদ',
      rating: 5,
      comment: 'পণ্যের কোয়ালিটি দারুন! ছবির সাথে হুবহু মিল পেয়েছি। প্যাকেজিং ও ফিনিশিং ছিল দুর্দান্ত।',
      createdAt: '৩ দিন আগে',
    },
    {
      id: 'rev_2',
      productId: 'prod_1',
      userId: 'u2',
      userName: 'মো: আব্দুল্লাহ',
      rating: 5,
      comment: 'ঢাকার ভেতরে মাত্র ২৪ ঘণ্টার মধ্যে ডেলিভারি পেয়েছি। সাইজ একদম পারফেক্ট। ধন্যবাদ BD SHOPS!',
      createdAt: '১ সপ্তাহ আগে',
    },
    {
      id: 'rev_3',
      productId: 'prod_1',
      userId: 'u3',
      userName: 'রাকিবুল হাসান',
      rating: 4,
      comment: 'খুবই আরামদায়ক ও প্রিমিয়াম প্রোডাক্ট। ক্যাশ অন ডেলিভারিতে চেক করে নিতে পেরেছি।',
      createdAt: '২ সপ্তাহ আগে',
    },
  ]);

  useEffect(() => {
    const loadProductData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const found = await fetchProductBySlug(slug);
        setProduct(found);
        if (found) {
          if (found.sizes && found.sizes.length > 0) setSelectedSize(found.sizes[0]);
          if (found.colors && found.colors.length > 0) setSelectedColor(found.colors[0]);

          const related = await fetchRelatedProducts(found.categoryId, found.id);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [slug]);

  // Autofill user details for direct order form
  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName && !orderName) setOrderName(userProfile.displayName);
      if (userProfile.phoneNumber && !orderPhone) setOrderPhone(userProfile.phoneNumber);
      const userAddresses = userProfile.addresses || (userProfile as any).savedAddresses || [];
      if (userAddresses.length > 0 && !orderAddress) {
        const defaultAddr = userAddresses.find((a: any) => a.isDefault) || userAddresses[0];
        setOrderAddress(defaultAddr.streetAddress || defaultAddr.address || '');
        if (defaultAddr.district) {
          setOrderDistrict(defaultAddr.district);
          setOrderDeliveryZone(defaultAddr.district === 'ঢাকা' ? 'insideDhaka' : 'outsideDhaka');
        }
      }
    }
  }, [userProfile, orderName, orderPhone, orderAddress]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 aspect-4/5 rounded-3xl bg-slate-100 animate-pulse" />
          <div className="lg:col-span-4 space-y-4">
            <div className="h-6 w-1/3 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 w-4/5 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-8 w-1/4 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-3 h-64 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          পণ্যটি খুঁজে পাওয়া যায়নি!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          হয়তো পণ্যটি স্টক আউট হয়েছে বা লিংকটি পরিবর্তিত হয়েছে।
        </p>
        <Link
          to="/products"
          className="px-6 py-3 rounded-2xl bg-[#00BFA5] text-white font-bold text-sm shadow-md shadow-[#00BFA5]/25 hover:bg-[#00A892] transition-colors"
        >
          সব পণ্য দেখুন
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : product.discountPercent || 0;

  const savingsAmount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice - product.price
      : 0;

  // Delivery calculation for direct order
  const deliveryFee =
    orderDeliveryZone === 'insideDhaka'
      ? (settings?.features?.insideDhakaCharge ?? APP_CONFIG.deliveryCharges.insideDhaka)
      : (settings?.features?.outsideDhakaCharge ?? APP_CONFIG.deliveryCharges.outsideDhaka);

  const itemTotal = product.price * quantity;
  
  // Handle free delivery threshold
  const isFreeDelivery = settings?.features?.freeDeliveryEnabled && 
    itemTotal >= (settings?.features?.freeDeliveryThreshold ?? APP_CONFIG.deliveryCharges.freeDeliveryThreshold);
  
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const directGrandTotal = Math.max(0, itemTotal + finalDeliveryFee - directCouponDiscount);

  const handleApplyDirectCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCouponCode.trim()) {
      toast.error('দয়া করে একটি কুপন কোড প্রবেশ করান');
      return;
    }

    setCheckingDirectCoupon(true);
    try {
      const res = await validateCouponCode(directCouponCode, itemTotal);
      if (res.isValid && res.coupon && res.discountAmount !== undefined) {
        setAppliedDirectCoupon(res.coupon);
        setDirectCouponDiscount(res.discountAmount);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('কুপন যাচাইকরণ ব্যর্থ হয়েছে');
    } finally {
      setCheckingDirectCoupon(false);
    }
  };

  const handleRemoveDirectCoupon = () => {
    setAppliedDirectCoupon(null);
    setDirectCouponDiscount(0);
    setDirectCouponCode('');
    toast.success('কুপন কোড বাতিল করা হয়েছে');
  };

  const handleAddToCart = () => {
    const chosenImage = images[activeImageIndex] || product.image;
    addToCart(product, quantity, undefined, selectedSize, selectedColor, chosenImage);
    toast.success(`${product.name} (ছবি-${activeImageIndex + 1}) কার্টে যোগ করা হয়েছে!`);
  };

  const handleBuyNow = () => {
    const chosenImage = images[activeImageIndex] || product.image;
    // Scroll smoothly to the Direct 1-Click Order Form on the page
    if (settings?.features?.quickOrderEnabled && directOrderRef.current) {
      directOrderRef.current.scrollIntoView({ behavior: 'smooth' });
      // Add a subtle flash animation to the direct order box
      directOrderRef.current.classList.add('ring-4', 'ring-[#00BFA5]');
      setTimeout(() => {
        directOrderRef.current?.classList.remove('ring-4', 'ring-[#00BFA5]');
      }, 1500);
    } else {
      addToCart(product, quantity, undefined, selectedSize, selectedColor, chosenImage);
      navigate('/checkout');
    }
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: `${product.name} — BD SHOPS`,
      text: `${product.name} মাত্র ৳${product.price} এ অর্ডার করুন!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('প্রডাক্ট লিংক কপি করা হয়েছে!');
      } catch {
        toast.error('লিংক কপি করা সম্ভব হয়নি');
      }
    }
  };

  // Direct 1-Click Order Placement
  const handleDirectOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderName.trim()) {
      toast.error('দয়া করে আপনার পূর্ণ নাম লিখুন');
      return;
    }

    const cleanPhone = orderPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)');
      return;
    }

    if (!orderAddress.trim()) {
      toast.error('আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন');
      return;
    }

    setIsSubmittingDirectOrder(true);
    try {
      const newOrder = await createOrderInFirestore({
        userId: currentUser?.uid || 'guest',
        customerName: orderName.trim(),
        customerPhone: orderPhone.trim(),
        customerEmail: currentUser?.email || '',
        items: [
          {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: images[activeImageIndex] || product.image,
            selectedImage: images[activeImageIndex] || product.image,
            price: product.price,
            quantity: quantity,
            selectedSize: selectedSize || null,
            selectedColor: selectedColor || null,
          },
        ],
        customerInfo: {
          fullName: orderName.trim(),
          phone: orderPhone.trim(),
          email: currentUser?.email || '',
        },
        shippingAddress: {
          id: 'addr_' + Date.now(),
          fullName: orderName.trim(),
          phone: orderPhone.trim(),
          district: orderDistrict,
          city: orderDistrict,
          streetAddress: orderAddress.trim(),
          address: orderAddress.trim(),
          deliveryZone: orderDeliveryZone,
          isDefault: true,
        },
        subtotal: itemTotal,
        deliveryCharge: deliveryFee,
        discount: directCouponDiscount,
        couponDiscount: directCouponDiscount,
        couponCode: appliedDirectCoupon?.code || '',
        total: directGrandTotal,
        grandTotal: directGrandTotal,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        notes: `সরাসরি প্রোডাক্ট পেজ থেকে অর্ডার। সাইজ: ${selectedSize || 'N/A'}, কালার: ${selectedColor || 'N/A'}`,
      });

      toast.success('আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!');
      navigate(`/checkout/success/${newOrder.id}`, { state: { order: newOrder } });
    } catch (err) {
      console.error('Direct order placement error:', err);
      toast.error('অর্ডার প্লেস করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingDirectOrder(false);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !newComment.trim()) {
      toast.error('দয়া করে আপনার নাম ও রিভিউ লিখুন');
      return;
    }

    const review: ProductReview = {
      id: `rev_${Date.now()}`,
      productId: product.id,
      userId: 'customer',
      userName: reviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      createdAt: 'আজকে',
    };

    setReviewsList([review, ...reviewsList]);
    setNewComment('');
    setNewRating(5);
    toast.success('আপনার মূল্যবান রিভিউ সফলভাবে যুক্ত হয়েছে!');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-16 pt-3 sm:pt-5">
      <Helmet>
        <title>{`${product.name} — BD SHOPS`}</title>
        <meta name="description" content={product.description?.slice(0, 150)} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Breadcrumb Bar */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 sm:mb-5 overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link to="/" className="hover:text-[#00BFA5]">হোম</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/products" className="hover:text-[#00BFA5]">পণ্যসমূহ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {product.categoryName && (
            <>
              <Link to={`/category/${product.categoryId}`} className="hover:text-[#00BFA5]">
                {product.categoryName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="text-slate-800 font-bold truncate">{product.name}</span>
        </nav>

        {/* DARAZ-STYLE 3-COLUMN PRODUCT HERO LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 1. LEFT: INTERACTIVE IMAGE GALLERY (5 COLS) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
              {/* Main Image Stage */}
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group shadow-inner">
                <img
                  src={images[activeImageIndex] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-black text-xs shadow-md">
                      -{discountPercent}% ছাড়
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="px-2.5 py-1 rounded-xl bg-[#00796B] text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      ফিচার্ড
                    </span>
                  )}
                </div>

                {/* Wishlist & Share Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                      isInWishlist(product.id)
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleShareProduct}
                    className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white text-slate-700 hover:text-[#00BFA5] flex items-center justify-center shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                    aria-label="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#00BFA5] ring-2 ring-[#00BFA5]/20 scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Video Showcase */}
              {product.videoUrl && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    পণ্যের ভিডিও রিভিউ (Product Video)
                  </p>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black">
                    {product.videoUrl.includes('youtube') || product.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={
                          product.videoUrl.includes('embed')
                            ? product.videoUrl
                            : `https://www.youtube.com/embed/${
                                product.videoUrl.split('v=')[1]?.split('&')[0] || product.videoUrl.split('youtu.be/')[1]
                              }`
                        }
                        title="Product Video"
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <video src={product.videoUrl} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. MIDDLE: PRODUCT INFO, SELECTION & DARAZ PRICE (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              {/* Category, Brand & Stock */}
              <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#00796B] bg-teal-50 px-2.5 py-1 rounded-xl">
                    {product.categoryName || 'প্রিমিয়াম কালেকশন'}
                  </span>
                  {product.brand && (
                    <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded-xl text-[11px] font-bold">
                      ব্র্যান্ড: {product.brand}
                    </span>
                  )}
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  স্টকে আছে ({product.stock || 25}টি উপলব্ধ)
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
                {product.name}
              </h1>

              {/* SKU & Barcode */}
              {(product.sku || product.barcode) && (
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                  {product.sku && <span>SKU: <strong className="text-slate-600">{product.sku}</strong></span>}
                  {product.barcode && <span>বারকোড: <strong className="text-slate-600">{product.barcode}</strong></span>}
                </div>
              )}

              {/* Rating & Review Counter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {(product.rating || 5).toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">|</span>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-semibold text-[#00796B] hover:underline cursor-pointer"
                >
                  {reviewsList.length} টি রিভিউ
                </button>
              </div>

              {/* Price Box */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-[#00796B]">
                  ৳{product.price.toLocaleString('bn-BD')}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <>
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-semibold">
                      ৳{product.compareAtPrice.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[11px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                      ৳{savingsAmount.toLocaleString('bn-BD')} সাশ্রয়
                    </span>
                  </>
                )}
              </div>

              {/* Estimated Delivery Time Box */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Truck className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                  <span>আনুমানিক ডেলিভারি সময়:</span>
                </div>
                <span className="font-black text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-xl border border-amber-300">
                  🚚 {product.deliveryDays || product.estimatedDeliveryTime || '২-৩ দিন'}
                </span>
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>কালার নির্বাচন:</span>
                    <span className="text-[#00796B] font-extrabold">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((clr) => (
                      <button
                        key={clr}
                        onClick={() => setSelectedColor(clr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedColor === clr
                            ? 'bg-slate-900 text-white ring-2 ring-slate-900/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>সাইজ নির্বাচন:</span>
                    <span className="text-[#00796B] font-extrabold">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-[#00BFA5] text-white ring-2 ring-[#00BFA5]/30'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Counter */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">পরিমাণ:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 20, quantity + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 text-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    মোট: ৳{(product.price * quantity).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddToCart}
                    className="py-3 px-3 rounded-2xl border-2 border-[#00BFA5] text-[#00796B] font-extrabold text-xs sm:text-sm hover:bg-teal-50 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>কার্টে রাখুন</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="py-3 px-3 rounded-2xl bg-[#00BFA5] hover:bg-[#00A892] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#00BFA5]/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>এখনই কিনুন</span>
                  </button>
                </div>

                <a
                  href={getProductWhatsAppLink(
                    product,
                    selectedSize,
                    selectedColor,
                    quantity,
                    window.location.href
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>হোয়াটসঅ্যাপে দ্রুত অর্ডার করুন</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. RIGHT: DARAZ-STYLE DELIVERY & SERVICE BOX (3 COLS) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                ডেলিভারি ও সেবা
              </h3>

              {/* Delivery info */}
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#00BFA5] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">হোম ডেলিভারি</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ঢাকার ভেতরে: ৬০৳ (২৪-৪৮ ঘণ্টা)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ঢাকার বাইরে: ১২০৳ (৪৮-৭২ ঘণ্টা)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">ক্যাশ অন ডেলিভারি</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      পণ্য হাতে পেয়ে চেক করে টাকা দেওয়ার সুবিধা।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">৭ দিনের রিটার্ন পলিসি</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ত্রুটিপূর্ণ পণ্যে ১০০% ইনস্ট্যান্ট পরিবর্তন বা রিফান্ড।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">১০০% আসল পণ্য</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      BD SHOPS এর প্রিমিয়াম অথেনটিক গ্যারান্টি।
                    </p>
                  </div>
                </div>
              </div>

              {/* Support helpline callout */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-500">যেকোনো তথ্যের জন্য কল করুন:</p>
                <a
                  href={`tel:${APP_CONFIG.supportPhone}`}
                  className="font-extrabold text-xs text-[#00796B] hover:underline block mt-0.5"
                >
                  {APP_CONFIG.supportPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 1-CLICK FAST DIRECT ORDER FORM ON PRODUCT PAGE */}
        {settings?.features?.quickOrderEnabled && (
          <div
            ref={directOrderRef}
            className="mt-8 bg-white rounded-3xl p-5 sm:p-8 border-2 border-teal-500/30 shadow-md transition-all space-y-6"
          >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#00796B] text-xs font-bold mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>দ্রুত ১-ক্লিক ক্যাশ অন ডেলিভারি অর্ডার</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                পণ্যটি সরাসরি অর্ডার করতে নিচের তথ্যগুলো পূরণ করুন
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">সর্বমোট প্রদেয়:</span>
              <p className="text-lg sm:text-2xl font-black text-[#00796B]">
                ৳{directGrandTotal.toLocaleString('bn-BD')}
              </p>
            </div>
          </div>

          <form onSubmit={handleDirectOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={orderName}
                    onChange={(e) => setOrderName(e.target.value)}
                    placeholder="যেমন: মোঃ আব্দুল্লাহ"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Zone / District */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জেলা নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={orderDistrict}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOrderDistrict(val);
                    setOrderDeliveryZone(val === 'ঢাকা' ? 'insideDhaka' : 'outsideDhaka');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white cursor-pointer"
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 'ঢাকা' 
                        ? `(ঢাকার ভেতরে - ${settings.features?.insideDhakaCharge ?? 60}৳ ডেলিভারি)` 
                        : `(ঢাকার বাইরে - ${settings.features?.outsideDhakaCharge ?? 120}৳ ডেলিভারি)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="রোড, বাড়ি নং, থানা বা এলাকার নাম বিস্তারিত লিখুন"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                />
              </div>
            </div>

            {/* Quick Order Coupon Field */}
            <div className="p-3.5 bg-teal-50/40 border border-teal-200/50 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00BFA5]" />
                <span>ডিসকাউন্ট কুপন কোড (যদি থাকে)</span>
              </label>
              
              {!appliedDirectCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directCouponCode}
                    onChange={(e) => setDirectCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="কুপন কোড লিখুন (যেমন: SAVE500)"
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDirectCoupon}
                    disabled={checkingDirectCoupon}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    {checkingDirectCoupon ? 'যাচাই...' : 'প্রয়োগ করুন'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs animate-in fade-in">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    কোড: {appliedDirectCoupon.code} (-৳{directCouponDiscount})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveDirectCoupon}
                    className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    বাতিল করুন
                  </button>
                </div>
              )}
            </div>

            {/* Selected Summary Details */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600">অর্ডার করা পণ্য:</span>
                <span className="font-bold text-slate-900">{product.name}</span>
                {selectedSize && <span className="text-[#00796B]">({selectedSize})</span>}
                {selectedColor && <span className="text-[#00796B]">({selectedColor})</span>}
                <span className="text-slate-500 font-semibold">× {quantity}টি</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-slate-600">
                  ডেলিভারি চার্জ: <b>৳{deliveryFee}</b>
                </span>
                {directCouponDiscount > 0 && (
                  <span className="text-emerald-700 font-bold">
                    ডিসকাউন্ট: <b>-৳{directCouponDiscount}</b>
                  </span>
                )}
                <span className="text-slate-900 font-extrabold">
                  সর্বমোট: <span className="text-[#00796B]">৳{directGrandTotal.toLocaleString('bn-BD')}</span>
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingDirectOrder}
                className="w-full py-4 px-6 bg-[#00BFA5] hover:bg-[#00A892] disabled:opacity-60 text-white rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#00BFA5]/30 active:scale-98 transition-all cursor-pointer"
              >
                {isSubmittingDirectOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি - ৳{directGrandTotal.toLocaleString('bn-BD')})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* TABS: DESCRIPTION, SPECS & CUSTOMER REVIEWS */}
        <div className="mt-8 bg-white rounded-3xl p-4 sm:p-8 shadow-xs border border-slate-100">
          <div className="flex border-b border-slate-100 gap-6">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 text-sm font-extrabold transition-colors relative cursor-pointer ${
                activeTab === 'desc' ? 'text-[#00796B]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              পণ্যের বিবরণ
              {activeTab === 'desc' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-extrabold transition-colors relative cursor-pointer ${
                activeTab === 'specs' ? 'text-[#00796B]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              স্পেসিফিকেশন
              {activeTab === 'specs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-extrabold transition-colors relative cursor-pointer ${
                activeTab === 'reviews' ? 'text-[#00796B]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              কাস্টমার রিভিউ ({reviewsList.length})
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00796B] rounded-full" />
              )}
            </button>
          </div>

          <div className="pt-6">
            {activeTab === 'desc' && (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'এই পণ্যের জন্য বিস্তারিত বিবরণ শীঘ্রই যুক্ত করা হবে।'}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {product.brand && (
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-500 font-semibold">ব্র্যান্ড:</span>
                    <span className="font-bold text-slate-800">{product.brand}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-500 font-semibold">SKU কোড:</span>
                    <span className="font-bold text-slate-800">{product.sku}</span>
                  </div>
                )}
                {product.specifications &&
                  Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-500 font-semibold">{key}:</span>
                      <span className="font-bold text-slate-800">{val}</span>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Submit New Review Form */}
                <form onSubmit={handleAddReview} className="p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">আপনার মতামত বা রিভিউ লিখুন</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">রেটিং নির্বাচন করুন:</span>
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setNewRating(num)}
                          className="p-1 cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              num <= newRating ? 'fill-current text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="পণ্যটি আপনার কেমন লেগেছে? কাপড়ের মান, প্যাকেজিং ও ডেলিভারি নিয়ে বিস্তারিত লিখুন..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#00BFA5] hover:bg-[#00A892] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>রিভিউ পোস্ট করুন</span>
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-[#00796B] font-bold text-xs flex items-center justify-center">
                            {rev.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{rev.userName}</p>
                            <p className="text-[10px] text-slate-400">{rev.createdAt}</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-current' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 space-y-5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              সম্পর্কিত আরও আকর্ষণীয় পণ্য
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STICKY MOBILE BOTTOM ACTION DOCK */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-3 border-t border-slate-200 shadow-2xl z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product)}
            className={`p-3 rounded-2xl border border-slate-200 transition-colors ${
              isInWishlist(product.id) ? 'bg-rose-50 text-rose-500 border-rose-200' : 'text-slate-600'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-3 rounded-2xl bg-teal-50 border border-[#00BFA5] text-[#00796B] font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>কার্ট</span>
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#00BFA5] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#00BFA5]/20 active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
