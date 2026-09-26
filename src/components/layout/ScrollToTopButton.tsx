/**
 * BD SHOPS — Animated Scroll To Top Button
 * Displays an elegant floating button with circular scroll-progress indicator,
 * bounce animations, and smooth scrolling to the top of the page.
 */

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const progress = (scrollTop / scrollHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      // Show button when scrolled down past 280px
      if (scrollTop > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Circular progress calculations for SVG
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-20 left-4 sm:bottom-8 sm:left-8 z-40 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-8 scale-75 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        aria-label="উপরে স্ক্রল করুন (Scroll to top)"
        title="উপরে স্ক্রল করুন"
        className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-xl hover:shadow-2xl flex items-center justify-center text-slate-700 hover:text-white transition-all duration-300 border border-slate-100 cursor-pointer overflow-hidden active:scale-90"
      >
        {/* Background gradient fill on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00796B] to-[#00BFA5] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Circular Progress Bar SVG */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
          viewBox="0 0 52 52"
        >
          {/* Background track */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            className="text-slate-100 stroke-current"
            strokeWidth="3.5"
            fill="transparent"
          />
          {/* Animated active progress */}
          <circle
            cx="26"
            cy="26"
            r={radius}
            className="text-[#00BFA5] group-hover:text-white stroke-current transition-all duration-150"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Arrow Icon with Bounce Animation */}
        <span className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5">
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#00796B] group-hover:text-white transition-colors duration-300 stroke-[2.5]" />
        </span>

        {/* Subtle Tooltip on Desktop */}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
          উপরে যান
        </span>
      </button>
    </div>
  );
};
