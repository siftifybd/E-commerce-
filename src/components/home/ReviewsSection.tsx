/**
 * BD SHOPS — Customer Reviews & Testimonials Section
 * Managed via Admin Settings (Review list and Show/Hide toggle)
 */

import React from 'react';
import { Star, Quote, User } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const ReviewsSection: React.FC = () => {
  const { settings } = useSettings();
  const reviews = settings.features?.reviews || [];
  const isEnabled = settings.features?.reviewsEnabled ?? true;

  if (!isEnabled || reviews.length === 0) return null;

  return (
    <section className="py-12 px-4 bg-slate-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Star className="w-3 h-3 fill-current" />
            সন্তুষ্ট গ্রাহকদের কথা
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
            আমাদের ওপর গ্রাহকদের ভরসা
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
            হাজারো গ্রাহক আমাদের পণ্য ও সেবায় সন্তুষ্ট। তাদের কিছু মতামত এখানে তুলে ধরা হলো।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-8 w-10 h-10 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              <p className="text-slate-600 font-medium leading-relaxed mb-6 italic">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  {review.image ? (
                    <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{review.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(review.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden">
                   <User className="w-4 h-4 text-slate-300" />
                </div>
              ))}
            </div>
            <p className="text-xs font-black text-slate-700">
              <span className="text-orange-600">+৫০০</span> এর বেশি পজিটিভ রিভিউ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
