/**
 * BD SHOPS — Application Footer Component
 * Brand information, quick links, legal policies & safe padding
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Clock, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { APP_CONFIG } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();

  const siteName = settings.siteName || APP_CONFIG.name;
  const supportPhone = settings.supportPhone || APP_CONFIG.supportPhone;
  const supportEmail = settings.supportEmail || APP_CONFIG.supportEmail;
  const logo = settings.siteLogo;
  const social = settings.socialLinks;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 mb-8 border-b border-slate-800 text-xs sm:text-sm">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/15 text-[#00BFA5] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">দ্রুত ডেলিভারি</p>
              <p className="text-[11px] text-slate-400">সমগ্র বাংলাদেশে হোম ডেলিভারি</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/15 text-[#00BFA5] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">ক্যাশ অন ডেলিভারি</p>
              <p className="text-[11px] text-slate-400">পণ্য দেখে মূল্য পরিশোধ করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/15 text-[#00BFA5] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">সহজ রিটার্ন পলিসি</p>
              <p className="text-[11px] text-slate-400">৭ দিনের মধ্যে রিটার্ন সুবিধা</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/15 text-[#00BFA5] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">১০০% অরিজিনাল পণ্য</p>
              <p className="text-[11px] text-slate-400">প্রিমিয়াম কোয়ালিটি নিশ্চয়তা</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              {logo ? (
                <img src={logo} alt={siteName} className="h-10 w-10 object-cover rounded-xl border border-slate-700 shadow-sm group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00A892] to-[#00BFA5] flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {siteName.charAt(0)}
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-[#00BFA5] transition-colors">
                {siteName}
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              {APP_CONFIG.tagline}। প্রিমিয়াম কোয়ালিটির পণ্য ও বিশ্বস্ত সেবা পৌঁছে দেওয়া আমাদের অঙ্গীকার।
            </p>

            {/* Contact Info */}
            <div className="pt-2 text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00BFA5]" />
                <span>{supportPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00BFA5]" />
                <span>{supportEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00BFA5]" />
                <span>{APP_CONFIG.workingHours}</span>
              </div>
            </div>

            {/* Social Media Links with Real Brand Logos/Icons */}
            {social && (social.facebook || social.instagram || social.youtube || social.tiktok || social.whatsapp) && (
              <div className="flex items-center gap-2.5 pt-3">
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-pink-600/20 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 text-pink-400 hover:text-white border border-pink-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {social.youtube && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    title="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {social.tiktok && (
                  <a
                    href={social.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-950 text-slate-200 hover:text-cyan-400 border border-slate-700 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    title="TikTok"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.33 1.55-1.3 2.55.01.8.44 1.59 1.12 2.01.71.45 1.62.53 2.39.23.82-.3 1.47-1.03 1.67-1.87.08-.43.11-.88.11-1.32.01-4.92 0-9.83.01-14.75z"/>
                    </svg>
                  </a>
                )}
                {social.whatsapp && (
                  <a
                    href={social.whatsapp.startsWith('http') ? social.whatsapp : `https://wa.me/${social.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-emerald-600/20 hover:bg-[#25D366] text-emerald-400 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold mb-4 tracking-wider uppercase">প্রয়োজনীয় লিংক</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/products" className="hover:text-[#00BFA5] transition-colors">সকল পণ্য ব্রাউজ করুন</Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-[#00BFA5] transition-colors">ক্যাটাগরিসমূহ</Link>
              </li>
              <li>
                <Link to="/products?flashSale=true" className="hover:text-[#00BFA5] transition-colors">ফ্ল্যাশ সেল ও অফার</Link>
              </li>
              <li>
                <Link to="/orders/track" className="hover:text-[#00BFA5] transition-colors">অর্ডার ট্র্যাকিং</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-[#00BFA5] transition-colors">পছন্দের তালিকা (Wishlist)</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Legal */}
          <div>
            <h4 className="text-white text-sm font-bold mb-4 tracking-wider uppercase">গ্রাহক সেবা ও নীতি</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/legal/privacy-policy" className="hover:text-[#00BFA5] transition-colors">গোপনীয়তা নীতি (Privacy Policy)</Link>
              </li>
              <li>
                <Link to="/legal/terms-and-conditions" className="hover:text-[#00BFA5] transition-colors">ব্যবহারের শর্তাবলী (Terms & Conditions)</Link>
              </li>
              <li>
                <Link to="/legal/refund-policy" className="hover:text-[#00BFA5] transition-colors">রিটার্ন ও রিফান্ড পলিসি</Link>
              </li>
              {settings.customPages?.filter(p => p.isPublished).map(page => (
                <li key={page.id}>
                  <Link to={`/p/${page.slug}`} className="hover:text-[#00BFA5] transition-colors">{page.title}</Link>
                </li>
              ))}
              <li>
                <Link to="/account" className="hover:text-[#00BFA5] transition-colors">আমার একাউন্ট</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods */}
          <div>
            <h4 className="text-white text-sm font-bold mb-4 tracking-wider uppercase">পেমেন্ট মেথড</h4>
            <p className="text-xs text-slate-400 mb-3">
              নিরাপদ ও সহজ পেমেন্টের মাধ্যমে আপনার শপিং সম্পন্ন করুন:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-medium border border-slate-700">
                Cash On Delivery
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-pink-950/60 text-pink-400 font-medium border border-pink-900/50">
                বিকাশ (bKash)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-orange-950/60 text-orange-400 font-medium border border-orange-900/50">
                নগদ (Nagad)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} {APP_CONFIG.name}. সর্বস্বত্ব সংরক্ষিত।</p>
          <p>Designed for Exceptional Mobile & Desktop Experience.</p>
        </div>
      </div>
    </footer>
  );
};
