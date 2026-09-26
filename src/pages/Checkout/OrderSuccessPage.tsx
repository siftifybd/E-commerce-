/**
 * BD SHOPS — Order Success & Confirmation Screen
 * Tracking number display, Copy Tracking Link, Live invoice, WhatsApp confirmation & print receipt
 */

import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle,
  Package,
  Truck,
  Printer,
  ShoppingBag,
  Clock,
  MessageCircle,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  FileCheck2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchOrderById, calculateEstimatedDelivery } from '../../services/orders';
import { Order } from '../../types';
import { APP_CONFIG } from '../../constants';
import { getOrderSuccessWhatsAppLink } from '../../utils/whatsapp';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const stateOrder = (location.state as { order?: Order })?.order;

  const [order, setOrder] = useState<Order | null>(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    if (!stateOrder && orderId) {
      const load = async () => {
        setLoading(true);
        const data = await fetchOrderById(orderId);
        setOrder(data);
        setLoading(false);
      };
      load();
    }
  }, [stateOrder, orderId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#00BFA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-2">অর্ডার তথ্য পাওয়া যায়নি</h2>
        <p className="text-xs text-slate-500 mb-6">
          অনুগ্রহ করে আপনার অর্ডার আইডি বা ট্র্যাকিং নম্বর দিয়ে ট্র্যাকিং পেজে খোঁজ করুন।
        </p>
        <Link
          to="/orders/track"
          className="px-6 py-2.5 bg-[#00BFA5] text-white rounded-full font-bold text-xs shadow-md inline-block"
        >
          অর্ডার ট্র্যাক করুন
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const trackingUrl = `${window.location.origin}/orders/track?search=${order.orderNumber}`;

  const handleCopyTrackingLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackingUrl);
      } else {
        const input = document.createElement('input');
        input.value = trackingUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedTracking(true);
      toast.success('ট্র্যাকিং লিংক সফলভাবে কপি করা হয়েছে!');
      setTimeout(() => setCopiedTracking(false), 3000);
    } catch {
      toast.error('লিংক কপি করা যায়নি। অনুগ্রহ করে ম্যানুয়ালি কপি করুন।');
    }
  };

  const deliveryZone = (order as any).shippingAddress?.deliveryZone || (order as any).deliveryAddress?.deliveryZone;
  const district = (order as any).shippingAddress?.district || (order as any).district;
  const deliveryEstimate = calculateEstimatedDelivery(order.createdAt, deliveryZone, district);

  const customerName = order.customerName || order.customerInfo?.fullName || 'সম্মানিত গ্রাহক';
  const customerPhone = order.customerPhone || order.phone || order.customerInfo?.phone || '';
  const streetAddress = (order as any).shippingAddress?.address || (order as any).address || '';

  const grandTotal = order.grandTotal || order.total || 0;
  const subtotal = order.subtotal || grandTotal;
  const deliveryCharge = order.deliveryCharge || 0;
  const discount = order.discount || order.couponDiscount || 0;

  const whatsappConfirmUrl = getOrderSuccessWhatsAppLink(order);

  return (
    <div className="min-h-screen pb-16 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>{`অর্ডার নিশ্চিত হয়েছে — ${order.orderNumber} | BD SHOPS`}</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* SUCCESS CELEBRATION CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#00BFA5]" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              আলহামদুলিল্লাহ! আপনার অর্ডারটি গ্রহণ করা হয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আমাদের প্রতিনিধি শীঘ্রই কল করে আপনার ডেলিভারির ঠিকানা ভেরিফাই করবেন।
            </p>
          </div>

          {/* Tracking Number Highlight Box with Copy Link */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl inline-block max-w-full text-center">
            <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider mb-1">
              আপনার ট্র্যাকিং নম্বর (Tracking Number)
            </span>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#00796B] tracking-wider select-all">
                {order.orderNumber}
              </span>

              <button
                type="button"
                onClick={handleCopyTrackingLink}
                title="ট্র্যাকিং লিংক কপি করুন"
                aria-label="Copy tracking link"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copiedTracking
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                    : 'bg-[#00BFA5] hover:bg-[#00A892] text-white active:scale-95'
                }`}
              >
                {copiedTracking ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Tracking Link</span>
                  </>
                )}
              </button>
            </div>

            <span className="text-[10px] text-emerald-700 block mt-1.5">
              অর্ডার লাইভ ট্র্যাক করতে এই নম্বর অথবা লিংকটি সংরক্ষণ করুন
            </span>
          </div>

          {/* WhatsApp Direct Confirmation Button */}
          <div className="pt-1 print:hidden">
            <a
              href={whatsappConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>হোয়াটসঅ্যাপে অর্ডার কনফার্মেশন ও মেসেজ পাঠান</span>
            </a>
          </div>
        </div>

        {/* ESTIMATED DELIVERY DATE CARD */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-teal-200/80 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#00BFA5] flex items-center justify-center shrink-0 shadow-xs border border-teal-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#00796B] uppercase tracking-wider block">
              সম্ভাব্য ডেলিভারির তারিখ
            </span>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
              {deliveryEstimate.displayText}
            </p>
            <p className="text-[11px] text-slate-500">
              ডেলিভারি ঠিকানা: {district || 'বাংলাদেশ'} • কুরিয়ার পার্টনার দ্রুত পৌঁছে দেবে
            </p>
          </div>
        </div>

        {/* ORDER DETAILS SUMMARY / PRINTABLE INVOICE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 print:shadow-none print:border-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00BFA5]" />
              অর্ডার ও চালানের বিবরণ
            </h2>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#00BFA5] print:hidden px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট / সেভ করুন
            </button>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
            <div>
              <p className="text-slate-400 font-medium mb-0.5">গ্রাহকের নাম:</p>
              <p className="font-bold text-slate-800">{customerName}</p>
              <p className="text-slate-400 font-medium mt-2 mb-0.5">যোগাযোগ নম্বর:</p>
              <p className="font-bold text-slate-800">{customerPhone}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-0.5">ডেলিভারি ঠিকানা:</p>
              <p className="font-bold text-slate-800">{streetAddress}</p>
              <p className="font-medium text-slate-600">
                জেলা: {district} (
                {deliveryZone === 'insideDhaka' || district?.includes('ঢাকা') ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})
              </p>
              <p className="text-slate-400 font-medium mt-2 mb-0.5">পেমেন্ট মেথড:</p>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                {order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery' ? (
                  <span>ক্যাশ অন ডেলিভারি (হাতে পেয়ে টাকা দিন)</span>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>অনলাইন পেমেন্ট {order.paymentChannel ? `(${order.paymentChannel.toUpperCase()})` : ''}</span>
                  </>
                )}
              </p>
              {order.transactionId && (
                <p className="text-[11px] text-teal-700 font-mono mt-1 font-bold">
                  TrxID: {order.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Payment Proof Badge if uploaded */}
          {order.paymentProofUrl && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3">
              <img
                src={order.paymentProofUrl}
                alt="Payment Proof"
                className="w-12 h-12 rounded-xl object-cover border border-teal-200"
              />
              <div>
                <p className="text-xs font-bold text-teal-900 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                  পেমেন্ট স্ক্রিনশট যুক্ত করা হয়েছে
                </p>
                <p className="text-[10px] text-teal-600">আমাদের পেমেন্ট টিম এটি ভেরিফাই করছে।</p>
              </div>
            </div>
          )}

          {/* Purchased Items List */}
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || item.productImage}
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800 line-clamp-1">{item.name || item.productName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      পরিমাণ: {item.quantity}টি | একক মূল্য: ৳{item.price}
                      {item.selectedSize && ` | সাইজ: ${item.selectedSize}`}
                      {item.selectedColor && ` | কালার: ${item.selectedColor}`}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 ml-2 shrink-0">
                  ৳{(item.price * item.quantity).toLocaleString('bn-BD')}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>সাবটোটাল</span>
              <span className="font-semibold text-slate-900">
                ৳{subtotal.toLocaleString('bn-BD')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ</span>
              <span className="font-semibold text-slate-900">
                {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge.toLocaleString('bn-BD')}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>কুপন ছাড়</span>
                <span className="font-semibold">
                  -৳{discount.toLocaleString('bn-BD')}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
              <span>সর্বমোট পরিশোধযোগ্য</span>
              <span className="text-lg font-extrabold text-[#00BFA5]">
                ৳{grandTotal.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>

          {/* Delivery Support Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ডেলিভারি সংক্রান্ত যেকোনো তথ্য:</p>
              <p className="text-[11px] mt-0.5">
                ডেলিভারিম্যানের সামনে পার্সেলটি খুলে দেখে নেবেন। যেকোনো প্রয়োজনে কাস্টমার কেয়ারে কল করুন:{' '}
                <a href={`tel:${APP_CONFIG.supportPhone}`} className="font-bold underline text-amber-900">
                  {APP_CONFIG.supportPhone}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
          <Link
            to={`/orders/track?search=${order.orderNumber}`}
            className="w-full sm:flex-1 py-3.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl font-bold text-xs sm:text-sm text-center shadow-md shadow-[#00BFA5]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4" /> লাইভ পার্সেল ট্র্যাক করুন
          </Link>

          <button
            type="button"
            onClick={handleCopyTrackingLink}
            className="w-full sm:flex-1 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-[#00796B] border border-emerald-200 rounded-2xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedTracking ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedTracking ? 'ট্র্যাকিং লিংক কপি হয়েছে!' : 'Copy Tracking Link'}</span>
          </button>

          <Link
            to="/products"
            className="w-full sm:flex-1 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> আরও কেনাকাটা করুন
          </Link>
        </div>
      </div>
    </div>
  );
};
