/**
 * BD SHOPS — Responsive Product Card Component
 * Daraz-style clean card with direct product details navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useSettings } from '../../context/SettingsContext';
import { APP_CONFIG } from '../../constants';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const currencySymbol = settings.currencySymbol || APP_CONFIG.currency;
  const { toggleWishlist, isInWishlist } = useCartStore();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent =
    product.discountPercentage ||
    (product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null);

  const displayImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.image ||
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop';

  const handleCardClick = () => {
    navigate(`/product/${product.slug}`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isWishlisted) {
      toast.success('পছন্দের তালিকায় যুক্ত হয়েছে');
    } else {
      toast('পছন্দের তালিকা থেকে সরানো হয়েছে');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-[#00BFA5]/40 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
            -{discountPercent}%
          </div>
        )}

        {/* Pinned Tag 📌 */}
        {product.isPinned && (
          <div className={`absolute ${discountPercent && discountPercent > 0 ? 'top-8' : 'top-2'} left-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1`}>
            <span>📌</span>
            <span>পিন করা</span>
          </div>
        )}

        {/* Featured Tag */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2 z-10 bg-[#00796B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>ফিচার্ড</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute bottom-2 right-2 z-10 p-2 rounded-full transition-all duration-150 shadow-xs cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
              : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          aria-label="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Category */}
          {product.categoryName && (
            <span className="text-[10px] font-semibold text-slate-600 block uppercase tracking-wider mb-0.5">
              {product.categoryName}
            </span>
          )}

          {/* Product Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-[#00BFA5] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              {(product.rating || 5).toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-600">
              ({product.reviewCount || 12})
            </span>
          </div>
        </div>

        {/* Pricing & Order action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-[#00796B]">
                {currencySymbol}{product.price.toLocaleString('bn-BD')}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-[11px] text-slate-600 line-through">
                  {currencySymbol}{product.compareAtPrice.toLocaleString('bn-BD')}
                </span>
              )}
            </div>
          </div>

          <span className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-[#00796B] group-hover:bg-[#00BFA5] group-hover:text-white transition-all text-xs font-bold flex items-center gap-1 shadow-2xs">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">বিস্তারিত</span>
          </span>
        </div>
      </div>
    </div>
  );
};
