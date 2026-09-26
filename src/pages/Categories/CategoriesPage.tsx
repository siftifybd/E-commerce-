/**
 * BD SHOPS — Database-Driven Categories & Subcategories Page
 * Mobile-First Category Navigation with Subcategory Chips
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import { fetchCategories } from '../../services/products';
import { Category } from '../../types';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = cat.name.toLowerCase().includes(q);
    const subMatch = cat.subcategories?.some((sub) => sub.name.toLowerCase().includes(q));
    return nameMatch || subMatch;
  });

  return (
    <div className="min-h-screen pb-12">
      <Helmet>
        <title>ক্যাটাগরিসমূহ — BD SHOPS অনলাইন শপ</title>
        <meta
          name="description"
          content="পাঞ্জাবি, আতর, জায়নামাজ ও ইসলামিক সামগ্রীর সকল ক্যাটাগরি ব্রাউজ করুন।"
        />
      </Helmet>

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-[#00BFA5]" />
                সকল ক্যাটাগরি
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                আপনার পছন্দের পণ্য সহজে খুঁজে পেতে নির্দিষ্ট ক্যাটাগরি নির্বাচন করুন
              </p>
            </div>

            {/* Category Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ক্যাটাগরি খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20 focus:bg-white border border-transparent focus:border-[#00BFA5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 rounded-3xl animate-shimmer" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
            <p className="text-slate-500 text-sm mb-2">কোনো ক্যাটাগরি খুঁজে পাওয়া যায়নি</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#00BFA5] hover:underline"
            >
              সার্চ ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Category Banner Image with Link */}
                  <Link
                    to={`/category/${category.slug || category.id}`}
                    className="relative block aspect-[16/9] overflow-hidden bg-slate-100"
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                      <div>
                        <span className="px-2.5 py-0.5 bg-[#00BFA5] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {category.productCount}+ টি পণ্য
                        </span>
                        <h2 className="text-lg font-bold text-white mt-1 group-hover:text-[#00BFA5] transition-colors">
                          {category.name}
                        </h2>
                      </div>
                    </div>
                  </Link>

                  {/* Subcategories Chips */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="p-4 border-b border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#00BFA5]" /> সাব-ক্যাটাগরিসমূহ:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/category/${category.slug || category.id}?sub=${sub.slug || sub.id}`}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-[#E0F2F1] text-slate-700 hover:text-[#00796B] text-xs rounded-xl font-medium border border-slate-200/60 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Link */}
                <div className="p-4 bg-slate-50/70 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    কালেকশনের সব পণ্য দেখুন
                  </span>
                  <Link
                    to={`/category/${category.slug || category.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#00BFA5] group-hover:translate-x-1 transition-transform"
                  >
                    ব্রাউজ করুন <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
