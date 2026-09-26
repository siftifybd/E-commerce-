/**
 * BD SHOPS — Dynamic Flash Sale Section
 * Features real-time countdown timer and admin-controlled visibility
 */

import React, { useState, useEffect } from 'react';
import { Timer, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { Product } from '../../types';
import { ProductCard } from '../product/ProductCard';

interface FlashSaleSectionProps {
  products: Product[];
  loading?: boolean;
}

interface TimeLeft {
  hours: string;
  minutes: string;
  seconds: string;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({ products, loading }) => {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: '00', minutes: '00', seconds: '00' });

  const isEnabled = settings.features?.flashSaleEnabled ?? false;
  const flashSaleEndTime = settings.features?.flashSaleEndTime;
  const title = settings.features?.flashSaleTitle || 'আজকের ধামাকা ফ্ল্যাশ সেল';

  useEffect(() => {
    if (!isEnabled || !flashSaleEndTime) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(flashSaleEndTime) - +new Date();
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        });
      } else {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, flashSaleEndTime]);

  if (!isEnabled) return null;

  return (
    <section className="py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-orange-100/50 border border-orange-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 bg-gradient-to-br from-orange-50 to-white">
            {/* Header Area */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 rotate-3 animate-pulse shrink-0">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    LIVE NOW
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown Area */}
            <div className="flex items-center gap-4 justify-between sm:justify-start">
              <div className="hidden sm:flex items-center gap-2">
                <Timer className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">শেষ হবে:</span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Mins', value: timeLeft.minutes },
                  { label: 'Secs', value: timeLeft.seconds },
                ].map((unit, idx) => (
                  <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-lg sm:text-xl font-black text-white tabular-nums">
                          {unit.value}
                        </span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {unit.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <span className="text-xl sm:text-2xl font-black text-slate-300 mb-4 sm:mb-5">:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* View All Action */}
            <Link
              to="/products"
              className="group flex items-center gap-3 bg-white hover:bg-slate-900 text-slate-900 hover:text-white px-6 py-3 rounded-2xl border-2 border-slate-900 transition-all font-black text-sm active:scale-95"
            >
              <span>সবগুলো দেখুন</span>
              <div className="bg-orange-600 rounded-full p-1 group-hover:bg-white transition-colors">
                <ChevronRight className="w-4 h-4 text-white group-hover:text-slate-900" />
              </div>
            </Link>
          </div>

          {/* Flash Sale Product Grid */}
          <div className="p-4 sm:p-6 bg-white/50 border-t border-orange-100">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-2xl aspect-[3/4] animate-pulse" />
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-slate-400 font-bold">বর্তমানে কোনো ফ্ল্যাশ সেল আইটেম নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
