/**
 * BD SHOPS — Dedicated Online Payment Page
 * Mobile-First Payment Gateway for bKash, Nagad, Rocket, Upay
 * Dynamic payment configuration loaded from Store Settings with Admin Control
 * With Transaction ID input, Instant Proof of Payment (Image Upload & Preview), and Verification
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  UploadCloud,
  Eye,
  X,
  ArrowRight,
  ChevronLeft,
  Loader2,
  HelpCircle,
  FileCheck2,
  PhoneCall,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchOrderById, updateOrderPaymentProof } from '../../services/orders';
import { fetchStoreSettings, DEFAULT_PAYMENT_SETTINGS, OnlinePaymentSettings } from '../../services/settings';
import { createNotificationInFirestore } from '../../services/notifications';
import { Order } from '../../types';
import { APP_CONFIG } from '../../constants';

type PaymentChannel = 'bkash' | 'nagad' | 'rocket' | 'upay';

interface PaymentChannelDisplay {
  id: PaymentChannel;
  name: string;
  bengaliName: string;
  type: string;
  number: string;
  instructions: string;
  color: string;
  bgColor: string;
  borderColor: string;
  activeRing: string;
  badgeBg: string;
  badgeText: string;
  steps: string[];
}

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState<Order | null>((location.state as any)?.order || null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('bkash');
  const [paymentSettings, setPaymentSettings] = useState<OnlinePaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Order details & dynamic store settings
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      setLoading(true);
      try {
        const storeSettings = await fetchStoreSettings();
        if (!isMounted) return;
        if (storeSettings.payments) {
          const payments = storeSettings.payments;
          setPaymentSettings(payments);
          // Auto select first enabled channel
          const channels: PaymentChannel[] = ['bkash', 'nagad', 'rocket', 'upay'];
          const firstAvailable = channels.find((c) => payments[c]?.enabled !== false);
          if (firstAvailable) {
            setSelectedChannel(firstAvailable);
          }
        }

        if (order) {
          if (order.transactionId) setTransactionId(order.transactionId);
          if (order.paymentProofUrl) setPaymentProofImage(order.paymentProofUrl);
          if (order.senderNumber) setSenderNumber(order.senderNumber);
        } else if (orderId) {
          const ord = await fetchOrderById(orderId);
          if (!isMounted) return;
          if (ord) {
            setOrder(ord);
            if (ord.transactionId) setTransactionId(ord.transactionId);
            if (ord.paymentProofUrl) setPaymentProofImage(ord.paymentProofUrl);
            if (ord.senderNumber) setSenderNumber(ord.senderNumber);
          }
        }
      } catch (err) {
        console.error('Error initializing payment page:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Construct active payment channels based on admin settings
  const paymentMethods: PaymentChannelDisplay[] = [
    {
      id: 'bkash',
      name: 'bKash',
      bengaliName: 'বিকাশ',
      type: `${paymentSettings.bkash.type} (${paymentSettings.bkash.type === 'Merchant' ? 'Payment' : 'Send Money'})`,
      number: paymentSettings.bkash.number || APP_CONFIG.supportPhone || '01796983725',
      instructions: paymentSettings.bkash.instructions || 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে Send Money করুন।',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      activeRing: 'ring-pink-500 border-pink-500 bg-pink-50/50',
      badgeBg: 'bg-pink-100',
      badgeText: 'text-pink-700',
      steps: [
        'আপনার বিকাশ অ্যাপে ঢুকুন অথবা *247# ডায়াল করুন',
        `"${paymentSettings.bkash.type === 'Merchant' ? 'Payment' : 'Send Money'}" অপশনে যান`,
        `নিচের বিকাশ ${paymentSettings.bkash.type} নম্বরে সর্বমোট বিলের সমপরিমাণ টাকা পাঠান`,
        'লেনদেন সফল হলে যে TrxID (Transaction ID) পাবেন সেটি নিচে প্রদান করুন',
        'প্রমাণ হিসেবে পেমেন্ট সাকসেস স্ক্রিনের ছবি বা রসিদ আপলোড করুন',
      ],
    },
    {
      id: 'nagad',
      name: 'Nagad',
      bengaliName: 'নগদ',
      type: `${paymentSettings.nagad.type} (${paymentSettings.nagad.type === 'Merchant' ? 'Payment' : 'Send Money'})`,
      number: paymentSettings.nagad.number || APP_CONFIG.supportPhone || '01796983725',
      instructions: paymentSettings.nagad.instructions || 'নগদ অ্যাপ অথবা *167# ডায়াল করে Send Money করুন।',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      activeRing: 'ring-orange-500 border-orange-500 bg-orange-50/50',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      steps: [
        'আপনার নগদ অ্যাপে ঢুকুন অথবা *167# ডায়াল করুন',
        `"${paymentSettings.nagad.type === 'Merchant' ? 'Payment' : 'Send Money'}" অপশন বেছে নিন`,
        `নিচের নগদ নম্বরে সঠিক টাকা পাঠান`,
        'প্রাপ্ত TrxID নিচে লিখুন',
        'পেমেন্ট স্ক্রিনশটের ছবি আপলোড করুন',
      ],
    },
    {
      id: 'rocket',
      name: 'Rocket',
      bengaliName: 'রকেট',
      type: `${paymentSettings.rocket.type} (${paymentSettings.rocket.type === 'Merchant' ? 'Payment' : 'Send Money'})`,
      number: paymentSettings.rocket.number || `${APP_CONFIG.supportPhone || '01796983725'}8`,
      instructions: paymentSettings.rocket.instructions || 'রকেট অ্যাপ অথবা *322# ডায়াল করে Send Money করুন।',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      activeRing: 'ring-purple-500 border-purple-500 bg-purple-50/50',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-700',
      steps: [
        'আপনার রকেট অ্যাপ বা *322# এ যান',
        `"${paymentSettings.rocket.type === 'Merchant' ? 'Payment' : 'Send Money'}" অপশনে যান`,
        'নিচের রকেট নম্বরে সঠিক টাকা পাঠান',
        'ট্রানজেকশন আইডি ও স্ক্রিনশট নিচে সাবমিট করুন',
      ],
    },
    {
      id: 'upay',
      name: 'Upay',
      bengaliName: 'উপায়',
      type: `${paymentSettings.upay.type} (${paymentSettings.upay.type === 'Merchant' ? 'Payment' : 'Send Money'})`,
      number: paymentSettings.upay.number || APP_CONFIG.supportPhone || '01796983725',
      instructions: paymentSettings.upay.instructions || 'উপায় অ্যাপ অথবা *268# ডায়াল করে Send Money করুন।',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      activeRing: 'ring-amber-500 border-amber-500 bg-amber-50/50',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      steps: [
        'আপনার উপায় অ্যাপ ওপেন করুন',
        `"${paymentSettings.upay.type === 'Merchant' ? 'Payment' : 'Send Money'}" নির্বাচন করুন`,
        'উপায় নম্বরে টাকা সেন্ড মানি সম্পন্ন করুন',
        'প্রাপ্ত TrxID ও পেমেন্ট স্ক্রিনশট দিয়ে সাবমিট করুন',
      ],
    },
  ];

  // Filter channels according to admin enable/disable flags
  const availableChannels = paymentMethods.filter((ch) => paymentSettings[ch.id]?.enabled !== false);
  const activeChannelConfig = availableChannels.find((c) => c.id === selectedChannel) || availableChannels[0] || paymentMethods[0];
  const payableAmount = order?.grandTotal ?? order?.total ?? 0;

  // Copy phone number to clipboard
  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activeChannelConfig.number);
    toast.success(`${activeChannelConfig.name} নম্বর কপি করা হয়েছে!`);
  };

  // Image Upload & Conversion to Base64 (Instant upload & preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('অনুগ্রহ করে শুধুমাত্র ছবি (JPG, PNG, JPEG) আপলোড করুন');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofImage(reader.result as string);
      toast.success('পেমেন্ট প্রুফ ছবি যুক্ত হয়েছে!');
    };
    reader.onerror = () => {
      toast.error('ছবি আপলোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPaymentProofImage(null);
    setImageFileName('');
  };

  // Submit Payment Confirmation
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !order) {
      toast.error('অর্ডার পাওয়া যায়নি');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('দয়া করে সঠিক ট্রানজেকশন আইডি (TrxID) দিন');
      return;
    }

    setSubmitting(true);
    try {
      const success = await updateOrderPaymentProof(order.id, {
        transactionId: transactionId.trim().toUpperCase(),
        paymentChannel: selectedChannel,
        senderNumber: senderNumber.trim(),
        paymentProofUrl: paymentProofImage || undefined,
        paidAmount: payableAmount,
        notes: `অনলাইন পেমেন্ট (${activeChannelConfig.name}) | TrxID: ${transactionId.trim().toUpperCase()}${
          senderNumber.trim() ? ` | প্রেরক: ${senderNumber.trim()}` : ''
        }`,
      });

      if (success) {
        // Create in-app notification for user
        createNotificationInFirestore({
          userId: order.userId || 'guest',
          title: 'পেমেন্ট ভেরিফিকেশনের জন্য পাঠানো হয়েছে ✅',
          message: `অর্ডার #${order.orderNumber} এর জন্য ${activeChannelConfig.name} পেমেন্ট (TrxID: ${transactionId.trim().toUpperCase()}) সফলভাবে জমা হয়েছে।`,
          type: 'order',
          link: `/checkout/success/${order.id}`,
        }).catch(console.warn);

        // Notify admin for verification
        createNotificationInFirestore({
          userId: 'admin',
          title: `নতুন অনলাইন পেমেন্ট (${activeChannelConfig.name}) 💰`,
          message: `অর্ডার #${order.orderNumber} এর জন্য TrxID: ${transactionId.trim().toUpperCase()} জমা পড়েছে। অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে ভেরিফাই করুন।`,
          type: 'order',
          link: `/admin/orders`,
        }).catch(console.warn);

        toast.success('পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে! অ্যাডমিন যাচাই করার পর অর্ডারটি কনফার্ম করা হবে।');
        navigate(`/checkout/success/${order.id}`, {
          replace: true,
          state: {
            order: {
              ...order,
              transactionId: transactionId.trim().toUpperCase(),
              paymentChannel: selectedChannel,
              senderNumber: senderNumber.trim(),
              paymentProofUrl: paymentProofImage,
              paymentStatus: 'pending',
              orderStatus: 'pending',
            },
          },
        });
      } else {
        toast.error('পেমেন্ট তথ্য সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      }
    } catch (err) {
      console.error('Payment submit error:', err);
      toast.error('পেমেন্ট সাবমিট করতে ত্রুটি দেখা দিয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00BFA5]" />
        <p className="text-xs font-bold text-slate-500">পেমেন্ট গেটওয়ে লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1.5">অর্ডারের তথ্য লোড হচ্ছে</h2>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          আপনার অর্ডারটি প্রক্রিয়াধীন রয়েছে। সরাসরি অর্ডার ট্র্যাকিং পেজ অথবা হোমে গিয়ে অর্ডারের অবস্থা দেখতে পারেন।
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/orders/track"
            className="px-4 py-2.5 bg-[#00BFA5] text-white rounded-xl font-bold text-xs shadow-xs hover:bg-[#00A892] transition-colors"
          >
            অর্ডার ট্র্যাক করুন
          </Link>
          <Link
            to="/"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10">
      <Helmet>
        <title>{`অনলাইন পেমেন্ট — অর্ডার #${order.orderNumber || order.id.slice(-6)} | BD SHOPS`}</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00BFA5] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> ব্যাকে যান
          </button>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>১০০% নিরাপদ ও এনক্রিপ্টেড পেমেন্ট</span>
          </div>
        </div>

        {/* ORDER AMOUNT HEADER CARD */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#00BFA5]/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/50">
                  অর্ডার আইডি: #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-400">({order.items?.length || 1}টি আইটেম)</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white">অনলাইন পেমেন্ট সম্পন্ন করুন</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                গ্রাহক: <span className="font-semibold text-white">{order.customerName}</span> | {order.district}
              </p>
            </div>

            <div className="sm:text-right bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0">
              <span className="text-[10px] text-slate-300 block uppercase tracking-wider font-bold">
                মোট প্রদেয় বিল
              </span>
              <span className="text-2xl sm:text-3xl font-black text-teal-300">
                {APP_CONFIG.currency}{payableAmount.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT CHANNELS SELECTION TABS */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs mb-6">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 mb-3.5 flex items-center justify-between">
            <span>১. পেমেন্ট মাধ্যম বেছে নিন</span>
            <span className="text-[11px] font-normal text-slate-400">যে কোনো একটি মাধ্যম সিলেক্ট করুন</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {availableChannels.map((channel) => {
              const isSelected = activeChannelConfig.id === channel.id;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? `${channel.activeRing} shadow-xs scale-[1.02]`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-sm sm:text-base ${channel.color}`}>
                      {channel.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">
                    {channel.bengaliName}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${channel.badgeBg} ${channel.badgeText}`}
                  >
                    {channel.type.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE PAYMENT NUMBER BOX */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  {activeChannelConfig.name} {activeChannelConfig.type} নম্বর
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-slate-900 tracking-wider">
                  {activeChannelConfig.number}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#00BFA5]" />
                <span>নম্বর কপি করুন</span>
              </button>
            </div>

            {/* INSTRUCTIONS */}
            <div className="pt-3 border-t border-slate-200/80">
              <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                <Info className="w-3.5 h-3.5 text-[#00BFA5]" />
                টাকা পাঠানোর সহজ ধাপগুলো:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-xs pl-1">
                {activeChannelConfig.steps.map((st, i) => (
                  <li key={i} className="leading-relaxed">
                    {st}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* PAYMENT PROOF & SUBMISSION FORM */}
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>২. পেমেন্ট প্রমাণ তথ্য প্রদান করুন</span>
              <span className="text-[11px] font-normal text-rose-500">* চিহ্নিত ঘরগুলো বাধ্যতামূলক</span>
            </h2>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                placeholder="যেমন: 9X48LK590 বা BL830200"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono uppercase tracking-wider font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                টাকা পাঠানোর পর কনফার্মেশন এসএমএস অথবা অ্যাপের স্টেটমেন্টে থাকা ৮-১০ অক্ষরের ট্রানজেকশন আইডিটি দিন।
              </p>
            </div>

            {/* Sender Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                যে নম্বর থেকে টাকা পাঠিয়েছেন (ঐচ্ছিক)
              </label>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="যেমন: 018XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
              />
            </div>

            {/* PROOF OF PAYMENT PICTURE UPLOAD AND PREVIEW */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  পেমেন্ট প্রুফ / স্ক্রিনশট ছবি আপলোড (Proof Picture)
                </label>
                <span className="text-[10px] text-teal-600 bg-teal-50 font-bold px-2 py-0.5 rounded-full">
                  দ্রুত ভেরিফিকেশনের জন্য
                </span>
              </div>

              {!paymentProofImage ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#00BFA5] hover:bg-teal-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-400 group-hover:text-[#00BFA5] mb-2 transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 group-hover:text-[#00BFA5]">
                    স্ক্রিনশট বা রসিদের ছবি আপলোড করতে ক্লিক করুন
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG বা JPEG (সর্বোচ্চ 5MB)</p>
                </label>
              ) : (
                /* LIVE PREVIEW CARD */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setPreviewModalOpen(true)}
                      className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 relative group cursor-pointer"
                    >
                      <img
                        src={paymentProofImage}
                        alt="Payment Proof Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {imageFileName || 'পেমেন্ট স্ক্রিনশট ছবি'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="text-[11px] font-bold text-[#00796B] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> বড় আকারে প্রিভিউ দেখুন
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="ছবি মুছে ফেলুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-[#00BFA5] hover:bg-[#00A892] disabled:opacity-50 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#00BFA5]/25 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পেমেন্ট তথ্য যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পেমেন্ট নিশ্চিত করুন (৳{payableAmount.toLocaleString('bn-BD')})</span>
                </>
              )}
            </button>

            {paymentSettings.isCodEnabled !== false && (
              <button
                type="button"
                onClick={async () => {
                  if (!order) return;
                  try {
                    setSubmitting(true);
                    await updateOrderPaymentProof(order.id, {
                      transactionId: 'COD-SELECTED',
                      paymentChannel: 'bkash',
                      notes: 'ক্যাশ অন ডেলিভারি (Cash on Delivery) হিসেবে পরিবর্তন করা হয়েছে',
                    });
                    toast.success('ক্যাশ অন ডেলিভারিতে সফলভাবে অর্ডার সংরক্ষিত হয়েছে!');
                    navigate(`/checkout/success/${order.id}`, {
                      state: { order: { ...order, paymentMethod: 'cash_on_delivery' } },
                    });
                  } catch {
                    toast.error('পরিবর্তন করতে সমস্যা হয়েছে');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                টাকা পাঠাতে সমস্যা হচ্ছে? ক্যাশ অন ডেলিভারিতে রূপান্তর করুন
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <PhoneCall className="w-3.5 h-3.5 text-[#00BFA5]" />
              <span>
                কোনো সমস্যা হলে কাস্টমার কেয়ারে কল করুন: {APP_CONFIG.supportPhone}
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {previewModalOpen && paymentProofImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-[#00BFA5]" />
                পেমেন্ট রসিদ / স্ক্রিনশট প্রিভিউ
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={paymentProofImage}
                alt="Proof Full Preview"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="p-3 bg-white text-center">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
