import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StoreSettings, subscribeToStoreSettings, DEFAULT_STORE_SETTINGS, saveStoreSettingsInFirestore } from '../services/settings';
import { toast } from 'react-hot-toast';
import { useCartStore } from '../store/useCartStore';

const SETTINGS_CACHE_KEY = 'bdshops_cached_settings';

// Helper to retrieve instantly cached settings from localStorage for zero-latency initial paint
const getInitialSettings = (): StoreSettings => {
  try {
    const cached = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_CACHE_KEY) : null;
    if (cached) {
      const parsed = JSON.parse(cached);
      const siteName = (parsed.siteName && typeof parsed.siteName === 'string' && parsed.siteName.trim())
        ? parsed.siteName.trim()
        : DEFAULT_STORE_SETTINGS.siteName;
      const siteLogo = parsed.siteLogo || DEFAULT_STORE_SETTINGS.siteLogo;
      const favicon = parsed.favicon || DEFAULT_STORE_SETTINGS.favicon;
      return {
        ...DEFAULT_STORE_SETTINGS,
        ...parsed,
        siteName,
        siteLogo,
        favicon,
        socialLinks: { ...DEFAULT_STORE_SETTINGS.socialLinks, ...(parsed.socialLinks || {}) },
        payments: { ...DEFAULT_STORE_SETTINGS.payments, ...(parsed.payments || {}) },
        features: { ...DEFAULT_STORE_SETTINGS.features, ...(parsed.features || {}) },
      };
    }
  } catch (err) {
    console.warn('Failed to parse cached settings from localStorage:', err);
  }
  return DEFAULT_STORE_SETTINGS;
};

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  saveSettings: (settingsToSave: StoreSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load instantly from localStorage cache so there is no layout shift or delayed info
  const [settings, setSettings] = useState<StoreSettings>(getInitialSettings);
  // If cache is already available, UI is immediately ready and fast
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' ? !localStorage.getItem(SETTINGS_CACHE_KEY) : true;
    } catch {
      return true;
    }
  });
  const [isDirty, setIsDirty] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const setCartSettings = useCartStore((state) => state.setSettings);

  // Sync with CartStore
  useEffect(() => {
    setCartSettings(settings);
  }, [settings, setCartSettings]);

  // Save to localStorage whenever settings state changes to guarantee ultra-fast subsequent loads
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }, [settings]);

  // Cross-tab synchronization: If updated in one tab (e.g., admin), other open tabs update immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SETTINGS_CACHE_KEY && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...fresh }));
        } catch (err) {
          console.warn('Storage sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply Real-time Theme, Favicon, Title, and Language Side Effects
  useEffect(() => {
    if (!settings) return;

    // 1. Dynamic Favicon
    if (settings.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon;
    }

    // 2. Dynamic Dark/Light Theme Mode
    const root = document.documentElement;
    if (settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (settings.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      // System mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // 3. Dynamic Primary Theme Color & Meta Theme
    if (settings.themeColor) {
      root.style.setProperty('--primary-theme-color', settings.themeColor);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', settings.themeColor);
    }

    // 4. Document Language
    if (settings.language) {
      root.setAttribute('lang', settings.language);
    }

    // 5. Dynamic Document Title & Site Name Meta
    if (settings.siteName) {
      const formattedTitle = `${settings.siteName} — প্রিমিয়াম অনলাইন শপিং`;
      document.title = formattedTitle;
      
      const metaOg = document.querySelector('meta[property="og:site_name"]');
      if (metaOg) metaOg.setAttribute('content', settings.siteName);

      const metaOgTitle = document.querySelector('meta[property="og:title"]');
      if (metaOgTitle) metaOgTitle.setAttribute('content', formattedTitle);

      const metaApple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (metaApple) metaApple.setAttribute('content', settings.siteName);

      try {
        localStorage.setItem('bd_shops_site_name', settings.siteName);
      } catch {
        // ignore
      }
    }
  }, [settings]);

  // Subscribe to real-time updates from Firestore via onSnapshot listener
  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings(
      (newSettings) => {
        setSettings(newSettings);
        try {
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
          if (newSettings.siteName) {
            localStorage.setItem('bd_shops_site_name', newSettings.siteName);
            document.title = `${newSettings.siteName} — প্রিমিয়াম অনলাইন শপিং`;
          }
        } catch {
          // ignore
        }
        initialLoadRef.current = false;
        setLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isDirty]);

  // Debounced save to Firestore with instant local state & storage update
  const updateSettings = useCallback((updates: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const next: StoreSettings = {
        ...prev,
        ...updates,
        socialLinks: updates.socialLinks ? { ...prev.socialLinks, ...updates.socialLinks } : prev.socialLinks,
        payments: updates.payments ? { ...prev.payments, ...updates.payments } : prev.payments,
        features: updates.features ? { ...prev.features, ...updates.features } : prev.features,
      };
      
      setIsDirty(true);

      // Save instantly to localStorage so user/admin sees changes without 1ms delay
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await saveStoreSettingsInFirestore(next);
          setIsDirty(false);
          toast.success('সেটিংস সফলভাবে সেভ হয়েছে', { id: 'settings-auto-save' });
        } catch (error) {
          console.error('Failed to auto-save settings:', error);
          toast.error('সেটিংস সেভ করতে সমস্যা হয়েছে');
        }
      }, 500);

      return next;
    });
  }, []);

  // Manual explicit save
  const saveSettings = useCallback(async (settingsToSave: StoreSettings) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    try {
      await saveStoreSettingsInFirestore(settingsToSave);
      setSettings(settingsToSave);
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settingsToSave));
      } catch {
        // ignore
      }
      setIsDirty(false);
      toast.success('সেটিংস সফলভাবে সেভ হয়েছে', { id: 'settings-manual-save' });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast.error('সেটিংস সেভ করতে সমস্যা হয়েছে');
      throw error;
    }
  }, []);

  // Memoized context value to prevent unnecessary re-rendering of consumer tree
  const contextValue = useMemo<SettingsContextType>(
    () => ({
      settings,
      loading,
      updateSettings,
      saveSettings,
    }),
    [settings, loading, updateSettings, saveSettings]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access the full settings context
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

/**
 * Generic memoized selector for StoreSettings.
 * Enables granular component subscriptions so components re-render ONLY when their selected slice changes.
 */
export function useSettingsSelector<T>(
  selector: (settings: StoreSettings) => T
): T {
  const { settings } = useSettings();
  return useMemo(() => selector(settings), [settings, selector]);
}

/**
 * Memoized selector for Contact Information.
 * Propagates real-time Admin updates (supportPhone, whatsappNumber, supportEmail, address)
 * directly to components without page reloads.
 */
export function useContactSettings() {
  const { settings } = useSettings();
  return useMemo(
    () => ({
      supportPhone: settings.supportPhone || '01796983725',
      whatsappNumber: settings.whatsappNumber || '01796983725',
      supportEmail: settings.supportEmail || 'support@blackzone.com.bd',
      address: settings.address || 'ঢাকা, বাংলাদেশ',
      socialLinks: settings.socialLinks,
    }),
    [
      settings.supportPhone,
      settings.whatsappNumber,
      settings.supportEmail,
      settings.address,
      settings.socialLinks,
    ]
  );
}

/**
 * Memoized selector for Branding & Identity (siteName, siteLogo, favicon, themeColor, themeMode).
 */
export function useBrandSettings() {
  const { settings } = useSettings();
  return useMemo(
    () => ({
      siteName: settings.siteName || 'Black Zone',
      siteLogo: settings.siteLogo || '',
      favicon: settings.favicon || '',
      themeColor: settings.themeColor || '#ea580c',
      themeMode: settings.themeMode || 'light',
      language: settings.language || 'bn',
    }),
    [
      settings.siteName,
      settings.siteLogo,
      settings.favicon,
      settings.themeColor,
      settings.themeMode,
      settings.language,
    ]
  );
}

/**
 * Memoized selector for Online Payments & Accounts configuration.
 */
export function usePaymentSettings() {
  const { settings } = useSettings();
  return useMemo(() => settings.payments, [settings.payments]);
}

/**
 * Memoized selector for Feature Switches & Banners.
 */
export function useFeatureSettings() {
  const { settings } = useSettings();
  return useMemo(() => settings.features, [settings.features]);
}

/**
 * Memoized selector for Store Online/Offline Status & Maintenance Notice.
 */
export function useStoreOnlineStatus() {
  const { settings } = useSettings();
  return useMemo(
    () => ({
      isStoreOnline: settings.isStoreOnline !== false,
      maintenanceNotice: settings.maintenanceNotice || 'ওয়েবসাইট সাময়িক বন্ধ আছে',
    }),
    [settings.isStoreOnline, settings.maintenanceNotice]
  );
}
