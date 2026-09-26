/**
 * BD SHOPS — Customer Orders History Page
 * Full order list, status tracking badges, items breakdown & 1-click reorder
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Calendar,
  Truck,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchOrderById, 
  getBengaliOrderStatus, 
  subscribeToUserOrders 
} from '../../services/orders';
import { useCartStore } from '../../store/useCartStore';
import { Order } from '../../types';
import { APP_CONFIG } from '../../constants';

export const OrdersHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCartStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadOrders = async () => {
      setLoading(true);
      try {
        if (currentUser) {
          // Use real-time subscription for logged-in users
          unsubscribe = subscribeToUserOrders(
            currentUser.uid,
            (userOrders) => {
              setOrders(userOrders);
              setLoading(false);
            },
            (err) => {
              console.error('Real-time fetch error:', err);
              setLoading(false);
            }
          );
        } else {
          // Guest order history via localStorage order ids
          const storedIds: string[] = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
          if (storedIds.length > 0) {
            const fetched = await Promise.all(storedIds.map((id) => fetchOrderById(id)));
            setOrders(fetched.filter((o): o is Order => o !== null));
          } else {
            setOrders([]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setLoading(false);
      }
    };

    loadOrders();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleReorderItem = (item: Order['items'][0]) => {
    addToCart(
      {
        id: item.productId,
        name: item.name,
        slug: item.slug || '',
        description: '',
        image: item.image,
        images: [item.image],
        price: item.price,
        stock: 50,
        stockStatus: 'in_stock',
        categoryId: 'cat_general',
        categoryName: 'পণ্য',
        sku: 'BD-REORDER',
        tags: [],
        rating: 5,
        reviewCount: 1,
        createdAt: new Date().toISOString(),
      },
      item.quantity,
      undefined,
      item.selectedSize || undefined,
      item.selectedColor || undefined
    );
    toast.success(`${item.name} কার্টে যোগ করা হয়েছে!`);
    navigate('/cart');
  };

  const handleChatWithSeller = (order: Order) => {
    // If order has items, we can pre-tag the first product in chat
    const firstItem = order.items[0];
    if (firstItem && firstItem.productId) {
      navigate(`/chat?product=${firstItem.productId}&order=${order.orderNumber}`);
    } else {
      navigate(`/chat?order=${order.orderNumber}`);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 bg-[#F8FAFC]">
      <Helmet>
        <title>আমার অর্ডারসমূহ — BD SHOPS</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#00BFA5]" />
              আমার পূর্ববর্তী অর্ডারসমূহ
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনার সকল অর্ডারের তালিকা এবং বর্তমান স্ট্যাটাস
            </p>
          </div>
          <Link
            to="/orders/track"
            className="px-3.5 py-2 bg-[#E0F2F1] text-[#00796B] hover:bg-[#00BFA5] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            লাইভ ট্র্যাক
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-3xl animate-shimmer" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">এখনও কোনো অর্ডার করেননি</h3>
            <p className="text-xs text-slate-500">
              আপনার পছন্দের পণ্য নির্বাচন করুন এবং প্রথম অর্ডারটি সম্পন্ন করুন।
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#00BFA5] text-white font-bold text-xs rounded-full shadow-md"
            >
              কেনাকাটা শুরু করুন <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusBadge = getBengaliOrderStatus(order.orderStatus);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${statusBadge.bg} ${statusBadge.textClass}`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString('bn-BD')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleChatWithSeller(order)}
                        className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all flex items-center gap-2 shadow-xs group"
                        title="সেলার বা অ্যাডমিনের সাথে চ্যাট করুন"
                      >
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold hidden sm:inline">চ্যাট করুন</span>
                      </button>

                      <div className="text-right border-l border-slate-100 pl-3">
                        <span className="text-[11px] text-slate-400 block">সর্বমোট</span>
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {APP_CONFIG.currency}{order.total.toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <Link
                              to={`/product/${item.slug}`}
                              className="font-semibold text-slate-800 hover:text-[#00BFA5] line-clamp-1"
                            >
                              {item.name}
                            </Link>
                            <span className="text-[10px] text-slate-400">
                              {item.quantity}টি • {APP_CONFIG.currency}{item.price}
                              {item.selectedSize ? ` • সাইজ: ${item.selectedSize}` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReorderItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#E0F2F1] text-slate-600 hover:text-[#00796B] text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          পুনরায় অর্ডার
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2 flex-wrap">
                    <span className="text-slate-500 font-medium">
                      পেমেন্ট: {order.paymentMethod === 'cash_on_delivery' ? 'ক্যাশ অন ডেলিভারি' : order.paymentMethod.toUpperCase()}
                      {order.paymentStatus === 'pending' && order.paymentMethod === 'online_payment' && (
                        <span className="ml-1 text-amber-600 font-bold">(বাকি আছে)</span>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {order.paymentMethod === 'online_payment' && order.paymentStatus === 'pending' && (
                        <Link
                          to={`/payment/${order.id}`}
                          state={{ order }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-2xs"
                        >
                          এখনই পেমেন্ট করুন
                        </Link>
                      )}
                      <Link
                        to={`/orders/track?search=${order.orderNumber}`}
                        className="inline-flex items-center gap-1 font-bold text-[#00BFA5] hover:underline"
                      >
                        <Truck className="w-3.5 h-3.5" /> ট্র্যাক করুন <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
