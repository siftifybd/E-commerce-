import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StoreSettings, subscribeToStoreSettings, DEFAULT_STORE_SETTINGS, saveStoreSettingsInFirestore } from '../services/settings';
import { toast } from 'react-hot-toast';
import { useCartStore } from '../store/useCartStore';

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  saveSettings: (settingsToSave: StoreSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const setCartSettings = useCartStore((state) => state.setSettings);

  // Sync with CartStore
  useEffect(() => {
    setCartSettings(settings);
  }, [settings, setCartSettings]);

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

    // 3. Dynamic Primary Theme Color
    if (settings.themeColor) {
      root.style.setProperty('--primary-theme-color', settings.themeColor);
    }

    // 4. Document Language
    if (settings.language) {
      root.setAttribute('lang', settings.language);
    }
  }, [settings]);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings((newSettings) => {
      if (!isDirty || initialLoadRef.current) {
        setSettings(newSettings);
        initialLoadRef.current = false;
      }
      setLoading(false);
    }, (error) => {
      console.error('Failed to subscribe to settings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDirty]);

  // Debounced save to Firestore
  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      
      setIsDirty(true);

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
  };

  // Manual explicit save
  const saveSettings = async (settingsToSave: StoreSettings) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    try {
      await saveStoreSettingsInFirestore(settingsToSave);
      setSettings(settingsToSave);
      setIsDirty(false);
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
