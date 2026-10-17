/**
 * BD SHOPS — Master Application Layout
 * Shell providing Header, Main Content, Footer, Mobile Bottom Nav, WhatsApp Floating Support & Scroll-To-Top Button
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNavigation } from './BottomNavigation';
import { ScrollToTopButton } from './ScrollToTopButton';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Power, AlertCircle } from 'lucide-react';

export const Layout: React.FC = () => {
  const { role } = useAuth();
  const { settings: storeSettings } = useSettings();

  const isOffline = storeSettings?.isStoreOnline === false;
  const isAdmin = role === 'admin' || role === 'super_admin';

  if (isOffline && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-6 shadow-xl">
          <Power className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          {storeSettings?.siteName || 'Black Zone'}
        </h1>
        <div className="max-w-md bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-sm text-slate-300 space-y-3">
          <p className="font-bold text-amber-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            ওয়েবসাইট সাময়িক বন্ধ আছে
          </p>
          <p>{storeSettings?.maintenanceNotice || 'ওয়েবসাইট মেইনটেন্যান্স বা সাময়িক উন্নয়নের কাজ চলছে। কিছুক্ষণের মধ্যে আবার চালু হবে।'}</p>
        </div>
        <p className="text-xs text-slate-500 mt-8">
          জরুরী প্রয়োজনে যোগাযোগ করুন: {storeSettings?.supportPhone || '01796983725'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased font-sans selection:bg-[#00BFA5] selection:text-white">
      {isOffline && isAdmin && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2">
          <Power className="w-4 h-4" />
          <span>সাইট অন/অফ সুইচ: বর্তমানে ওয়েবসাইট মেইনটেন্যান্স মোডে অন অফ রয়েছে। (অ্যাডমিন ভিউ)</span>
        </div>
      )}

      {/* Top Application Header (Sticky Desktop & Mobile) */}
      <Header />

      {/* Main Page Body Viewport */}
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Floating Animated Scroll-To-Top Button */}
      <ScrollToTopButton />

      {/* Global Application Footer */}
      <Footer />

      {/* Mobile Sticky Bottom App Bar */}
      <BottomNavigation />
    </div>
  );
};
