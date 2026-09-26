/**
 * BD SHOPS — Sidebar Category Navigation Component
 * Daraz-style vertical sidebar with subcategory flyout menus
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Star, 
  Zap, 
  Package, 
  Gift, 
  LayoutGrid 
} from 'lucide-react';
import { Category } from '../../types';

interface CategorySidebarProps {
  categories: Category[];
  loading?: boolean;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories, loading }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-64 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hidden lg:block animate-pulse">
        <div className="p-4 border-b border-slate-50 bg-slate-50">
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="p-2 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-9 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-64 bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-visible hidden lg:block z-40">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#00BFA5]/10 flex items-center justify-center text-[#00BFA5]">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          সকল ক্যাটাগরি
        </h3>
      </div>

      {/* Category List */}
      <nav className="p-1.5" onMouseLeave={() => setActiveCategory(null)}>
        {/* Special Links */}
        <Link
          to="/products?sort=popular"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span>জনপ্রিয় পণ্য</span>
          </div>
          <Sparkles className="w-3 h-3 text-rose-300 opacity-0 group-hover:opacity-100" />
        </Link>

        {/* Dynamic Categories */}
        {categories.slice(0, 12).map((cat) => (
          <div
            key={cat.id}
            onMouseEnter={() => setActiveCategory(cat.id)}
            className="relative"
          >
            <Link
              to={`/category/${cat.slug || cat.id}`}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all group ${
                activeCategory === cat.id 
                  ? 'bg-teal-50 text-[#00796B]' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-100 shrink-0">
                  <img 
                    src={cat.image} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="truncate max-w-[140px]">{cat.name}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeCategory === cat.id ? 'translate-x-1 opacity-100' : 'opacity-30'}`} />
            </Link>

            {/* Subcategory Flyout (Flyout Menu like Daraz) */}
            {activeCategory === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
              <div className="absolute left-[calc(100%-4px)] top-0 w-72 min-h-full bg-white rounded-2xl shadow-[8px_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 py-5 px-6 animate-in fade-in slide-in-from-left-2 duration-200 z-50">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    {cat.name} কালেকশন
                  </h4>
                  <Link 
                    to={`/category/${cat.slug || cat.id}`}
                    className="text-[10px] font-bold text-[#00BFA5] hover:underline"
                  >
                    সব দেখুন
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-y-3">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/products?subcategory=${sub.slug || sub.id}`}
                      className="text-[11px] font-medium text-slate-600 hover:text-[#00BFA5] hover:translate-x-1 transition-all flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span>{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <Link
          to="/categories"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-black text-[#00796B] hover:bg-teal-50 mt-1 border-t border-slate-50 pt-3"
        >
          <div className="w-5 h-5 rounded-full bg-[#00BFA5] flex items-center justify-center text-white shrink-0">
             <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <span>সকল ক্যাটাগরি দেখুন</span>
        </Link>
      </nav>

      {/* Trust Footer inside Sidebar */}
      <div className="p-4 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex flex-col gap-2.5">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>অরিজিনাল পণ্য</span>
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <Package className="w-3.5 h-3.5 text-[#00BFA5]" />
            <span>সারা দেশে ডেলিভারি</span>
         </div>
      </div>
    </div>
  );
};
