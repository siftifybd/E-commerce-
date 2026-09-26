/**
 * BD SHOPS — Product Data Services & Firestore Synchronization
 * High-performance Firestore querying, in-memory caching & fallbacks
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase/config';
import { Product, Category, FilterState, PromotionalBanner } from '../types';

// Mock seed fallback data for categories
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_mens_fashion',
    name: 'পুরুষদের ফ্যাশন',
    slug: 'mens-fashion',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=600&auto=format&fit=crop',
    icon: 'Shirt',
    productCount: 42,
    featured: true,
    order: 1,
  },
  {
    id: 'cat_womens_fashion',
    name: 'নারীদের ফ্যাশন',
    slug: 'womens-fashion',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
    icon: 'Sparkles',
    productCount: 56,
    featured: true,
    order: 2,
  },
  {
    id: 'cat_electronics',
    name: 'ইলেকট্রনিক্স ও গ্যাজেট',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    icon: 'Headphones',
    productCount: 38,
    featured: true,
    order: 3,
  },
  {
    id: 'cat_kids_fashion',
    name: 'বাচ্চাদের ফ্যাশন',
    slug: 'kids-fashion',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop',
    icon: 'Smile',
    productCount: 24,
    featured: true,
    order: 4,
  },
  {
    id: 'cat_beauty',
    name: 'বিউটি ও পার্সোনাল কেয়ার',
    slug: 'beauty-care',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
    icon: 'Heart',
    productCount: 29,
    featured: true,
    order: 5,
  },
  {
    id: 'cat_watches_accessories',
    name: 'ঘড়ি ও এক্সেসরিজ',
    slug: 'watches-accessories',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop',
    icon: 'Watch',
    productCount: 19,
    featured: true,
    order: 6,
  },
  {
    id: 'cat_home_living',
    name: 'হোম ও লিভিং',
    slug: 'home-living',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop',
    icon: 'Home',
    productCount: 31,
    featured: true,
    order: 7,
  },
  {
    id: 'cat_groceries',
    name: 'অর্গানিক ও গ্রোসারি',
    slug: 'groceries',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop',
    icon: 'ShoppingBag',
    productCount: 45,
    featured: true,
    order: 8,
  },
];

// Promotional Banners Mock Data
export const MOCK_BANNERS: PromotionalBanner[] = [
  {
    id: 'ban_1',
    title: 'ঈদ স্পেশাল এক্সক্লুসিভ কালেকশন',
    subtitle: 'নতুন ডিজাইনের প্রিমিয়াম পাঞ্জাবি ও শেরওয়ানি',
    badge: '৫০% পর্যন্ত ছাড়',
    imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1400&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1400&auto=format&fit=crop',
    link: '/category/cat_mens_fashion',
    linkUrl: '/category/cat_mens_fashion',
    buttonText: 'কালেকশন দেখুন',
    isActive: true,
    order: 1,
    displayOrder: 1,
  },
  {
    id: 'ban_2',
    title: 'স্মার্ট ইলেকট্রনিক্স ও গেজেটস',
    subtitle: 'অরিজিনাল ওয়্যারলেস ইয়ারবাডস ও স্মার্টওয়াচ',
    badge: 'ফ্রি হোম ডেলিভারি',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
    link: '/category/cat_electronics',
    linkUrl: '/category/cat_electronics',
    buttonText: 'অর্ডার করুন',
    isActive: true,
    order: 2,
    displayOrder: 2,
  },
  {
    id: 'ban_3',
    title: 'প্রিমিয়াম কাতান ও সিল্ক শাড়ি',
    subtitle: 'ঐতিহ্যবাহী বেনারসি ও জয়পুরী সিল্ক',
    badge: 'স্পেশাল অফার',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1400&auto=format&fit=crop',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1400&auto=format&fit=crop',
    link: '/category/cat_womens_fashion',
    linkUrl: '/category/cat_womens_fashion',
    buttonText: 'এখনই কিনুন',
    isActive: true,
    order: 3,
    displayOrder: 3,
  },
];

// Mock Products Fallback
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'প্রিমিয়াম প্রি-ওয়াশড কটন সেমি-লং পাঞ্জাবি',
    slug: 'premium-cotton-semi-long-panjabi',
    categoryId: 'cat_mens_fashion',
    categoryName: 'পুরুষদের ফ্যাশন',
    brand: 'BD Royal',
    price: 1850,
    compareAtPrice: 2450,
    originalPrice: 2450,
    discountPercentage: 24,
    discountPercent: 24,
    stock: 25,
    stockStatus: 'in_stock',
    sku: 'PANJ-001',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
    ],
    description: '১০০% পিওর কটন ফেব্রিক দিয়ে তৈরি অত্যন্ত আরামদায়ক ও ট্রেন্ডি সেমি লং পাঞ্জাবি। নিখুঁত স্টিচিং ও আকর্ষণীয় মেটাল স্ন্যাপ বাটন সমৃদ্ধ।',
    sizes: ['M (40)', 'L (42)', 'XL (44)', 'XXL (46)'],
    colors: ['রয়্যাল ব্লু', 'অলিভ গ্রিন', 'ব্ল্যাক', 'হোয়াইট'],
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isBestSeller: true,
    tags: ['panjabi', 'mens', 'eid', 'cotton'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'অরিজিনাল নয়েজ ক্যানসেলিং ট্রু ওয়্যারলেস ইয়ারবাডস',
    slug: 'anc-true-wireless-earbuds-pro',
    categoryId: 'cat_electronics',
    categoryName: 'ইলেকট্রনিক্স ও গ্যাজেট',
    brand: 'SonicPro',
    price: 2150,
    compareAtPrice: 3200,
    originalPrice: 3200,
    discountPercentage: 33,
    discountPercent: 33,
    stock: 40,
    stockStatus: 'in_stock',
    sku: 'AUDIO-002',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    ],
    description: 'ক্রিস্টাল ক্লিয়ার বেস এবং অ্যাক্টিভ নয়েজ ক্যানসেলেশন (ANC) সহ ৩৬ ঘণ্টার ব্যাটারি লাইফ। ওয়াটার ও সোয়েট রেজিস্ট্যান্ট।',
    colors: ['ম্যাট ব্ল্যাক', 'পার্ল হোয়াইট'],
    rating: 4.8,
    reviewCount: 54,
    isFeatured: true,
    isTrending: true,
    tags: ['earbuds', 'wireless', 'gadget', 'bluetooth'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'এক্সক্লুসিভ পিওর ঢাকাই জামদানি শাড়ি',
    slug: 'exclusive-dhakai-jamdani-saree',
    categoryId: 'cat_womens_fashion',
    categoryName: 'নারীদের ফ্যাশন',
    brand: 'Heritage Weaves',
    price: 4500,
    compareAtPrice: 6200,
    originalPrice: 6200,
    discountPercentage: 27,
    discountPercent: 27,
    stock: 12,
    stockStatus: 'in_stock',
    sku: 'SAREE-003',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    ],
    description: 'ঐতিহ্যবাহী তাঁতের নিখুঁত কারুকাজ সমৃদ্ধ অরিজিনাল ঢাকাই জামদানি শাড়ি। বিয়ে, উৎসব বা বিশেষ অনুষ্ঠানের জন্য চমৎকার।',
    colors: ['রোজ রেড', 'মাস্টার্ড ইয়েলো', 'অ্যাকোয়া ব্লু'],
    rating: 5.0,
    reviewCount: 19,
    isFeatured: true,
    isNewArrival: true,
    tags: ['saree', 'jamdani', 'womens', 'traditional'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    name: 'আল্ট্রা-স্লিম ওয়াটারপ্রুফ ব্লুটুথ স্মার্টওয়াচ',
    slug: 'ultra-slim-waterproof-smartwatch',
    categoryId: 'cat_watches_accessories',
    categoryName: 'ঘড়ি ও এক্সেসরিজ',
    brand: 'Chronos',
    price: 2850,
    compareAtPrice: 3800,
    originalPrice: 3800,
    discountPercentage: 25,
    discountPercent: 25,
    stock: 18,
    stockStatus: 'in_stock',
    sku: 'WATCH-004',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop',
    ],
    description: 'এইচডি অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং, হার্ট রেট ট্র্যাকিং ও ১০০+ স্পোর্টস মোড সমৃদ্ধ প্রিমিয়াম মেটাল বডি স্মার্টওয়াচ।',
    colors: ['ব্ল্যাক', 'সিলভার'],
    rating: 4.7,
    reviewCount: 28,
    isFeatured: true,
    tags: ['smartwatch', 'fitness', 'bluetooth'],
    createdAt: new Date().toISOString(),
  },
];

/**
 * Fetch active promotional banners
 */
