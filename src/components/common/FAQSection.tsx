/**
 * BD STORE — Frequently Asked Questions (FAQ) Component
 * Interactive Category Filtering (Shipping, Returns, Payments, General)
 * Smooth Accordion Transition, Real-time Search & Full Admin Control
 */

import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Truck,
  RotateCcw,
  CreditCard,
  ChevronDown,
  Search,
  MessageCircle,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { FAQItem, DEFAULT_FEATURE_TOGGLES } from '../../services/settings';

interface FAQSectionProps {
  showTitle?: boolean;
  className?: string;
  defaultCategory?: 'all' | 'shipping' | 'returns' | 'payments';
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  showTitle = true,
  className = '',
  defaultCategory = 'all',
}) => {
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'shipping' | 'returns' | 'payments'>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Check if admin enabled FAQ
  const isEnabled = settings.features?.faqEnabled !== false;
  if (!isEnabled) {
    return null;
  }

  // Get FAQs from settings or default fallback
  const faqs: FAQItem[] =
    settings.features?.faqs && settings.features.faqs.length > 0
      ? settings.features.faqs
      : (DEFAULT_FEATURE_TOGGLES.faqs as FAQItem[]);

  // Filter FAQs based on active category & search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchCategory =
        selectedCategory === 'all' || faq.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCategory && matchSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getCategoryIcon = (cat: FAQItem['category']) => {
    switch (cat) {
      case 'shipping':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'returns':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'payments':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-sky-600" />;
    }
  };

  const getCategoryLabel = (cat: FAQItem['category']) => {
    switch (cat) {
      case 'shipping':
        return 'শিপিং ও ডেলিভারি';
      case 'returns':
        return 'রিটার্ন ও রিফান্ড';
      case 'payments':
        return 'পেমেন্ট ও বিলিং';
      default:
        return 'সাধারণ প্রশ্ন';
    }
  };

  const categories = [
    { id: 'all', label: 'সকল প্রশ্নোত্তর', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'shipping', label: 'শিপিং ও ডেলিভারি', icon: <Truck className="w-4 h-4" /> },
    { id: 'returns', label: 'রিটার্ন ও রিফান্ড', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'payments', label: 'পেমেন্ট পদ্ধতি', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className={`w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 ${className}`}>
      {/* SECTION HEADER */}
      {showTitle && (
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-[#00796B] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            আপনার কোনো প্রশ্ন আছে কি?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            শিপিং, ডেলিভারি চার্জ, রিটার্ন পলিসি ও পেমেন্ট সংক্রান্ত বিস্তারিত তথ্য জেনে নিন সহজে
          </p>
        </div>
      )}

      {/* SEARCH BAR & CATEGORY FILTER TABS */}
      <div className="space-y-4 mb-8">
        {/* Search input */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="আপনার প্রশ্নটি এখানে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#00BFA5] focus:ring-3 focus:ring-[#00BFA5]/15 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg"
            >
              মুছুন
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat.id === 'all'
                ? faqs.length
                : faqs.filter((f) => f.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25 font-black scale-102'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedCategory === cat.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCORDION LIST */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-700">কোনো প্রশ্নোত্তর পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400">
              ভিন্ন কীওয়ার্ড দিয়ে অনুসন্ধান করুন অথবা সরাসরি আমাদের সাথে যোগাযোগ করুন।
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedId === faq.id || (expandedId === null && index === 0 && !searchQuery);

            return (
              <div
                key={faq.id}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-teal-300 shadow-md shadow-teal-500/5 ring-1 ring-[#00BFA5]/20'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* QUESTION BUTTON */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded
                          ? 'bg-teal-50 text-[#00BFA5]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {getCategoryIcon(faq.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#00796B] tracking-wider block mb-0.5">
                        {getCategoryLabel(faq.category)}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isExpanded
                        ? 'bg-teal-50 text-[#00BFA5] rotate-180'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* ANSWER ACCORDION COLLAPSIBLE */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 animate-in fade-in duration-200 pl-14 sm:pl-16">
                    <p className="font-medium whitespace-pre-line text-slate-700">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QUICK HELP FOOTER CARD */}
      <div className="mt-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-black">আরও কোনো তথ্যের প্রয়োজন?</h4>
          <p className="text-xs text-slate-300 font-medium">
            আমাদের কাস্টমার সাপোর্ট টিম আপনাকে সার্বক্ষণিক সহায়তা করতে প্রস্তুত।
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          {settings.supportPhone && (
            <a
              href={`tel:${settings.supportPhone}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black transition-all active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>কল করুন</span>
            </a>
          )}

          {settings.socialLinks?.whatsapp && (
            <a
              href={settings.socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00BFA5]/25 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপ চ্যাট</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
