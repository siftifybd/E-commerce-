/**
 * BD SHOPS — Product Catalog & Listing Page
 * Real-time Search, Filters Drawer, Dynamic Sorting & Mobile-Optimized Grid
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Filter,
  PackageSearch,
  RotateCcw,
} from 'lucide-react';
import {
  fetchProducts,
  fetchCategories,
  subscribeToProducts,
  subscribeToCategories,
} from '../../services/products';
import { ProductCard } from '../../components/product/ProductCard';
import { Product, Category, SortOption } from '../../types';
import { APP_CONFIG, SORT_OPTIONS_LIST } from '../../constants';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();

  // URL parameters
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const categoryParam = categorySlug || searchParams.get('category') || '';
  const subParam = searchParams.get('sub') || '';
  const sortParam = (searchParams.get('sort') as SortOption) || 'recommended';
  const flashSaleParam = searchParams.get('flashSale') === 'true';

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(flashSaleParam);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<SortOption>(sortParam);

  // Sync state with URL
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSortBy(sortParam);
    if (flashSaleParam) {
      setDiscountOnly(true);
    }
  }, [categoryParam, sortParam, flashSaleParam]);

  // Real-time Firestore onSnapshot listeners
  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    const unsubProds = subscribeToProducts(
      (prods) => {
        if (!isMounted) return;
        setProducts(prods);
        setLoading(false);
      },
      (err) => {
        console.error('Error in products subscription:', err);
        setLoading(false);
      }
    );

    const unsubCats = subscribeToCategories(
      (cats) => {
        if (!isMounted) return;
        setCategories(cats);
      },
      (err) => {
        console.error('Error in categories subscription:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubProds();
      unsubCats();
    };
  }, []);

  // Filter and sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (queryParam) {
          const q = queryParam.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.categoryName.toLowerCase().includes(q);
          const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
          const matchSku = p.sku?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchTag && !matchSku) return false;
        }

        // Category filter
        if (selectedCategory) {
          const cat = categories.find((c) => c.slug === selectedCategory);
          if (cat && p.categoryId !== cat.id) return false;
        }

        // Subcategory filter
        if (subParam) {
          if (!p.subcategoryId?.includes(subParam)) return false;
        }

        // In-stock only
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        // Discounted only
        if (discountOnly && (!p.discountPercentage || p.discountPercentage <= 0) && !p.isFlashSale) {
          return false;
        }

        // Price range
        if (p.price < priceRange[0] || p.price > priceRange[1]) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low':
            return a.price - b.price;
          case 'price_high':
            return b.price - a.price;
          case 'rating':
            return b.rating - a.rating;
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'popular':
            return b.reviewCount - a.reviewCount;
          case 'recommended':
          default:
            return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        }
      });
  }, [products, queryParam, selectedCategory, subParam, inStockOnly, discountOnly, priceRange, sortBy, categories]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) {
      newParams.set('category', slug);
    } else {
      newParams.delete('category');
    }
    newParams.delete('sub');
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setInStockOnly(false);
    setDiscountOnly(false);
    setPriceRange([0, 10000]);
    setSortBy('recommended');
    setSearchParams({});
    setIsFilterDrawerOpen(false);
  };

  const activeCategoryName = categories.find((c) => c.slug === selectedCategory)?.name;

  return (
    <div className="min-h-screen pb-16">
      <Helmet>
        <title>
          {queryParam
            ? `"${queryParam}" এর সার্চ রেজাল্ট — Black Zone`
            : activeCategoryName
            ? `${activeCategoryName} — Black Zone`
            : 'সকল পণ্য — Black Zone অনলাইন শপ'}
        </title>
        <meta
          name="description"
          content="Black Zone এর প্রিমিয়াম পণ্যের বিশাল সমাহার। পাঞ্জাবি, আতর, পোশাক, গ্যাজেট এবং আরও অনেক কিছু।"
        />
      </Helmet>

      {/* Top Banner / Filter Info */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-15 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              {queryParam ? (
                <>অনুসন্ধান: <span className="text-[#00BFA5]">"{queryParam}"</span></>
              ) : activeCategoryName ? (
                activeCategoryName
              ) : (
                'সকল পণ্যসম্ভার'
              )}
              <span className="text-xs font-normal text-slate-400">
                ({filteredProducts.length}টি পণ্য পাওয়া গেছে)
              </span>
            </h1>
          </div>

          {/* Action Bar: Sort & Filter Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Select */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                aria-label="Sort products"
                className="pl-8 pr-8 py-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 border-none focus:ring-2 focus:ring-[#00BFA5] cursor-pointer appearance-none"
              >
                {SORT_OPTIONS_LIST.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Drawer Trigger */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategory || inStockOnly || discountOnly || priceRange[1] < 10000
                  ? 'bg-[#E0F2F1] text-[#00796B] border-[#00BFA5]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00BFA5]" />
              <span>ফিল্টার</span>
              {(selectedCategory || inStockOnly || discountOnly) && (
                <span className="w-2 h-2 rounded-full bg-[#00BFA5]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Desktop Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex gap-8">
        {/* Desktop Sidebar Filter (Always visible on large screens) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs h-fit sticky top-36">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#00BFA5]" />
              ফিল্টারসমূহ
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-slate-500 hover:text-rose-500 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> রিসেট
            </button>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ক্যাটাগরি
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => handleCategorySelect('')}
                className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-[#E0F2F1] text-[#00796B] font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                সকল ক্যাটাগরি
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? 'bg-[#E0F2F1] text-[#00796B] font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-slate-400">({cat.productCount})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              সর্বোচ্চ মূল্য: {APP_CONFIG.currency}{priceRange[1].toLocaleString('bn-BD')}
            </h4>
            <input
              type="range"
              min="200"
              max="10000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              aria-label="Price range filter"
              className="w-full accent-[#00BFA5] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>{APP_CONFIG.currency}২০০</span>
              <span>{APP_CONFIG.currency}১০,০০০+</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#00BFA5] focus:ring-[#00BFA5] accent-[#00BFA5]"
              />
              <span>কেবল স্টকে থাকা পণ্য</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={discountOnly}
                onChange={(e) => setDiscountOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#00BFA5] focus:ring-[#00BFA5] accent-[#00BFA5]"
              />
              <span>বিশেষ ছাড় ও অফার</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                কোনো পণ্য খুঁজে পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                আপনার দেওয়া ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই। দয়া করে ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-full text-xs font-bold transition-all shadow-xs"
              >
                সব ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer (Modal Sheet) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in">
          <div
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#00BFA5]" />
                <h3 className="font-bold text-base text-slate-900">পণ্য ফিল্টার করুন</h3>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories Mobile */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                ক্যাটাগরি
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                    !selectedCategory
                      ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  সবগুলো
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      selectedCategory === cat.slug
                        ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Mobile */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                সর্বোচ্চ মূল্য: {APP_CONFIG.currency}{priceRange[1].toLocaleString('bn-BD')}
              </h4>
              <input
                type="range"
                min="200"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                aria-label="Mobile price range filter"
                className="w-full accent-[#00BFA5]"
              />
            </div>

            {/* Toggles Mobile */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>কেবল স্টকে থাকা পণ্য</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00BFA5] accent-[#00BFA5]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>বিশেষ অফার ও ছাড়</span>
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00BFA5] accent-[#00BFA5]"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 rounded-2xl"
              >
                রিসেট
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-2 py-3 text-xs font-bold text-white bg-[#00BFA5] rounded-2xl shadow-md"
              >
                ফিল্টার প্রয়োগ করুন ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