export async function fetchBanners(): Promise<PromotionalBanner[]> {
  try {
    const bannerRef = collection(db, 'banners');
    const q = query(bannerRef, where('isActive', '==', true));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const banners = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromotionalBanner[];

      return banners.sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0));
    }
  } catch (err) {
    console.warn('Firestore banners fallback:', err);
  }
  return MOCK_BANNERS;
}

/**
 * Seeds default categories to Firestore if database is empty or requested by Admin
 */
export async function seedDefaultCategories(): Promise<void> {
  try {
    for (const cat of MOCK_CATEGORIES) {
      const docRef = doc(db, 'categories', cat.id);
      await setDoc(
        docRef,
        {
          ...cat,
          updatedAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Could not seed default categories to Firestore:', err);
  }
}

/**
 * Fetch all product categories from Firestore
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const catRef = collection(db, 'categories');
    const snap = await getDocs(catRef);

    if (!snap.empty) {
      const cats = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      return cats.sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      // Auto seed default categories if collection is currently empty
      await seedDefaultCategories();
      return MOCK_CATEGORIES;
    }
  } catch (err) {
    console.warn('Firestore categories fallback:', err);
  }
  return MOCK_CATEGORIES;
}

/**
 * Real-time listener for categories collection in Firestore.
 * Automatically pushes updates to callback whenever admin adds, edits or deletes categories.
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const catRef = collection(db, 'categories');
  return onSnapshot(
    catRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const cats = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Category[];
        onUpdate(cats.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else {
        onUpdate(MOCK_CATEGORIES);
      }
    },
    (err) => {
      console.warn('Categories subscription fallback error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save (Create) Category in Firestore
 */
export async function saveCategoryInFirestore(categoryData: Partial<Category>): Promise<Category> {
  const catId = categoryData.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const slug = categoryData.slug || (categoryData.name
    ? categoryData.name
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : `category-${Date.now()}`);

  const categoryToSave: Category = {
    id: catId,
    name: categoryData.name || 'নতুন ক্যাটাগরি',
    slug,
    image:
      categoryData.image ||
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop',
    icon: categoryData.icon || 'Folder',
    description: categoryData.description || '',
    productCount: categoryData.productCount || 0,
    featured: categoryData.featured !== undefined ? categoryData.featured : true,
    order: categoryData.order || 1,
    subcategories: categoryData.subcategories || [],
  };

  try {
    const docRef = doc(db, 'categories', catId);
    await setDoc(
      docRef,
      {
        ...categoryToSave,
        updatedAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
      },
      { merge: true }
    );
    return categoryToSave;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `categories/${catId}`);
  }
}

/**
 * Update an existing Category in Firestore (Edit Category)
 */
export async function updateCategoryInFirestore(categoryId: string, updateData: Partial<Category>): Promise<void> {
  try {
    const docRef = doc(db, 'categories', categoryId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `categories/${categoryId}`);
  }
}

/**
 * Delete a category document from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`);
  }
}

/**
 * Fetch products with flexible filtering and sorting
 */
export async function fetchProducts(filters?: FilterState & { includeUnapproved?: boolean }): Promise<Product[]> {
  let products: Product[] = [];

  try {
    const prodRef = collection(db, 'products');
    const snap = await getDocs(prodRef);

    if (!snap.empty) {
      products = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    } else {
      products = [...MOCK_PRODUCTS];
    }
  } catch (err) {
    console.warn('Firestore products fallback:', err);
    products = [...MOCK_PRODUCTS];
  }

  // Filter out pending/rejected products for normal customers
  if (!filters?.includeUnapproved) {
    products = products.filter((p) => !p.approvalStatus || p.approvalStatus === 'approved');
  }

  // In-memory robust filtering
  if (filters) {
    if (filters.categoryId) {
      products = products.filter(
        (p) => p.categoryId === filters.categoryId || p.categorySlug === filters.categoryId
      );
    }

    if (filters.categorySlug) {
      products = products.filter(
        (p) => p.categorySlug === filters.categorySlug || p.categoryId === filters.categorySlug
      );
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query) ||
          (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    if (filters.minPrice !== undefined) {
      products = products.filter((p) => p.price >= (filters.minPrice || 0));
    }

    if (filters.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= (filters.maxPrice || Infinity));
    }

    if (filters.inStockOnly) {
      products = products.filter((p) => p.stock > 0);
    }

    if (filters.discountOnly) {
      products = products.filter(
        (p) => (p.compareAtPrice && p.compareAtPrice > p.price) || (p.discountPercentage || 0) > 0
      );
    }

    // Sorting logic
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
        case 'price_low_high':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
        case 'price_high_low':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
        case 'rating':
          products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          products.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          break;
        case 'discount':
          products.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
          break;
        case 'featured':
        case 'recommended':
        default:
          products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }
  }

  return products;
}

/**
 * Fetch single product by slug or id
 */
export async function fetchProductBySlug(slug: string, includeUnapproved = false): Promise<Product | null> {
  try {
    const prodRef = collection(db, 'products');
    const q = query(prodRef, where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const doc = snap.docs[0];
      const prod = { id: doc.id, ...doc.data() } as Product;
      if (!includeUnapproved && prod.approvalStatus && prod.approvalStatus !== 'approved') {
        return null;
      }
      return prod;
    }

    // Try direct ID lookup
    const docSnap = await getDoc(doc(db, 'products', slug));
    if (docSnap.exists()) {
      const prod = { id: docSnap.id, ...docSnap.data() } as Product;
      if (!includeUnapproved && prod.approvalStatus && prod.approvalStatus !== 'approved') {
        return null;
      }
      return prod;
    }
  } catch (err) {
    console.warn('Firestore fetchProductBySlug fallback:', err);
  }

  // Fallback to mock product
  const found = MOCK_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
  return found || null;
}

/**
 * Fetch related products in the same category
 */
export async function fetchRelatedProducts(categoryId: string, currentProductId: string): Promise<Product[]> {
  const all = await fetchProducts({ categoryId });
  return all.filter((p) => p.id !== currentProductId).slice(0, 4);
}

/**
 * Approve a product for listing on user site
 */
export async function approveProductInFirestore(productId: string): Promise<void> {
  try {
    const ref = doc(db, 'products', productId);
    await updateDoc(ref, {
      approvalStatus: 'approved',
      verified: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
  }
}

/**
 * Reject a pending product with optional reason
 */
export async function rejectProductInFirestore(productId: string, reason?: string): Promise<void> {
  try {
    const ref = doc(db, 'products', productId);
    await updateDoc(ref, {
      approvalStatus: 'rejected',
      rejectionReason: reason || 'প্রোডাক্টের তথ্যে অসংগতি রয়েছে।',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
  }
}

/**
 * Bulk Upload array of products to Firestore
 */
export async function bulkUploadProductsToFirestore(productsList: Partial<Product>[]): Promise<number> {
  let count = 0;
  for (const item of productsList) {
    try {
      const docId = item.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ref = doc(db, 'products', docId);
      const newProd = {
        name: item.name || 'অজানা প্রোডাক্ট',
        slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-') || `product-${Date.now()}`,
        price: item.price || 0,
        compareAtPrice: item.compareAtPrice || 0,
        costPrice: item.costPrice || 0,
        stock: item.stock ?? 10,
        sku: item.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: item.barcode || '',
        brand: item.brand || 'BD SHOPS',
        categoryId: item.categoryId || 'cat_mens_fashion',
        categoryName: item.categoryName || 'পুরুষদের ফ্যাশন',
        subCategory: item.subCategory || '',
        description: item.description || '',
        image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop',
        images: item.images || [item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'],
        videoUrl: item.videoUrl || '',
        isFeatured: item.isFeatured ?? false,
        isFlashSale: item.isFlashSale ?? false,
        approvalStatus: item.approvalStatus || 'approved',
        verified: true,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, newProd, { merge: true });
      count++;
    } catch (err) {
      console.error('Failed to upload product item in bulk:', err);
    }
  }
  return count;
}

/**
 * Bulk Edit product prices, stock, or status
 */
export async function bulkUpdateProductsInFirestore(updates: { id: string; price?: number; stock?: number; isFeatured?: boolean }[]): Promise<number> {
  let updatedCount = 0;
  for (const u of updates) {
    try {
      const ref = doc(db, 'products', u.id);
      const payload: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (u.price !== undefined) payload.price = u.price;
      if (u.stock !== undefined) payload.stock = u.stock;
      if (u.isFeatured !== undefined) payload.isFeatured = u.isFeatured;
      
      await updateDoc(ref, payload);
      updatedCount++;
    } catch (err) {
      console.error('Bulk update item error:', err);
    }
  }
  return updatedCount;
}
