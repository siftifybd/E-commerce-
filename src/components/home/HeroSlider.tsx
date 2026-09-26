/**
 * BD SHOPS — Dynamic Hero Slider
 * Fully controlled via Admin Settings (Banners array and Show/Hide toggle)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { CategorySidebar } from './CategorySidebar';
import { fetchCategories } from '../../services/products';
import { Category } from '../../types';

export const HeroSlider: React.FC = () => {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const banners = settings.features?.banners || [];
  const isEnabled = settings.features?.heroSliderEnabled ?? true;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    // Load categories for sidebar
    fetchCategories().then(cats => {
      setCategories(cats);
      setCatLoading(false);
    });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, currentIndex]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (!isEnabled) return null;

  const currentBanner = banners[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 overflow-visible">
      <div className="flex gap-4 items-start h-[220px] sm:h-[450px]">
        {/* DARAZ STYLE CATEGORY SIDEBAR (Desktop Only) */}
        <CategorySidebar categories={categories} loading={catLoading} />

        {/* HERO SLIDER (Desktop & Mobile) */}
        <div className="flex-1 relative h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 shadow-xl group">
          {banners.length > 0 ? (
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentBanner.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 }
                }}
                className="absolute inset-0 w-full h-full"
              >
                <div className="relative w-full h-full">
                  <img
                    src={currentBanner.image}
                    alt={currentBanner.title || 'Promotion'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with Content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-6 sm:p-12">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-2xl"
                    >
                      {(currentBanner as any).badge && (
                        <span className="inline-block px-3 py-1 bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase rounded-lg mb-3 shadow-lg">
                          {(currentBanner as any).badge}
                        </span>
                      )}
                      {currentBanner.title && (
                        <h2 className="text-xl sm:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">
                          {currentBanner.title}
                        </h2>
                      )}
                      {currentBanner.link && (
                        <Link
                          to={currentBanner.link}
                          className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3.5 bg-[#00BFA5] hover:bg-[#00796B] text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-[#00BFA5]/30 transition-all hover:scale-105 active:scale-95 text-xs sm:text-base"
                        >
                          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                          শপিং শুরু করুন
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <p className="text-slate-400 font-bold">অ্যাডমিন প্যানেল থেকে ব্যানার যোগ করুন</p>
             </div>
          )}

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-xl sm:rounded-2xl transition-all opacity-0 group-hover:opacity-100 hidden sm:block cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-xl sm:rounded-2xl transition-all opacity-0 group-hover:opacity-100 hidden sm:block cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 right-6 z-10 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 sm:w-8 bg-[#00BFA5]' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
