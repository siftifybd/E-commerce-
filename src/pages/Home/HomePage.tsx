/**
 * BD SHOPS — Conversion-Focused Bangladeshi E-Commerce Homepage
 * Hero Banners, Trust Badges, Flash Deals with Countdown, Featured Categories & Direct WhatsApp Order
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Flame,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  PhoneCall,
  MessageCircle,
  Award,
  TrendingUp,
} from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';
import { FlashSaleSection } from '../../components/home/FlashSaleSection';
import { HeroSlider } from '../../components/home/HeroSlider';
import { ReviewsSection } from '../../components/home/ReviewsSection';
import {
  fetchProducts,
  fetchCategories,
} from '../../services/products';
import { Product, Category } from '../../types';
import { APP_CONFIG } from '../../constants';

// Hero promotional banners
const HERO_BANNERS = [
  {
    id: 1,
    title: 'প্রিমিয়াম কালেকশন ২০২৫',
    subtitle: 'আরামদায়ক ও রুচিশীল পাঞ্জাবি ও কাবলি সেট',
    badge: 'ঈদ ও স্পেশাল অফার',
    link: '/products?category=punjabi',
    cta: 'কালেকশন দেখুন',
    bgColor: 'from-emerald-950 via-teal-900 to-slate-900',
    accentColor: '#00BFA5',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'খাঁটি আতর ও সুরভিত সুগন্ধি',
    subtitle: '১০০% অ্যালকোহল মুক্ত লং-লাস্টিং অরিজিনাল আতর',
    badge: 'ফ্রি হোম ডেলিভারি',
    link: '/products?category=attar',
    cta: 'এখনই কিনুন',
    bgColor: 'from-slate-950 via-amber-950 to-stone-900',
    accentColor: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'ফ্ল্যাশ সেল — সর্বোচ্চ ৫০% ছাড়!',
    subtitle: 'সীমিত সময়ের স্পেশাল ডিসকাউন্ট অফার চলছে',
    badge: 'হট ডিল',
    link: '/products?flash=true',
    cta: 'অফার লুফে নিন',
    bgColor: 'from-rose-950 via-red-900 to-slate-950',
    accentColor: '#EF4444',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
  },
];

import { useSettings } from '../../context/SettingsContext';

export const HomePage: React.FC = () => {
  const { settings } = useSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setAllProducts(prods);
        setFeaturedProducts(prods.filter((p) => p.isFeatured || p.rating >= 4.5).slice(0, 8));
        setFlashSaleProducts(prods.filter((p) => p.isFlashSale || (p.discountPercentage && p.discountPercentage > 15)).slice(0, 4));
        setNewArrivals(prods.filter((p) => p.isNewArrival).slice(0, 8));
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const siteName = settings.siteName || APP_CONFIG.name;
  const freeThreshold = settings.features?.freeDeliveryThreshold || APP_CONFIG.deliveryCharges.freeDeliveryThreshold;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 space-y-8 sm:space-y-12">
      <Helmet>
        <title>{`${siteName} — বাংলাদেশের বিশ্বস্ত অনলাইন শপিং মল`}</title>
        <meta
          name="description"
          content={`ক্যাশ অন ডেলিভারি, সারা দেশে দ্রুততম হোম ডেলিভারি ও ১০০% অরিজিনাল কোয়ালিটি পণ্য নিয়ে ${siteName} আপনার সেবায় প্রস্তুত।`}
        />
      </Helmet>

      {/* 1. HERO SLIDER */}
      <HeroSlider />

      {/* 2. TRUST BADGES BAR */}
      <section className="max-w-7xl mx-auto px-4 -mt-4 sm:-mt-6 relative z-30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 bg-white rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-[#00BFA5] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">দ্রুততম ডেলিভারি</h4>
              <p className="text-[11px] text-slate-500">২৪ থেকে ৪৮ ঘণ্টার মধ্যে</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">ক্যাশ অন ডেলিভারি</h4>
              <p className="text-[11px] text-slate-500">পণ্য দেখে মূল্য পরিশোধ</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">৭ দিনের সহজ রিটার্ন</h4>
              <p className="text-[11px] text-slate-500">পছন্দ না হলে ফেরত সুবিধা</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">১০০% অরিজিনাল</h4>
              <p className="text-[11px] text-slate-500">সেরা মানের নিশ্চয়তা</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FLASH SALE SECTION */}
      <FlashSaleSection products={flashSaleProducts} loading={loading} />

      {/* 4. FEATURED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00BFA5]" />
              জনপ্রিয় ক্যাটাগরি
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">আপনার পছন্দের পণ্য ক্যাটাগরি অনুযায়ী খুঁজে নিন</p>
          </div>
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-[#00796B] hover:text-[#00BFA5] flex items-center gap-1"
          >
            সকল ক্যাটাগরি <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug || cat.id}`}
              className="group bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#00BFA5] hover:shadow-md transition-all flex flex-col items-center text-center space-y-2.5"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#00BFA5] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {cat.productCount ? `${cat.productCount}+ আইটেম` : 'কালেকশন দেখুন'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. BEST SELLING PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00BFA5]" />
              বেস্ট সেলিং পণ্যসমূহ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">সবচেয়ে বেশি বিক্রিত ও গ্রাহকদের পছন্দের পণ্য</p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#00796B] hover:text-[#00BFA5] flex items-center gap-1"
          >
            সবগুলো দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-2xl aspect-[3/4] animate-pulse" />
            ))
          ) : (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* 6. PROMOTIONAL FREE DELIVERY BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left z-10">
            <span className="px-3.5 py-1 rounded-full bg-[#00BFA5] text-white text-xs font-black uppercase tracking-wider">
              স্পেশাল অফার
            </span>
            <h2 className="text-2xl sm:text-3xl font-black leading-snug">
              ৳{freeThreshold} বা তার বেশি অর্ডারে ফ্রি ডেলিভারি!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              আজই অর্ডার করুন এবং উপভোগ করুন সারা বাংলাদেশে দ্রুততম ফ্রি হোম ডেলিভারি ও ক্যাশ অন ডেলিভারির সুবিধা।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 z-10 shrink-0">
            <Link
              to="/products"
              className="px-6 py-3.5 bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#00BFA5]/30 transition-transform active:scale-95 flex items-center gap-2"
            >
              <span>শপিং শুরু করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={`https://wa.me/${settings.whatsappNumber || APP_CONFIG.whatsappNumber}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি ${siteName} থেকে অর্ডার করতে চাই।`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>হোয়াটসঅ্যাপে অর্ডার</span>
            </a>
          </div>
        </div>
      </section>

      {/* 7. NEW ARRIVALS GRID */}
      <section className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900">
              নতুন কালেকশন (New Arrivals)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">আমাদের স্টকে সদ্য যোগ হওয়া আকর্ষণীয় পণ্যসমূহ</p>
          </div>
          <Link
            to="/products?sort=newest"
            className="text-xs sm:text-sm font-bold text-[#00796B] hover:text-[#00BFA5] flex items-center gap-1"
          >
            নতুন সব দেখুন <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-2xl aspect-[3/4] animate-pulse" />
            ))
          ) : (
            (newArrivals.length > 0 ? newArrivals : featuredProducts.slice(4)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* 8. JUST FOR YOU / ALL PRODUCTS MARKETPLACE GRID (Daraz Style) */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 py-4 border-t border-slate-200">
          <div className="w-12 h-1 px-4 bg-emerald-500 rounded-full mb-2"></div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            আপনার জন্য বিশেষ অফার
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
            Just For You — শপ করুন আপনার পছন্দের সব পণ্য
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse border border-slate-100" />
            ))
          ) : (
            allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        {allProducts.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">বর্তমানে কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        )}
      </section>

      {/* 9. REVIEWS SECTION */}
      <ReviewsSection />

      {/* 10. DIRECT PHONE & WHATSAPP SUPPORT BAR */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2F1] text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs">
              <Headphones className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                অর্ডার করতে সমস্যা হচ্ছে? সরাসরি ফোন করুন
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আমাদের কাস্টমার কেয়ার টিম সকাল ৯টা থেকে রাত ১০টা পর্যন্ত সক্রিয়
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${settings.supportPhone || APP_CONFIG.supportPhone}`}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-xs"
            >
              <PhoneCall className="w-4 h-4 text-[#00BFA5]" />
              <span>{settings.supportPhone || APP_CONFIG.supportPhone}</span>
            </a>

            <a
              href={`https://wa.me/${settings.whatsappNumber || APP_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>হোয়াটসঅ্যাপ চ্যাট</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
