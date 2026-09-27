/**
 * BD SHOPS — Dynamic Custom Content Page
 * Displays admin-published custom pages (e.g., /p/about-us, /p/faq, /p/delivery-info)
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowLeft, Home, Calendar, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const CustomPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings, loading } = useSettings();

  // Find the requested custom page by slug
  const page = settings?.customPages?.find(
    (p) => p.slug === slug && p.isPublished
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#00BFA5]/20 border-t-[#00BFA5] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">পৃষ্ঠা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-[#F8FAFC]">
        <Helmet>
          <title>পৃষ্ঠা খুঁজে পাওয়া যায়নি — {settings?.siteName || 'BD SHOPS'}</title>
        </Helmet>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন তা বর্তমানে উপলব্ধ নেই অথবা সরিয়ে ফেলা হয়েছে।
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> পেছনে যান
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BFA5] text-white text-xs font-semibold hover:bg-[#00BFA5]/90 transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" /> হোম পেজ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if content looks like HTML or plain text
  const isHtml = /<[a-z][\s\S]*>/i.test(page.content);

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>{page.title} — {settings?.siteName || 'BD SHOPS'}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-[#00BFA5] transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> হোম
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-md">
              {page.title}
            </span>
          </nav>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
          </button>
        </div>

        {/* Page Content Card */}
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-slate-100 pb-5 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00BFA5] text-xs font-bold">
              <FileText className="w-3.5 h-3.5" />
              <span>BD SHOPS পেজ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {page.title}
            </h1>
            {page.updatedAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>সর্বশেষ আপডেট: {page.updatedAt}</span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed">
            {isHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: page.content }}
                className="space-y-4"
              />
            ) : (
              <div className="whitespace-pre-wrap space-y-3">
                {page.content}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
