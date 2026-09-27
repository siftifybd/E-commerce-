/**
 * BD SHOPS — Master Application Router
 * Full routing hierarchy, scroll management, global state & toast providers
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Layout
import { Layout } from './components/layout/Layout';

// Common Components
import { TopNoticeBar } from './components/common/TopNoticeBar';
import { PromoModal } from './components/common/PromoModal';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CategoriesPage } from './pages/Categories/CategoriesPage';
import { CartPage } from './pages/Cart/CartPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { PaymentPage } from './pages/Checkout/PaymentPage';
import { OrderSuccessPage } from './pages/Checkout/OrderSuccessPage';
import { TrackOrderPage } from './pages/Orders/TrackOrderPage';
import { OrdersHistoryPage } from './pages/Account/OrdersHistoryPage';
import { ProfilePage } from './pages/Account/ProfilePage';
import { WishlistPage } from './pages/Wishlist/WishlistPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';
import { LiveChatPage } from './pages/LiveChat/LiveChatPage';
import { AdminPortalPage } from './pages/Admin/AdminPortalPage';
import { DeliveryPortalPage } from './pages/Delivery/DeliveryPortalPage';
import { StaffPortalPage } from './pages/Staff/StaffPortalPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import {
  ContactPage,
  RefundPolicyPage,
  PrivacyPolicyPage,
  TermsPage,
} from './pages/Static/PolicyPages';
import { CustomPage } from './pages/Static/CustomPage';

/**
 * Scroll to top automatically when route changes
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('SW registered:', reg),
        (err) => console.log('SW registration failed:', err)
      );
    }
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <ScrollToTop />
          <TopNoticeBar />
          <PromoModal />
          <FloatingWhatsApp />
          <PWAInstallPrompt />

          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1E293B',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '12px 18px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: '#00BFA5',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />

          <Routes>
            {/* Standalone Master Admin Portal (accessed directly via /admin.html or /admin) */}
            <Route path="/admin.html" element={<AdminPortalPage />} />
            <Route path="/admin" element={<AdminPortalPage />} />
            <Route path="/admin/orders" element={<AdminPortalPage />} />
            <Route path="/admin/products" element={<AdminPortalPage />} />

            {/* Standalone Delivery Man Portal (accessed via custom link /portal/delivery or /delivery) */}
            <Route path="/portal/delivery" element={<DeliveryPortalPage />} />
            <Route path="/delivery" element={<DeliveryPortalPage />} />
            <Route path="/delivery-portal" element={<DeliveryPortalPage />} />

            {/* Standalone Staff / Moderator Portal (accessed via custom link /portal/staff or /staff) */}
            <Route path="/portal/staff" element={<StaffPortalPage />} />
            <Route path="/staff" element={<StaffPortalPage />} />
            <Route path="/staff-portal" element={<StaffPortalPage />} />

            {/* Standalone Authentication Views */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Standalone Distraction-free Views */}
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/checkout/payment/:orderId" element={<PaymentPage />} />
            <Route path="/checkout/success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/chat" element={<LiveChatPage />} />

            {/* Standard Main Layout Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />
              <Route path="product/:slug" element={<ProductDetailPage />} />
              <Route path="search" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="category/:categorySlug" element={<ProductsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="orders" element={<OrdersHistoryPage />} />
              <Route path="orders/track" element={<TrackOrderPage />} />

              {/* Profile & Account Routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="account" element={<ProfilePage />} />
              <Route path="account/profile" element={<ProfilePage />} />
              <Route path="account/orders" element={<OrdersHistoryPage />} />
              <Route path="account/wishlist" element={<WishlistPage />} />

              {/* Admin Control Routes */}
              <Route path="admin/portal" element={<AdminPortalPage />} />
              <Route path="admin/settings" element={<Navigate to="/admin?tab=system" replace />} />

              {/* Notifications Route */}
              <Route path="notifications" element={<NotificationsPage />} />

              {/* Policy & Support Pages */}
              <Route path="contact" element={<ContactPage />} />
              <Route path="refund-policy" element={<RefundPolicyPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="legal/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="legal/terms-and-conditions" element={<TermsPage />} />
              <Route path="legal/refund-policy" element={<RefundPolicyPage />} />
              <Route path="p/:slug" element={<CustomPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
