/**
 * BD SHOPS — Authentication Context & Provider
 * Firebase Auth, Firestore Persistence & Robust Offline Fallback Support
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase/config';
import { UserProfile, Address, Role } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: Role;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addUserAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  deleteUserAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync or fetch user profile from Firestore with localStorage offline fallback
  const syncUserProfile = async (user: User) => {
    const storageKey = `bdshops_user_profile_${user.uid}`;
    
    // Try to load cached profile from local storage first for instant responsiveness
    let cachedProfile: UserProfile | null = null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        cachedProfile = JSON.parse(saved);
        setUserProfile(cachedProfile);
      }
    } catch {
      // Ignore parse errors
    }

    const isOwner = (email?: string | null) => {
      const clean = (email || '').toLowerCase().trim();
      return clean === 'mdaponww2025@gmail.com' || clean === 'mdaponww27@gmail.com';
    };
    const effectiveRole: Role = isOwner(user.email) ? 'super_admin' : 'customer';

    const defaultProfile: UserProfile = cachedProfile || {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || (isOwner(user.email) ? 'মাস্টার অ্যাডমিন' : 'সম্মানিত গ্রাহক'),
      phoneNumber: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      role: effectiveRole,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as UserProfile;
        // Override role if it's the owner email
        if (isOwner(user.email) && firestoreData.role !== 'super_admin' && firestoreData.role !== 'admin') {
          firestoreData.role = 'super_admin';
          await setDoc(userDocRef, { ...firestoreData, role: 'super_admin' }, { merge: true });
        }
        setUserProfile(firestoreData);
        try {
          localStorage.setItem(storageKey, JSON.stringify(firestoreData));
        } catch {
          // Ignore storage quota error
        }
      } else {
        // Create initial profile for newly signed-in user
        try {
          await setDoc(userDocRef, {
            ...defaultProfile,
            serverCreatedAt: serverTimestamp(),
          });
        } catch (setErr) {
          console.warn('Could not write initial profile to Firestore immediately:', setErr);
        }
        setUserProfile(defaultProfile);
        try {
          localStorage.setItem(storageKey, JSON.stringify(defaultProfile));
        } catch {
          // Ignore
        }
      }

      // Also ensure Admin collection and staff account exist for real-time permission enforcement
      if (isOwner(user.email)) {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            uid: user.uid,
            email: user.email,
            role: 'super_admin',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (adminErr) {
          console.warn('Could not record admin uid in admins collection:', adminErr);
        }
      }
    } catch (error: any) {
      console.warn('Firestore offline or unreachable, using local fallback:', error?.message || error);
      if (!cachedProfile) {
        setUserProfile(defaultProfile);
        try {
          localStorage.setItem(storageKey, JSON.stringify(defaultProfile));
        } catch {
          // Ignore
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          await syncUserProfile(user);
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1-Click Google Login with graceful unauthorized-domain detection
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        console.warn(
          `[Firebase Auth] Domain '${domain}' is not in Authorized Domains list for project 'black-zone-shops'.\n` +
          `To authorize, visit Firebase Console -> Authentication -> Settings -> Authorized domains.`
        );
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign In Error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Standard Email Login
  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (error) {
      console.error('Email Login Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email Registration
  const registerWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateFirebaseProfile(result.user, { displayName: name });
        const cleanEmail = email.toLowerCase().trim();
        const isOwnerUser = cleanEmail === 'mdaponww2025@gmail.com' || cleanEmail === 'mdaponww27@gmail.com';
        const newProfile: UserProfile = {
          uid: result.user.uid,
          email,
          displayName: name,
          phoneNumber: phone || '',
          photoURL: '',
          role: isOwnerUser ? 'super_admin' : 'customer',
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const storageKey = `bdshops_user_profile_${result.user.uid}`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(newProfile));
        } catch {
          // Ignore
        }

        try {
          const userDocRef = doc(db, 'users', result.user.uid);
          await setDoc(userDocRef, {
            ...newProfile,
            serverCreatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Could not write new profile to firestore immediately:', err);
        }

        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Email Registration Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Guaranteed Instant Sign out
  const logout = async () => {
    // 1. Instantly clear client auth states
    const uid = currentUser?.uid;
    setCurrentUser(null);
    setUserProfile(null);

    // 2. Clear relevant localStorage cached auth tokens/profiles
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bdshops_active_demo_uid');
      if (uid) {
        try {
          localStorage.removeItem(`bdshops_user_profile_${uid}`);
        } catch {
          // Ignore
        }
      }
    }

    // 3. Complete Firebase Signout
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('Firebase Sign Out Warning:', error);
    }
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password Reset Error:', error);
      throw error;
    }
  };

  // Update Profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const storageKey = `bdshops_user_profile_${currentUser.uid}`;

    const updatedProfile: UserProfile = {
      ...(userProfile || {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'সম্মানিত গ্রাহক',
        phoneNumber: '',
        photoURL: '',
        role: 'customer',
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updatedProfile);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedProfile));
    } catch {
      // Ignore
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Could not sync profile update to remote Firestore immediately:', error);
    }
  };

  // Add User Address
  const addUserAddress = async (address: Omit<Address, 'id'>) => {
    if (!currentUser) return;
    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAddress: Address = {
      ...address,
      id: newId,
    };

    const currentAddresses = userProfile?.addresses || [];
    let updatedAddresses = [...currentAddresses];

    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
    }

    updatedAddresses.push(newAddress);

    await updateUserProfile({
      addresses: updatedAddresses,
    });
  };

  // Delete User Address
  const deleteUserAddress = async (addressId: string) => {
    if (!currentUser || !userProfile) return;
    const updatedAddresses = (userProfile.addresses || []).filter((a) => a.id !== addressId);
    
    // If deleted address was default, make first remaining address default
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }

    await updateUserProfile({
      addresses: updatedAddresses,
    });
  };

  // Set Default Address
  const setDefaultAddress = async (addressId: string) => {
    if (!currentUser || !userProfile) return;
    const updatedAddresses = (userProfile.addresses || []).map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));

    await updateUserProfile({
      addresses: updatedAddresses,
    });
  };

  const role: Role = userProfile?.role || 'customer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        updateUserProfile,
        addUserAddress,
        deleteUserAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
