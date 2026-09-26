/**
 * BD SHOPS — Customer Wishlist Page
 * Saved items management, instant Add-to-Cart & stock status badges
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';
import { WishlistItem } from '../../types';
import { APP_CONFIG } from '../../constants';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, moveToCart } = useCartStore();

  const handleMoveToCart = (item: WishlistItem) => {
    moveToCart(item);
    toast.success(`${item.name} কার্টে যোগ করা হয়েছে!`);
  };

  const handleMoveAllToCart = () => {
    wishlist.forEach((item) => {
      moveToCart(item);
    });
    toast.success('সকল পছন্দের পণ্য কার্টে যোগ করা হয়েছে!');
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Helmet>
          <title>পছন্দের তালিকা খালি — BD SHOPS</title>
        </Helmet>
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">আপনার পছন্দের তালিকা বর্তমানে খালি</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            কোনো পণ্য পছন্দ হলে হার্ট (❤️) আইকনে ট্যাপ করে আপনার উইশলিস্টে সংরক্ষণ করে রাখুন, যাতে পরবর্তীতে সহজেই কিনতে পারেন।
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-full font-bold text-xs shadow-md transition-all active:scale-95"
          >
            কালেকশন দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 sm:px-6 bg-[#F8FAFC]">
      <Helmet>
        <title>{`পছন্দের তালিকা (${wishlist.length}) — BD SHOPS`}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              আমার পছন্দের তালিকা ({wishlist.length}টি পণ্য)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              সংরক্ষিত পণ্যগুলো পর্যালোচনা করুন এবং সহজে কার্টে যোগ করুন
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleMoveAllToCart}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-[#00796B] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>সবগুলো কার্টে নিন</span>
            </button>

            <Link
              to="/products"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              আরও এক্সপ্লোর করুন
            </Link>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {wishlist.map((item) => {
            const itemImage =
              item.image || (item.images && item.images.length > 0 ? item.images[0] : '');

            return (
              <div
                key={item.id || item.productId}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
              >
                {/* Image & Remove Action */}
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <Link to={`/product/${item.slug || item.productId}`}>
                    <img
                      src={itemImage}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-400 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Stock Badge */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-emerald-700 shadow-xs">
                      স্টকে আছে
                    </span>
                  </div>
                </div>

                {/* Info & Add to Cart */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {item.rating && (
                      <div className="flex items-center gap-1 text-amber-500 text-[11px] mb-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{item.rating}</span>
                      </div>
                    )}

                    <Link
                      to={`/product/${item.slug || item.productId}`}
                      className="block font-semibold text-xs sm:text-sm text-slate-800 hover:text-[#00BFA5] transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {APP_CONFIG.currency}
                        {(item.price || 0).toLocaleString('bn-BD')}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {APP_CONFIG.currency}
                          {item.compareAtPrice.toLocaleString('bn-BD')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="w-full py-2.5 px-3 bg-[#E0F2F1] hover:bg-[#00BFA5] text-[#00796B] hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    কার্টে নিন
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
