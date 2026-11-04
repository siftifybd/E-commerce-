/**
 * BD SHOPS — Live Order Tracking Page
 * Real-time shipping status and estimated delivery time directly from Firestore
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  Check,
  AlertCircle,
  Truck,
  PhoneCall,
  Clock,
  Calendar,
  ShieldCheck,
  Activity,
  ArrowRight,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  trackOrderByNumberOrPhone,
  subscribeToOrderRealtime,
  calculateEstimatedDelivery,
  getBengaliOrderStatus,
} from '../../services/orders';
import { Order, OrderStatus } from '../../types';
import { APP_CONFIG } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

const TIMELINE_STAGES: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'অর্ডার গৃহীত', desc: 'অর্ডার যাচাই করা হচ্ছে' },
  { status: 'confirmed', label: 'নিশ্চিত', desc: 'অর্ডার ভেরিফিকেশন সম্পন্ন' },
  { status: 'processing', label: 'প্যাকেজিং', desc: 'পণ্য প্রস্তুত ও প্যাকিং হচ্ছে' },
  { status: 'shipped', label: 'পথে রয়েছে', desc: 'কুরিয়ারে হস্তান্তর করা হয়েছে' },
  { status: 'delivered', label: 'ডেলিভার্ড', desc: 'গ্রাহকের নিকট পৌঁছে গেছে' },
];

export const TrackOrderPage: React.FC = () => {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('id') || searchParams.get('orderId') || '';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Reference to hold Firestore realtime unsubscribe callback
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Clean up any ongoing subscription
  const cleanupSubscription = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsLiveConnected(false);
    }
  };

  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, []);

  // Connect real-time listener when an order is selected
  useEffect(() => {
    cleanupSubscription();

    if (selectedOrder?.id || selectedOrder?.orderNumber) {
      const targetIdentifier = selectedOrder.id || selectedOrder.orderNumber;
      setIsLiveConnected(true);

      unsubscribeRef.current = subscribeToOrderRealtime(
        targetIdentifier,
        (updatedOrder) => {
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          }
        },
        (error) => {
          console.warn('Realtime sync warning (using cached view):', error);
          setIsLiveConnected(false);
        }
      );
    }
  }, [selectedOrder?.id, selectedOrder?.orderNumber]);

  const handleTrack = async (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      toast.error('অর্ডার আইডি, ট্র্যাকিং নম্বর বা মোবাইল নম্বর লিখুন');
      return;
    }

    cleanupSubscription();
    setLoading(true);
    setSearched(true);

    try {
      const results = await trackOrderByNumberOrPhone(cleanTerm);
      setOrders(results);
      if (results.length > 0) {
        setSelectedOrder(results[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Tracking query error:', err);
      toast.error('তথ্য অনুসন্ধানে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearch) {
      handleTrack(initialSearch);
    }
  }, [initialSearch]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTerm = searchInput.trim();
    setSearchParams({ search: cleanTerm });
    handleTrack(cleanTerm);
  };

  // Stage progress index calculation
  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  // Estimated delivery calculation for the selected order
  const deliveryEstimate = selectedOrder
    ? calculateEstimatedDelivery(
        selectedOrder.createdAt,
        (selectedOrder as any).shippingAddress?.deliveryZone || (selectedOrder as any).deliveryAddress?.deliveryZone,
        (selectedOrder as any).shippingAddress?.district || (selectedOrder as any).district
      )
    : null;

  return (
    <div className="min-h-screen pb-16 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>লাইভ অর্ডার ট্র্যাকিং ও ডেলিভারির সময় — {settings.siteName || APP_CONFIG.name || 'Black Zone'}</title>
        <meta
          name="description"
          content="আপনার অর্ডার আইডি দিয়ে সরাসরি ফায়ারস্টোর থেকে রিয়েল-টাইম শিপিং স্ট্যাটাস ও সম্ভাব্য ডেলিভারির সময় ট্র্যাক করুন।"
        />
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER & SEARCH CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2F1] text-[#00BFA5] flex items-center justify-center mx-auto shadow-xs">
            <Truck className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              অর্ডার লাইভ শিপিং ট্র্যাকিং
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার <strong className="text-slate-700">Order ID</strong> (যেমন: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#00BFA5]">ord_xxx</code>), ট্র্যাকিং নম্বর (যেমন: <strong className="text-slate-700">BDS-2025-XXXX</strong>) অথবা ১১ ডিজিটের মোবাইল নম্বর লিখুন
            </p>
          </div>

          <form onSubmit={onSearchSubmit} className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার আইডি, নম্বর বা ফোন..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 sm:px-6 py-3 bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-[#00BFA5]/25 transition-transform active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>খোঁজা হচ্ছে...</span>
                </>
              ) : (
                <span>ট্র্যাক করুন</span>
              )}
            </button>
          </form>
        </div>

        {/* NOT FOUND NOTIFICATION */}
        {searched && orders.length === 0 && !loading && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">কোনো অর্ডার পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              আপনার দেওয়া আইডি বা নম্বরটি দিয়ে কোনো সক্রিয় অর্ডার রেকর্ড পাওয়া যায়নি। দয়া করে সঠিক অর্ডার আইডি বা ট্র্যাকিং নম্বর দিয়ে আবার চেষ্টা করুন।
            </p>
          </div>
        )}

        {/* MULTIPLE ORDERS SELECTOR IF SEARCHED BY PHONE */}
        {orders.length > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-600">এই নম্বরে একাধিক অর্ডার পাওয়া গেছে:</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {orders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    selectedOrder?.id === ord.id
                      ? 'bg-[#00BFA5] text-white border-[#00BFA5] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ord.orderNumber} (৳{(ord.grandTotal || ord.total || 0).toLocaleString('bn-BD')})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SELECTED ORDER TRACKING TIMELINE & REALTIME DETAILS */}
        {selectedOrder && (
          <div className="space-y-6">
            {/* REAL-TIME LIVE STATUS & ORDER HEADER */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">অর্ডার ট্র্যাকিং নম্বর</span>
                  {isLiveConnected && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      লাইভ কানেক্টেড
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 flex items-center gap-2">
                  {selectedOrder.orderNumber}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500">
                  <span>আইডি: <code className="font-mono text-slate-700">{selectedOrder.id}</code></span>
                  <span>•</span>
                  <span>অর্ডারের সময়: {new Date(selectedOrder.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div>
                {(() => {
                  const badge = getBengaliOrderStatus(selectedOrder.orderStatus);
                  return (
                    <span className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 shadow-xs ${badge.bg} ${badge.textClass}`}>
                      <Activity className="w-3.5 h-3.5" />
                      {badge.text}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* ESTIMATED DELIVERY TIME CARD */}
            {deliveryEstimate && selectedOrder.orderStatus !== 'cancelled' && (
              <div className="bg-gradient-to-r from-[#E0F2F1] via-teal-50 to-emerald-50 rounded-3xl p-5 sm:p-6 border border-[#00BFA5]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-teal-100">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#00796B] uppercase tracking-wider">
                      সম্ভাব্য ডেলিভারির তারিখ ও সময়
                    </h3>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                      {selectedOrder.orderStatus === 'delivered' ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <PackageCheck className="w-5 h-5" /> পণ্যটি সফলভাবে ডেলিভারি সম্পন্ন হয়েছে
                        </span>
                      ) : (
                        deliveryEstimate.displayText
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ডেলিভারি এরিয়া:{' '}
                      <strong>
                        {(selectedOrder as any).shippingAddress?.district || (selectedOrder as any).district || 'বাংলাদেশ'}
                      </strong>{' '}
                      • কুরিয়ার পার্টনার দ্রুততম সময়ে আপনার ঠিকানায় পৌঁছে দেবে
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-slate-700 border border-slate-200 shadow-xs">
                    {selectedOrder.paymentMethod === 'cod' || selectedOrder.paymentMethod === 'cash_on_delivery'
                      ? 'ক্যাশ অন ডেলিভারি'
                      : 'অনলাইন পেমেন্ট'}
                  </span>
                  {selectedOrder.paymentMethod === 'online_payment' && selectedOrder.paymentStatus === 'pending' && (
                    <Link
                      to={`/payment/${selectedOrder.id}`}
                      state={{ order: selectedOrder }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-xs transition-colors"
                    >
                      পেমেন্ট করুন →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* TIMELINE PROGRESS COMPONENT */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00BFA5]" />
                ডেলিভারি অগ্রগতি (Live Delivery Stages)
              </h3>

              {selectedOrder.orderStatus === 'cancelled' ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  দুঃখিত, এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে কাস্টমার সাপোর্টে যোগাযোগ করুন।
                </div>
              ) : (
                <div className="relative">
                  {/* Stages List */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 relative z-10">
                    {TIMELINE_STAGES.map((stg, idx) => {
                      const currentIdx = getStageIndex(selectedOrder.orderStatus);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={stg.status}
                          className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 sm:p-2.5 rounded-2xl transition-all ${
                            isCurrent
                              ? 'bg-emerald-50 border border-emerald-300 shadow-xs'
                              : 'bg-slate-50/50'
                          }`}
                        >
                          {/* Step Circle */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-xs ${
                              isCompleted
                                ? 'bg-[#00BFA5] text-white'
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div>
                            <h4
                              className={`text-xs font-bold ${
                                isCompleted ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {stg.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                              {stg.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ORDER ITEMS & DELIVERY DETAILS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  পণ্যসমূহ ({selectedOrder.items?.length || 0}টি)
                </h3>
                <span className="text-xs font-bold text-[#00BFA5]">
                  সর্বমোট: ৳{(selectedOrder.grandTotal || selectedOrder.total || 0).toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {(selectedOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || item.productImage}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div>
                        <Link
                          to={`/product/${item.slug || item.productId}`}
                          className="font-bold text-slate-800 hover:text-[#00BFA5] line-clamp-1"
                        >
                          {item.name || item.productName}
                        </Link>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.quantity}টি × ৳{item.price}
                          {item.selectedSize && ` | সাইজ: ${item.selectedSize}`}
                          {item.selectedColor && ` | রঙ: ${item.selectedColor}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 ml-2 shrink-0">
                      ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Address & Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800 mb-1">গ্রাহকের তথ্য:</p>
                  <p className="font-medium text-slate-700">
                    {selectedOrder.customerName || selectedOrder.customerInfo?.fullName}
                  </p>
                  <p>{selectedOrder.customerPhone || selectedOrder.phone || selectedOrder.customerInfo?.phone}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">ডেলিভারি গন্তব্য:</p>
                  <p className="text-slate-700">
                    {(selectedOrder as any).shippingAddress?.address || (selectedOrder as any).address}
                  </p>
                  <p className="font-medium text-slate-800">
                    জেলা: {(selectedOrder as any).shippingAddress?.district || (selectedOrder as any).district || 'ঢাকা'}
                  </p>
                </div>
              </div>
            </div>

            {/* DIRECT SUPPORT & CALL */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs gap-3">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <PhoneCall className="w-4 h-4 text-[#00BFA5] shrink-0" />
                <span>ডেলিভারি বা পার্সেল সংক্রান্ত প্রয়োজনে সরাসরি যোগাযোগ করুন:</span>
              </div>
              <a
                href={`tel:${APP_CONFIG.supportPhone}`}
                className="px-4 py-2 bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                কল করুন: {APP_CONFIG.supportPhone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
