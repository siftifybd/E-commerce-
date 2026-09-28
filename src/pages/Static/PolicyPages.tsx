/**
 * BD SHOPS — Legal, Compliance & Contact Us Pages
 * Privacy Policy, Terms & Conditions, Refund Policy and Contact Help Desk
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck,
  RotateCcw,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { APP_CONFIG } from '../../constants';
import { FAQSection } from '../../components/common/FAQSection';

/**
 * Contact Us Page
 */
export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      toast.error('দয়া করে সকল তথ্য পূরণ করুন');
      return;
    }
    setSubmitted(true);
    toast.success('আপনার বার্তা সফলভাবে পাঠানো হয়েছে! আমাদের প্রতিনিধি শিগগিরই যোগাযোগ করবেন।');
    setName('');
    setPhone('');
    setMessage('');
  };

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>যোগাযোগ করুন — BD SHOPS কাস্টমার সাপোর্ট</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            আমাদের সাথে যোগাযোগ করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            যেকোনো অর্ডার সংক্রান্ত প্রশ্ন, পণ্য অনুসন্ধান বা সহায়তার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href={`tel:${APP_CONFIG.supportPhone}`}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-[#00BFA5] transition-all flex flex-col items-center text-center space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#00BFA5] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">সরাসরি কল</h3>
            <p className="font-extrabold text-sm text-slate-800">{APP_CONFIG.supportPhone}</p>
            <span className="text-[11px] text-slate-500">{APP_CONFIG.workingHours}</span>
          </a>

          <a
            href={`https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hello BD SHOPS! I have a question about my order.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">হোয়াটসঅ্যাপ</h3>
            <p className="font-extrabold text-sm text-slate-800">ইনস্ট্যান্ট মেসেজ</p>
            <span className="text-[11px] text-emerald-600 font-semibold">চ্যাট শুরু করুন</span>
          </a>

          <a
            href={`mailto:${APP_CONFIG.supportEmail}`}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-[#00BFA5] transition-all flex flex-col items-center text-center space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">ইমেইল সহায়তা</h3>
            <p className="font-extrabold text-sm text-slate-800">{APP_CONFIG.supportEmail}</p>
            <span className="text-[11px] text-slate-500">দ্রুত উত্তর দেওয়া হয়</span>
          </a>
        </div>

        {/* Message Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">আমাদের একটি বার্তা পাঠান</h2>
            <p className="text-xs text-slate-500 mt-0.5">নিচের ফর্মটি পূরণ করে পাঠান, আমরা দ্রুত যোগাযোগ করব।</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">আপনার বার্তা বা মন্তব্য *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="আপনার জিজ্ঞাসা বিস্তারিত লিখুন..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#00BFA5]/25 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" /> বার্তা প্রেরণ করুন
            </button>
          </form>
        </div>

        {/* Integrated FAQ Section */}
        <FAQSection className="pt-2 px-0" />
      </div>
    </div>
  );
};

/**
 * Refund & Return Policy Page
 */
export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>রিটার্ন ও রিফান্ড পলিসি — BD SHOPS</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#E0F2F1] text-[#00BFA5] flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">রিটার্ন ও রিফান্ড পলিসি</h1>
            <p className="text-xs text-slate-500">সর্বশেষ আপডেট: জানুয়ারি ২০২৫</p>
          </div>
        </div>

        <div className="prose prose-sm text-slate-600 text-xs sm:text-sm leading-relaxed space-y-4">
          <h3 className="text-sm font-bold text-slate-800">১. ডেলিভারির সময় পণ্য যাচাই:</h3>
          <p>
            BD SHOPS এর ডেলিভারিম্যানের সামনেই পার্সেল খুলে পণ্য দেখে নিন। পণ্যে কোনো ত্রুটি বা অমিল থাকলে তৎক্ষণাৎ ডেলিভারিম্যানকে পণ্য ফেরত দিতে পারবেন কোনো প্রকার ডেলিভারি চার্জ ছাড়াই।
          </p>

          <h3 className="text-sm font-bold text-slate-800">২. ৭ দিনের সহজ এক্সচেঞ্জ সুবিধা:</h3>
          <p>
            পাঞ্জাবি বা পোশাকের ক্ষেত্রে সাইজে সমস্যা হলে পণ্য গ্রহণের ৭ দিনের মধ্যে তা এক্সচেঞ্জ করার অনুরোধ করা যাবে। পণ্যটি অব্যবহৃত অবস্থায় মূল ট্যাগ ও প্যাকিং সহ থাকতে হবে।
          </p>

          <h3 className="text-sm font-bold text-slate-800">৩. আতর ও সুগন্ধির ক্ষেত্রে শর্ত:</h3>
          <p>
            আতর বা সুগন্ধির ক্ষেত্রে সিল ভাঙা হলে বা ব্যবহার করা হলে তা রিটার্নযোগ্য হবে না। তবে ভাঙা বা নষ্ট বোতল পেলে তাৎক্ষণিক নতুন পণ্য পাঠিয়ে দেওয়া হবে।
          </p>

          <h3 className="text-sm font-bold text-slate-800">৪. মূল্য ফেরত (Refund) প্রক্রিয়া:</h3>
          <p>
            যদি অগ্রিম পেমেন্ট (বিকাশ/নগদ) করা হয়ে থাকে এবং পণ্য ফেরত পাঠানো হয়, তবে পণ্য আমাদের ওয়্যারহাউজে পৌঁছানোর ৭২ ঘণ্টার মধ্যে সম্পূর্ণ মূল্য গ্রাহকের মোবাইল ওয়ালেটে রিফান্ড করে দেওয়া হবে।
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Privacy Policy Page
 */
export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>গোপনীয়তা নীতি — BD SHOPS</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">গোপনীয়তা নীতি (Privacy Policy)</h1>
            <p className="text-xs text-slate-500">আপনার তথ্যের নিরাপত্তা আমাদের অঙ্গীকার</p>
          </div>
        </div>

        <div className="prose prose-sm text-slate-600 text-xs sm:text-sm leading-relaxed space-y-4">
          <h3 className="text-sm font-bold text-slate-800">১. সংগৃহীত তথ্য:</h3>
          <p>
            অর্ডার প্রসেস ও ডেলিভারির সুবিধার্থে আমরা আপনার নাম, মোবাইল নম্বর, ইমেইল ও ডেলিভারি ঠিকানা সংগ্রহ করি।
          </p>

          <h3 className="text-sm font-bold text-slate-800">২. তথ্যের নিরাপত্তা ও গোপনীয়তা:</h3>
          <p>
            BD SHOPS গ্রাহকের ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিত করে। কোনো তৃতীয় পক্ষের নিকট আপনার ব্যক্তিগত তথ্য বিক্রয় বা আদান-প্রদান করা হয় না।
          </p>

          <h3 className="text-sm font-bold text-slate-800">৩. পেমেন্ট তথ্য:</h3>
          <p>
            আমরা কোনো গ্রাহকের পিন নম্বর, ওটিপি বা ব্যাংক একাউন্টের তথ্য সংগ্রহ বা সংরক্ষণ করি না। লেনদেন সম্পূর্ণ নিরাপদ মার্চেন্ট চ্যানেলে সম্পাদিত হয়।
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Terms and Conditions Page
 */
export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>ব্যবহারের শর্তাবলী — BD SHOPS</title>
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">ব্যবহারের শর্তাবলী (Terms & Conditions)</h1>
            <p className="text-xs text-slate-500">BD SHOPS প্ল্যাটফর্ম ব্যবহারের নিয়মাবলি</p>
          </div>
        </div>

        <div className="prose prose-sm text-slate-600 text-xs sm:text-sm leading-relaxed space-y-4">
          <h3 className="text-sm font-bold text-slate-800">১. অর্ডার কনফার্মেশন:</h3>
          <p>
            ওয়েবসাইটে অর্ডার প্লেস করার পর আমাদের কাস্টমার রিপ্রেজেন্টেটিভ ফোন কলের মাধ্যমে তা নিশ্চিত করবেন। ফোন কলের মাধ্যমে নিশ্চিত না হলে অর্ডার কার্যকর করা সম্ভব নাও হতে পারে।
          </p>

          <h3 className="text-sm font-bold text-slate-800">২. পণ্যের প্রাপ্যতা ও মূল্য:</h3>
          <p>
            সব পণ্যের মূল্য এবং প্রাপ্যতা স্টক সাপেক্ষে পরিবর্তনশীল। কোনো পণ্য স্টক আউট হয়ে গেলে গ্রাহককে অবিলম্বে অবহিত করা হবে।
          </p>

          <h3 className="text-sm font-bold text-slate-800">৩. ডেলিভারি সময়সীমা:</h3>
          <p>
            সাধারণত ঢাকার মধ্যে ২৪ থেকে ৪৮ ঘণ্টা এবং ঢাকার বাইরে ২ থেকে ৪ কার্যদিবসের মধ্যে ডেলিভারি প্রদান করা হয়ে থাকে। প্রাকৃতিক দুর্যোগ বা রাজনৈতিক পরিস্থিতিতে সামান্য বিলম্ব হতে পারে।
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated FAQ Page
 */
export const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <Helmet>
        <title>সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ) — BD STORE</title>
      </Helmet>
      <FAQSection />
    </div>
  );
};
