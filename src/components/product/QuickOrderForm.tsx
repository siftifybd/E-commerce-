/**
 * BD SHOPS — 1-Click Quick Order Form
 * Allows customers to order instantly without cart flow
 */

import React, { useState } from 'react';
import { ShoppingCart, User, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { toast } from 'react-hot-toast';

interface QuickOrderFormProps {
  product: Product;
}

export const QuickOrderForm: React.FC<QuickOrderFormProps> = ({ product }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { clearCart, addToCart } = useCartStore();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    district: 'ঢাকা',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('দয়া করে সব তথ্য পূরণ করুন');
      return;
    }

    if (formData.phone.length < 11) {
      toast.error('সঠিক মোবাইল নম্বর দিন');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      toast.success('অর্ডার সফলভাবে গ্রহণ করা হয়েছে!');
      
      // In a real app, you'd send this to Firestore
      console.log('Quick Order Received:', {
        product,
        customer: formData,
        total: product.discountPrice || product.price,
        date: new Date().toISOString()
      });

    } catch (error) {
      toast.error('অর্ডার দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-100 rounded-3xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-black text-slate-900">ধন্যবাদ, আপনার অর্ডার সম্পন্ন হয়েছে!</h3>
        <p className="text-sm text-slate-600 font-medium">
          আমাদের একজন প্রতিনিধি শীঘ্রই আপনাকে ফোন করে অর্ডার কনফার্ম করবেন।
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-green-600 text-xs font-bold hover:underline"
        >
          নতুন অর্ডার করুন
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-tight">দ্রুত অর্ডার করুন</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">বিনা ঝামেলায় অর্ডার সম্পন্ন করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> আপনার নাম
          </label>
          <input
            type="text"
            required
            placeholder="যেমন: মো: রহিম হোসেন"
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" /> মোবাইল নম্বর
          </label>
          <input
            type="tel"
            required
            placeholder="যেমন: 017XXXXXXXX"
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        {/* Address Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> আপনার ঠিকানা
          </label>
          <textarea
            required
            rows={3}
            placeholder="যেমন: বাড়ি নম্বর, রোড নম্বর, এলাকা ও থানার নাম"
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm resize-none"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        {/* District Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-600 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> আপনার জেলা
          </label>
          <select
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-black text-sm"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          >
            <option value="ঢাকা">ঢাকা (চার্জ ৬০ টাকা)</option>
            <option value="ঢাকার বাইরে">ঢাকার বাইরে (চার্জ ১২০ টাকা)</option>
          </select>
        </div>

        {/* Order Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>অর্ডার কনফার্ম করুন</span>
            </>
          )}
        </button>
      </form>
      
      <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        অর্ডার সম্পন্ন করতে কোনো অগ্রিম টাকা লাগবে না
      </p>
    </div>
  );
};
