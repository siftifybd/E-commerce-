/**
 * BD SHOPS — Mobile Bottom Navigation Bar
 * Fixed mobile-first dock with safe-area support & live badges
 * Visibility condition: Hidden when user is not logged in / signed up. Visible only when authenticated.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, PackageCheck, User, MessageSquare } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuth } from '../../context/AuthContext';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { getTotalItemsCount } = useCartStore();
  const { currentUser, userProfile } = useAuth();
  const totalCartCount = getTotalItemsCount();

  // Hide bottom navigation if the user is NOT logged in or signed up
  if (!currentUser) {
    return null;
  }

  // Hide bottom navigation on checkout flow
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  if (isCheckoutPage) {
    return null;
  }

  const navLinks = [
    {
      to: '/',
      label: 'হোম',
      icon: Home,
      badge: null,
    },
    {
      to: '/categories',
      label: 'ক্যাটাগরি',
      icon: LayoutGrid,
      badge: null,
    },
    {
      to: '/cart',
      label: 'কার্ট',
      icon: ShoppingBag,
      badge: totalCartCount > 0 ? totalCartCount : null,
      badgeColor: 'bg-[#00BFA5]',
    },
    {
      to: '/chat',
      label: 'চ্যাট',
      icon: MessageSquare,
      badge: null,
    },
    {
      to: '/orders',
      label: 'অর্ডার',
      icon: PackageCheck,
      badge: null,
    },
    {
      to: '/account',
      label: 'প্রোফাইল',
      icon: User,
      badge: null,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] md:hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-15 max-w-lg mx-auto px-2">
        {navLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                isActive
                   ? 'text-[#00BFA5] font-semibold'
                   : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <div className="relative flex items-center justify-center">
                    {item.label === 'প্রোফাইল' && userProfile?.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="" 
                        className={`w-5 h-5 rounded-full object-cover border border-slate-200 shadow-xs transition-transform duration-200 ${
                          isActive ? 'scale-110' : ''
                        }`} 
                      />
                    ) : (
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'
                        }`}
                      />
                    )}
                    {item.badge !== null && (
                      <span
                        className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] ${
                          item.badgeColor || 'bg-rose-500'
                        } text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 tracking-tight truncate max-w-[64px]">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 bg-[#00BFA5] rounded-full" />
                  )}
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
