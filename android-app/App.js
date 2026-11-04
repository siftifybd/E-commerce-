import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Firebase configuration for black-zone-shops
const firebaseConfig = {
  apiKey: "AIzaSyCbF5H1t8nXS-mJ7okyVf9N5HpNevkzQuI",
  authDomain: "black-zone-shops.firebaseapp.com",
  databaseURL: "https://black-zone-shops-default-rtdb.firebaseio.com",
  projectId: "black-zone-shops",
  storageBucket: "black-zone-shops.firebasestorage.app",
  messagingSenderId: "57254397387",
  appId: "1:57254397387:web:9b21b82dd1575aa913a24e",
  measurementId: "G-L198YW5MZF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Prevent admin emails from logging in on user app
      if (currentUser && (currentUser.email === 'mdaponww27@gmail.com' || currentUser.email === 'mdaponww2025@gmail.com')) {
        signOut(auth);
        setErrorMessage('অ্যাডমিন ইমেইল দিয়ে ইউজার অ্যাপে লগইন করা নিষিদ্ধ!');
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    // Fetch products
    fetchProducts();

    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = collection(db, 'products');
      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      if (items.length > 0) {
        setProducts(items);
      } else {
        // Fallback sample products in Warm Amber / Rose Pink theme
        setProducts([
          { id: '1', name: 'প্রিমিয়াম জেন্টস হুডি', price: 1250, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop' },
          { id: '2', name: 'স্টাইলিশ স্নিকার্স জুতো', price: 2100, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop' },
          { id: '3', name: 'লেদার প্রিমিয়াম ওয়ালেট', price: 650, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop' }
        ]);
      }
    } catch (e) {
      setProducts([
        { id: '1', name: 'প্রিমিয়াম জেন্টস হুডি', price: 1250, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop' },
        { id: '2', name: 'স্টাইলিশ স্নিকার্স জুতো', price: 2100, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop' }
      ]);
    }
  };

  const handleAuth = async () => {
    setErrorMessage('');
    if (email === 'mdaponww27@gmail.com' || email === 'mdaponww2025@gmail.com') {
      setErrorMessage('অ্যাডমিন ইমেইল দিয়ে ইউজার অ্যাপে লগইন করা নিষিদ্ধ!');
      return;
    }
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f97316" barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Black Zone — শপ</Text>
        <Text style={styles.headerSubtitle}>Warm Amber & Rose Pink Store</Text>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content}>
        {activeTab === 'home' && (
          <View>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>🎉 ঈদ স্পেশাল মেগা ডিসকাউন্ট!</Text>
              <Text style={styles.bannerSubtitle}>সারা দেশে ক্যাশ অন ডেলিভারি</Text>
            </View>

            <Text style={styles.sectionTitle}>জনপ্রিয় পণ্যসমূহ</Text>
            <View style={styles.productGrid}>
              {products.map((item) => (
                <View key={item.id} style={styles.productCard}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productPrice}>৳ {item.price}</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                    <Text style={styles.addButtonText}>কার્ডে যোগ করুন</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'cart' && (
          <View style={styles.cartContainer}>
            <Text style={styles.sectionTitle}>আপনার কার্ট ({cart.length} টি পণ্য)</Text>
            {cart.length === 0 ? (
              <Text style={styles.emptyText}>আপনার কার্ট খালি রয়েছে।</Text>
            ) : (
              cart.map((item, idx) => (
                <View key={idx} style={styles.cartItem}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>৳ {item.price}</Text>
                </View>
              ))
            )}
            {cart.length > 0 && (
              <TouchableOpacity style={styles.checkoutButton} onPress={() => alert('অর্ডার সফলভাবে সাবমিট হয়েছে!')}>
                <Text style={styles.checkoutButtonText}>অর্ডার কনফার্ম করুন</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.profileContainer}>
            {user ? (
              <View style={styles.userInfo}>
                <Text style={styles.userEmailText}>লগইন করা ইমেইল:</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={() => signOut(auth)}>
                  <Text style={styles.logoutButtonText}>লগআউট করুন</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authBox}>
                <Text style={styles.authTitle}>{authMode === 'login' ? 'ইউজার লগইন' : 'নতুন অ্যাকাউন্ট রেজিস্টার'}</Text>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
                <TextInput
                  style={styles.input}
                  placeholder="আপনার ইমেইল দিন"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="পাসওয়ার্ড দিন"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.authSubmitButton} onPress={handleAuth}>
                  <Text style={styles.authSubmitText}>{authMode === 'login' ? 'লগইন' : 'রেজিস্ট্রেশন'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                  <Text style={styles.switchAuthText}>
                    {authMode === 'login' ? 'অ্যাকাউন্ট নেই? রেজিস্টার করুন' : 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>🏠 হোম</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('cart')}>
          <Text style={[styles.navText, activeTab === 'cart' && styles.activeNavText]}>🛒 কার্ট ({cart.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>👤 প্রোফাইল</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff7ed' },
  loadingText: { marginTop: 12, color: '#f97316', fontSize: 16, fontWeight: '600' },
  header: { backgroundColor: '#f97316', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#ffedd5', fontSize: 12, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  banner: { backgroundColor: '#f43f5e', borderRadius: 12, padding: 20, marginBottom: 20, alignItems: 'center' },
  bannerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  bannerSubtitle: { color: '#ffe4e6', fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 12, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#fed7aa' },
  productImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  productPrice: { fontSize: 15, fontWeight: 'bold', color: '#f97316', marginVertical: 4 },
  addButton: { backgroundColor: '#f43f5e', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  cartContainer: { paddingVertical: 10 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 30 },
  cartItem: { backgroundColor: '#ffffff', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartItemName: { fontSize: 14, color: '#334155', fontWeight: '500' },
  cartItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },
  checkoutButton: { backgroundColor: '#f97316', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  checkoutButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  profileContainer: { paddingVertical: 20 },
  authBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#fed7aa' },
  authTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74', borderRadius: 8, padding: 12, marginBottom: 12, color: '#1e293b' },
  authSubmitButton: { backgroundColor: '#f97316', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  authSubmitText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  switchAuthText: { color: '#f43f5e', textAlign: 'center', fontSize: 13, fontWeight: '500' },
  userInfo: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, alignItems: 'center' },
  userEmailText: { color: '#64748b', fontSize: 14 },
  userEmail: { color: '#1e293b', fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  logoutButton: { backgroundColor: '#f43f5e', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 12 },
  logoutButtonText: { color: '#ffffff', fontWeight: 'bold' },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#fed7aa', paddingVertical: 10, justifyContent: 'space-around' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  activeNavText: { color: '#f97316', fontWeight: 'bold' }
});
