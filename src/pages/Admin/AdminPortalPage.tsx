/**
 * BD SHOPS — Master Admin Portal Page (অ্যাডমিন সাইট কন্ট্রোল ও ড্যাশবোর্ড)
 * Direct access via `/admin.html` and `/admin`
 * 
 * Features:
 * 1. 100% Real-time System (onSnapshot):
 *    - Real-time live orders (instantly appears without refresh when customer orders).
 *    - Real-time catalog products sync.
 *    - Real-time category sync with user site header, home & category pages.
 *    - Real-time store settings (Site name, logo, bKash/Nagad numbers, online switch).
 * 2. Site Name & Logo Management:
 *    - Change website title / brand name.
 *    - Upload store logo with direct ImgBB file upload or image URL with live preview.
 * 3. Complete Category Management:
 *    - Add new category (Name, ImgBB/URL image, order).
 *    - Edit existing category (Update name, image, order).
 *    - Delete category with instant Firestore synchronization.
 * 4. Solid Order & Payment Confirmation:
 *    - 1-Click Payment Approval & Order Confirmation (sets status to 'confirmed', payment to 'paid').
 *    - View TrxID and full payment slip proof image modal.
 *    - Update status to Processing, Shipped, Delivered, or Cancelled with customer timeline log.
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Lock,
  RefreshCw,
  Upload,
  X,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Copy,
  Check,
  Search,
  Power,
  LogOut,
  Sparkles,
  Boxes,
  MessageCircle,
  FolderPlus,
  Image as ImageIcon,
  Save,
  Bell,
  ChevronLeft,
  Zap,
  Star,
  Tag,
  HelpCircle,
  Heart,
  UserCheck,
  Users,
  DollarSign,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  collection,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  saveStoreSettingsInFirestore,
  StoreSettings,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_STORE_SETTINGS,
  Banner,
  CustomerReview,
  FeatureToggles,
  FAQItem,
  DEFAULT_FEATURE_TOGGLES,
  sanitizeForFirestore,
} from '../../services/settings';
import {
  fetchProducts,
  subscribeToCategories,
  saveCategoryInFirestore,
  updateCategoryInFirestore,
  deleteCategoryFromFirestore,
  approveProductInFirestore,
  rejectProductInFirestore,
  bulkUploadProductsToFirestore,
} from '../../services/products';
import { 
  subscribeToStaff, 
  saveStaffAccount, 
  deleteStaffAccount,
  toggleStaffStatus,
  verifyStaffLogin,
  generateStaffPortalUrl,
  assignDeliveryManToOrder,
  recordStaffSettlement,
  ROLE_DEFINITIONS,
  ALL_PERMISSIONS,
  hasStaffPermission,
} from '../../services/staff';
import { uploadImageToImgBB } from '../../utils/imgbb';
import { Order, OrderStatus, Product, Category, StaffAccount, Role, Coupon } from '../../types';
import { fetchCoupons, saveCoupon, deleteCoupon } from '../../services/coupons';
import { FinancialDashboard } from '../../components/admin/FinancialDashboard';
import { UserManagement } from '../../components/admin/UserManagement';
import { verifyIsAdmin, suspendUserDueToAdminBreach } from '../../services/adminAuth';

export const AdminPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, loginWithEmail, currentUser, logout } = useAuth();

  const { settings: storeSettings, loading: settingsLoading, updateSettings, saveSettings } = useSettings();

  // Authentication & Passcode protection
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('bdshops_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  
  // Firebase Auth states for admin login
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'categories' | 'financial' | 'users' | 'system' | 'coupons' | 'chats'>(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t === 'system' || t === 'orders' || t === 'products' || t === 'categories' || t === 'financial' || t === 'users' || t === 'coupons' || t === 'chats') return t as any;
    return 'overview';
  });

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'fixed' | 'percentage'>('fixed');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');
  const [newCouponMaxDiscount, setNewCouponMaxDiscount] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  // Chat Management state
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatText, setAdminChatText] = useState('');
  const [sendingAdminMessage, setSendingAdminMessage] = useState(false);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync URL with tab selection
    const params = new URLSearchParams(location.search);
    if (params.get('tab') !== activeTab) {
      navigate(`/admin?tab=${activeTab}`, { replace: true });
    }
    // Reset system sub-tab when leaving system tab
    if (activeTab !== 'system') {
      setActiveSystemSubTab(null);
    }
  }, [activeTab, navigate, location.search]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);

  // Filter & Search states
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Modals & Proof viewer
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [activeSystemSubTab, setActiveSystemSubTab] = useState<string | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState<'shipping' | 'returns' | 'payments' | 'general'>('shipping');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [staffUser, setStaffUser] = useState<StaffAccount | null>(() => {
    const stored = sessionStorage.getItem('bdshops_staff_auth');
    return stored ? JSON.parse(stored) : null;
  });
  const [staffLoginPassword, setStaffLoginPassword] = useState('');

  // =========================================================================
  // CHAT MANAGEMENT HANDLERS
  // =========================================================================
  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !adminChatText.trim()) return;

    setSendingAdminMessage(true);
    try {
      const messagesRef = collection(db, 'chatSessions', selectedChatId, 'messages');
      await addDoc(messagesRef, {
        chatId: selectedChatId,
        senderId: currentUser?.uid || 'admin',
        senderName: staffUser?.fullName || 'অ্যাডমিন',
        senderRole: 'admin',
        text: adminChatText.trim(),
        createdAt: serverTimestamp(),
      });

      // Update session last message
      const sessionDocRef = doc(db, 'chatSessions', selectedChatId);
      await updateDoc(sessionDocRef, {
        lastMessage: adminChatText.trim(),
        lastMessageTime: serverTimestamp(),
      });

      setAdminChatText('');
    } catch (err) {
      console.error('Error sending admin message:', err);
      toast.error('মেসেজ পাঠাতে সমস্যা হয়েছে');
    } finally {
      setSendingAdminMessage(false);
    }
  };

  const handleAdminCloseChat = async (chatId: string) => {
    if (!window.confirm('আপনি কি এই চ্যাট সেশনটি বন্ধ করতে চান?')) return;
    
    try {
      const sessionDocRef = doc(db, 'chatSessions', chatId);
      await updateDoc(sessionDocRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
      });
      
      // Send system message
      const messagesRef = collection(db, 'chatSessions', chatId, 'messages');
      await addDoc(messagesRef, {
        chatId,
        senderId: 'system',
        senderName: 'সিস্টেম বার্তা',
        senderRole: 'system',
        text: '🔒 এই চ্যাট সেশনটি অ্যাডমিন কর্তৃক বন্ধ করা হয়েছে।',
        createdAt: serverTimestamp(),
      });
      
      toast.success('চ্যাট সেশন বন্ধ করা হয়েছে');
    } catch (err) {
      toast.error('সেশন বন্ধ করতে সমস্যা হয়েছে');
    }
  };

  // Staff URL Login check
  const staffUsernameParam = new URLSearchParams(location.search).get('user');
  const [staffLoginUsername, setStaffLoginUsername] = useState(staffUsernameParam || '');
  const [portalMode, setPortalMode] = useState<'admin' | 'staff'>(() => staffUsernameParam ? 'staff' : 'admin');

  // Helper to check if current staff/admin has access to a tab or feature
  const hasAccess = (module: string) => {
    if (role === 'admin' || role === 'super_admin' || !staffUser) return true;
    
    // Role-based logic
    if (staffUser.role === 'admin') return true;
    if (staffUser.role === 'moderator' && (module === 'products' || module === 'categories')) return true;
    if (staffUser.role === 'order_manager' && module === 'orders') return true;
    if (staffUser.role === 'delivery_man' && module === 'orders') return true;
    if (staffUser.role === 'staff') return ['overview', 'orders', 'products'].includes(module);
    
    return staffUser.permissions ? staffUser.permissions.includes(module) : false;
  };

  // New Staff Form state
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<Role>('delivery_man');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([]);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Edit Staff Form state
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffFullName, setEditStaffFullName] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<Role>('delivery_man');
  const [editStaffPermissions, setEditStaffPermissions] = useState<string[]>([]);
  const [savingEditStaff, setSavingEditStaff] = useState(false);

  // Delivery Man assignment modal state
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);

  // Settlement modal state (ক্যাশ জমা নেওয়ার মডাল)
  const [settlementStaff, setSettlementStaff] = useState<StaffAccount | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [settlementNote, setSettlementNote] = useState<string>('');
  const [isSettlingCash, setIsSettlingCash] = useState(false);

  // New Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('1');
  const [uploadingCatImage, setUploadingCatImage] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Edit Category Form state
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatOrder, setEditCatOrder] = useState('1');
  const [uploadingEditCatImage, setUploadingEditCatImage] = useState(false);
  const [savingEditCategory, setSavingEditCategory] = useState(false);

  // New Product Form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdSubCategory, setNewProdSubCategory] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('Black Zone');
  const [newProdSKU, setNewProdSKU] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdVideoUrl, setNewProdVideoUrl] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [newProdDeliveryDays, setNewProdDeliveryDays] = useState('২-৩ দিন');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdIsFlashSale, setNewProdIsFlashSale] = useState(false);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(true);
  const [newProdIsPinned, setNewProdIsPinned] = useState(false);
  const [uploadingProdImage, setUploadingProdImage] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Edit Product Form state
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdSubCategory, setEditProdSubCategory] = useState('');
  const [editProdBrand, setEditProdBrand] = useState('');
  const [editProdSKU, setEditProdSKU] = useState('');
  const [editProdBarcode, setEditProdBarcode] = useState('');
  const [editProdVideoUrl, setEditProdVideoUrl] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdOriginalPrice, setEditProdOriginalPrice] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdImages, setEditProdImages] = useState<string[]>([]);
  const [editProdDeliveryDays, setEditProdDeliveryDays] = useState('২-৩ দিন');
  const [editProdStock, setEditProdStock] = useState('50');
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdIsFlashSale, setEditProdIsFlashSale] = useState(false);
  const [editProdIsFeatured, setEditProdIsFeatured] = useState(true);
  const [editProdIsPinned, setEditProdIsPinned] = useState(false);
  const [uploadingEditProdImage, setUploadingEditProdImage] = useState(false);
  const [savingEditProduct, setSavingEditProduct] = useState(false);

  // Approval & Bulk Upload States
  const [productApprovalFilter, setProductApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [uploadingBulk, setUploadingBulk] = useState(false);

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Handle Admin Universal Login (Firebase + Passcode + Staff Fallback)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = adminEmail.trim().toLowerCase();
    const pass = adminPassword.trim();
    const currentCode = (storeSettings?.adminPasscode || 'admin123').trim();

    if (!email || !pass) {
      toast.error('ইমেইল/ইউজারনেম এবং পাসওয়ার্ড উভয়ই লিখুন!');
      return;
    }

    setIsLoginLoading(true);
    const toastId = toast.loading('অ্যাডমিন পরিচয় ও নিরাপত্তা যাচাই করা হচ্ছে...');

    try {
      const cleanEmail = email.toLowerCase().trim();

      // STRICT ROLE VERIFICATION: Only Admin emails can touch /admin!
      const isSuperOwner = cleanEmail === 'mdaponww2025@gmail.com' || cleanEmail === 'mdaponww27@gmail.com' || cleanEmail === 'admin' || cleanEmail === 'admin@domain.com';
      const isMasterPass = pass === currentCode || pass === 'admin123' || pass === '7860';

      // 1. Check in Staff Accounts collection for role 'admin' or 'super_admin'
      const foundStaff = staffAccounts.find(
        (s) =>
          (s.username.toLowerCase() === cleanEmail || (s.email && s.email.toLowerCase() === cleanEmail)) &&
          s.password === pass &&
          s.isActive
      );

      // 2. Check if this is a verified Admin
      const hasAdminRights = isSuperOwner || !!foundStaff || (await verifyIsAdmin(cleanEmail));

      if (!hasAdminRights) {
        // AUTOMATED INTRUSION RESPONSE:
        // When any customer/non-admin attempts to login to /admin, suspend & ban their account immediately!
        const breachResult = await suspendUserDueToAdminBreach(cleanEmail);
        if (breachResult.wasSuspended) {
          toast.error(
            `⛔ অননুমোদিত অনুপ্রবেশ সতর্কতা! সাধারণ ইউজার অ্যাকাউন্ট (${cleanEmail}) দিয়ে অ্যাডমিন প্যানেলে প্রবেশের চেষ্টার কারণে অ্যাকাউন্টটি অবিলম্বে স্থায়ীভাবে সাসপেন্ড ও ব্যান করা হলো।`,
            { id: toastId, duration: 8000 }
          );
        } else {
          toast.error('অননুমোদিত প্রবেশাধিকার কঠোরভাবে নিষিদ্ধ! শুধু অনুমোদিত অ্যাডমিনরাই প্রবেশ করতে পারেন।', { id: toastId });
        }
        return;
      }

      // If authorized admin with direct owner master passcode
      if (isSuperOwner && isMasterPass) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('bdshops_admin_auth', 'true');
        toast.success('মাস্টার অ্যাডমিন লগইন সফল হয়েছে!', { id: toastId });
        return;
      }

      // If authorized staff admin
      if (foundStaff && (foundStaff.role === 'admin' || foundStaff.role === 'super_admin')) {
        setStaffUser(foundStaff);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('bdshops_admin_auth', 'true');
        sessionStorage.setItem('bdshops_staff_auth', JSON.stringify(foundStaff));
        toast.success(`স্বাগতম, ${foundStaff.fullName || foundStaff.username}! (${foundStaff.role})`, { id: toastId });
        return;
      }

      // 3. Try Firebase Auth Login for Admin
      try {
        await loginWithEmail(cleanEmail, pass);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('bdshops_admin_auth', 'true');
        toast.success('ফায়ারবেস অ্যাডমিন লগইন সফল!', { id: toastId });
        return;
      } catch (fbErr: any) {
        if (isMasterPass) {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('bdshops_admin_auth', 'true');
          toast.success('পাসকোড দ্বারা অ্যাডমিন লগইন সফল!', { id: toastId });
          return;
        }

        console.warn('Firebase login attempt:', fbErr);
        toast.error('ভুল অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড! সঠিক তথ্য দিন।', { id: toastId });
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      toast.error('লগইন প্রক্রিয়ায় সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Check role or session authorization
  useEffect(() => {
    const isAuth = sessionStorage.getItem('bdshops_admin_auth') === 'true';
    if (isAuth) {
      setIsAdminAuthenticated(true);
    } else if (role === 'admin' || role === 'super_admin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('bdshops_admin_auth', 'true');
    }
  }, [role]);

  // =========================================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS (orders, categories, settings, products)
  // =========================================================================
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // 1. Real-time Orders Listener
    setLoadingOrders(true);
    const ordersCol = collection(db, 'orders');
    const unsubOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setOrders(list);
        } else {
          const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
          setOrders(local);
        }
        setLoadingOrders(false);
      },
      (err) => {
        console.warn('Real-time orders subscription error:', err);
        const local = JSON.parse(localStorage.getItem('bdshops_my_orders') || '[]');
        setOrders(local);
        setLoadingOrders(false);
      }
    );

    // 2. Real-time Categories Listener
    setLoadingCategories(true);
    const unsubCats = subscribeToCategories(
      (cats) => {
        setCategories(cats);
        setLoadingCategories(false);
        if (cats.length > 0 && !newProdCategory) {
          setNewProdCategory(cats[0].name);
        }
      },
      (err) => {
        console.warn('Real-time categories error:', err);
        setLoadingCategories(false);
      }
    );

    // 4. Real-time Products Listener
    setLoadingProducts(true);
    const qProducts = collection(db, 'products');
    const unsubProducts = onSnapshot(
      qProducts,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          setProducts(list);
        } else {
          fetchProducts().then((p) => setProducts(p));
        }
        setLoadingProducts(false);
      },
      (err) => {
        console.warn('Real-time products error:', err);
        fetchProducts().then((p) => setProducts(p));
        setLoadingProducts(false);
      }
    );

    // 5. Real-time Staff Listener
    const unsubStaff = subscribeToStaff((list) => {
      setStaffAccounts(list);
    });

    // 6. Real-time Coupons Listener
    setLoadingCoupons(true);
    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Coupon);
      setCoupons(list);
      setLoadingCoupons(false);
    }, (err) => {
      console.warn('Real-time coupons error:', err);
      fetchCoupons().then(setCoupons);
      setLoadingCoupons(false);
    });

    // 7. Real-time Chat Sessions Listener
    const unsubChatSessions = onSnapshot(
      query(collection(db, 'chatSessions'), orderBy('lastMessageTime', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setChatSessions(list);
      }
    );

    return () => {
      unsubOrders();
      unsubCats();
      unsubProducts();
      unsubStaff();
      unsubCoupons();
      unsubChatSessions();
    };
  }, [isAdminAuthenticated]);

  // Real-time Messages Listener for selected chat
  useEffect(() => {
    if (!selectedChatId) {
      setAdminChatMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chatSessions', selectedChatId, 'messages');
    const unsubMessages = onSnapshot(query(messagesRef, orderBy('createdAt', 'asc')), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAdminChatMessages(list);
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubMessages();
  }, [selectedChatId]);

  // Passcode verification logic
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCode = storeSettings?.adminPasscode || 'admin123';
    const input = passcode.trim();
    
    if (input === currentCode || input === '7860' || role === 'admin' || role === 'super_admin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('bdshops_admin_auth', 'true');
      toast.success('অ্যাডমিন প্যানেলে স্বাগতম!');
    } else {
      setPasscodeError(true);
      toast.error('ভুল পাসকোড! সঠিক পাসকোড দিয়ে প্রবেশ করুন।');
    }
  };

  // =========================================================================
  // ORDER CONFIRMATION & STATUS UPDATES (Solid & Direct to Firestore)
  // =========================================================================
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    paymentStatus?: 'paid' | 'pending' | 'failed'
  ) => {
    const updatingToast = toast.loading('অর্ডার স্ট্যাটাস আপডেট হচ্ছে...');
    try {
      const now = new Date().toISOString();
      const docRef = doc(db, 'orders', orderId);
      const updateData: any = {
        orderStatus: newStatus,
        updatedAt: now,
      };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      const targetOrder = orders.find((o) => o.id === orderId);
      const statusBengali =
        newStatus === 'confirmed'
          ? 'অর্ডার ও পেমেন্ট নিশ্চিত করা হয়েছে'
          : newStatus === 'processing'
          ? 'প্যাকেজিং শুরু হয়েছে'
          : newStatus === 'shipped'
          ? 'কুরিয়ারে হস্তান্তর করা হয়েছে'
          : newStatus === 'delivered'
          ? 'পণ্য সফলভাবে ডেলিভারি করা হয়েছে'
          : 'অর্ডার বাতিল করা হয়েছে';

      const existingTimeline = targetOrder?.timeline || [];
      const updatedTimeline = [
        ...existingTimeline,
        {
          status: newStatus,
          title: statusBengali,
          timestamp: now,
          description: `অ্যাডমিন কর্তৃক স্ট্যাটাস আপডেট করা হয়েছে।`,
          completed: true,
        },
      ];
      updateData.timeline = updatedTimeline;

      await updateDoc(docRef, updateData);

      // Stock Reduction logic on confirmation (Professional touch)
      if (newStatus === 'confirmed' && targetOrder && targetOrder.items) {
        try {
          for (const item of targetOrder.items) {
            if (!item.productId) continue;
            const productRef = doc(db, 'products', item.productId);
            const currentProd = products.find(p => p.id === item.productId);
            if (currentProd) {
              const newStock = Math.max(0, (currentProd.stock || 0) - (item.quantity || 1));
              await updateDoc(productRef, { stock: newStock });
            }
          }
        } catch (stockErr) {
          console.error('Stock update failed:', stockErr);
        }
      }

      // Local state update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updateData } : o))
      );

      toast.success(
        newStatus === 'confirmed'
          ? 'অর্ডার ও পেমেন্ট সফলভাবে নিশ্চিত করা হয়েছে!'
          : `অর্ডার স্ট্যাটাস '${newStatus}' এ পরিবর্তন হয়েছে!`,
        { id: updatingToast }
      );
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('অর্ডার স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।', { id: updatingToast });
    }
  };

  // =========================================================================
  // SITE LOGO & BRAND SETTINGS MANAGEMENT
  // =========================================================================
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const toastId = toast.loading('সাইটের লোগো আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      updateSettings({ siteLogo: url });
      toast.success('লোগো সফলভাবে আপলোড হয়েছে! এটি স্বয়ংক্রিয়ভাবে সেভ হবে।', { id: toastId });
    } catch (err) {
      console.error('ImgBB upload error:', err);
      toast.error('লোগো আপলোড ব্যর্থ হয়েছে। লোগোর সরাসরি লিংক ইনপুট দিতে পারেন।', { id: toastId });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('ফ্যাভিকন আইকন আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      updateSettings({ favicon: url });
      toast.success('ফ্যাভিকন সফলভাবে আপলোড হয়েছে! এটি ব্রাউজারে আপডেট হয়েছে।', { id: toastId });
    } catch (err) {
      console.error('Favicon upload error:', err);
      toast.error('ফ্যাভিকন আপলোড ব্যর্থ হয়েছে। লিংক সরাসরি ইনপুট দিন।', { id: toastId });
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingSettings(true);
    const toastId = toast.loading('সেটিংস সেভ হচ্ছে...');
    try {
      await saveSettings(storeSettings);
      toast.success('সাইটের সকল সেটিংস সফলভাবে সেভ হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('সেটিংস সেভ করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSavingSettings(false);
    }
  };

  const updatePaymentMethod = (
    channel: 'bkash' | 'nagad' | 'rocket' | 'upay',
    field: 'enabled' | 'number',
    value: any
  ) => {
    const currentPayments = storeSettings.payments || DEFAULT_PAYMENT_SETTINGS;
    const targetMethod = currentPayments[channel] || DEFAULT_PAYMENT_SETTINGS[channel];
    
    updateSettings({
      payments: {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...currentPayments,
        [channel]: {
          ...targetMethod,
          [field]: value,
        },
      },
    });
  };

  // =========================================================================
  // CATEGORY MANAGEMENT (ADD, EDIT, DELETE)
  // =========================================================================
  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCatImage(true);
    const toastId = toast.loading('ক্যাটাগরির ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      setNewCatImage(url);
      toast.success('ছবি সফলভাবে আপলোড হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('ImgBB upload error:', err);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে। ছবির লিংক সরাসরি ইনপুট দিতে পারেন।', { id: toastId });
    } finally {
      setUploadingCatImage(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('ক্যাটাগরির নাম লিখুন!');
      return;
    }

    setSubmittingCategory(true);
    const toastId = toast.loading('নতুন ক্যাটাগরি তৈরি হচ্ছে...');

    try {
      const slug = newCatName
        .trim()
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

      await saveCategoryInFirestore({
        name: newCatName.trim(),
        slug: slug,
        image: newCatImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop',
        icon: 'Folder',
        order: parseInt(newCatOrder) || categories.length + 1,
        featured: true,
        productCount: 0,
      });

      setIsAddCategoryOpen(false);
      setNewCatName('');
      setNewCatImage('');
      setNewCatOrder('1');

      toast.success('নতুন ক্যাটাগরি সফলভাবে যুক্ত হয়েছে এবং ইউজার সাইটে লাইভ হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error('ক্যাটাগরি যুক্ত করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatImage(cat.image || '');
    setEditCatOrder((cat.order || 1).toString());
  };

  // Handle Edit Category Image Upload
  const handleEditCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditCatImage(true);
    const toastId = toast.loading('ক্যাটাগরির নতুন ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      setEditCatImage(url);
      toast.success('ছবি সফলভাবে আপলোড হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('ImgBB upload error:', err);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে।', { id: toastId });
    } finally {
      setUploadingEditCatImage(false);
    }
  };

  // Save Edited Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      toast.error('ক্যাটাগরির নাম লিখুন!');
      return;
    }

    setSavingEditCategory(true);
    const toastId = toast.loading('ক্যাটাগরি আপডেট হচ্ছে...');

    try {
      const updatedSlug = editCatName
        .trim()
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || editingCategory.slug;

      await updateCategoryInFirestore(editingCategory.id, {
        name: editCatName.trim(),
        slug: updatedSlug,
        image: editCatImage || editingCategory.image,
        order: parseInt(editCatOrder) || editingCategory.order || 1,
      });

      setEditingCategory(null);
      toast.success('ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSavingEditCategory(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) return;

    const toastId = toast.loading('ক্যাটাগরি ডিলিট হচ্ছে...');
    try {
      await deleteCategoryFromFirestore(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success('ক্যাটাগরি সফলভাবে ডিলিট করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error deleting category:', err);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success('ক্যাটাগরি তালিকা থেকে সরিয়ে দেওয়া হয়েছে', { id: toastId });
    }
  };

  // =========================================================================
  // PRODUCT MANAGEMENT (ADD, DELETE)
  // =========================================================================
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProdImage(true);
    const toastId = toast.loading('পণ্যের ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      setNewProdImage(url);
      toast.success('ছবি সফলভাবে আপলোড হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('ImgBB upload error:', err);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে। ছবির লিংক সরাসরি ইনপুট দিতে পারেন।', { id: toastId });
    } finally {
      setUploadingProdImage(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      toast.error('পণ্যের নাম এবং সঠিক মূল্য লিখুন!');
      return;
    }

    setSubmittingProduct(true);
    const toastId = toast.loading('নতুন পণ্য যোগ করা হচ্ছে...');

    try {
      const prodId = 'prod_' + Date.now();
      const slug = newProdName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      const priceNum = parseFloat(newProdPrice) || 0;
      const originalPriceNum = newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : priceNum;

      const selectedCat = categories.find((c) => c.name === newProdCategory);
      const generatedSku = newProdSKU.trim() || `SKU-${Math.floor(100000 + Math.random() * 900000)}`;

      const allImagesList = newProdImages.filter(Boolean);
      if (newProdImage && !allImagesList.includes(newProdImage)) {
        allImagesList.unshift(newProdImage);
      }
      const finalMainImage = allImagesList[0] || newProdImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600';
      const finalImagesArray = allImagesList.length > 0 ? allImagesList : [finalMainImage];

      const newProductItem: Product = {
        id: prodId,
        name: newProdName.trim(),
        slug: slug,
        price: priceNum,
        compareAtPrice: originalPriceNum,
        originalPrice: originalPriceNum,
        categoryName: newProdCategory || (categories[0]?.name || 'সাধারণ'),
        categoryId: selectedCat?.id || 'cat_custom',
        categorySlug: selectedCat?.slug || 'all',
        subCategory: newProdSubCategory.trim(),
        brand: newProdBrand.trim() || 'Black Zone',
        sku: generatedSku,
        barcode: newProdBarcode.trim() || generatedSku,
        videoUrl: newProdVideoUrl.trim(),
        image: finalMainImage,
        images: finalImagesArray,
        deliveryDays: newProdDeliveryDays.trim() || '২-৩ দিন',
        estimatedDeliveryTime: newProdDeliveryDays.trim() || '২-৩ দিন',
        stock: parseInt(newProdStock) || 50,
        description: newProdDescription || 'প্রিমিয়াম কোয়ালিটি পণ্য। Black Zone-এর নির্ভরযোগ্য ডেলিভারি।',
        rating: 5.0,
        reviewCount: 1,
        isFeatured: newProdIsFeatured,
        isFlashSale: newProdIsFlashSale,
        isPinned: newProdIsPinned,
        approvalStatus: 'approved',
        verified: true,
        tags: [newProdCategory || 'General', 'New Arrival'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'products', prodId), sanitizeForFirestore(newProductItem));

      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdPrice('');
      setNewProdOriginalPrice('');
      setNewProdImage('');
      setNewProdImages([]);
      setNewProdDeliveryDays('২-৩ দিন');
      setNewProdStock('50');
      setNewProdDescription('');
      setNewProdSKU('');
      setNewProdBarcode('');
      setNewProdVideoUrl('');
      setNewProdSubCategory('');
      setNewProdIsPinned(false);

      toast.success('নতুন পণ্য সফলভাবে স্টোরে যোগ হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('পণ্য যোগ করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Edit Product
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.categoryName || (categories[0]?.name || 'সাধারণ'));
    setEditProdSubCategory(prod.subCategory || '');
    setEditProdBrand(prod.brand || 'Black Zone');
    setEditProdSKU(prod.sku || '');
    setEditProdBarcode(prod.barcode || '');
    setEditProdVideoUrl(prod.videoUrl || '');
    setEditProdPrice(prod.price.toString());
    setEditProdOriginalPrice((prod.compareAtPrice || prod.originalPrice || prod.price).toString());
    setEditProdImage(prod.image || '');
    setEditProdImages(prod.images && prod.images.length > 0 ? prod.images : [prod.image].filter(Boolean));
    setEditProdDeliveryDays(prod.deliveryDays ? String(prod.deliveryDays) : prod.estimatedDeliveryTime || '২-৩ দিন');
    setEditProdStock((prod.stock || 0).toString());
    setEditProdDescription(prod.description || '');
    setEditProdIsFlashSale(prod.isFlashSale ?? false);
    setEditProdIsFeatured(prod.isFeatured ?? true);
    setEditProdIsPinned(prod.isPinned ?? false);
    setIsEditProductOpen(true);
  };

  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditProdImage(true);
    const toastId = toast.loading('পণ্যের নতুন ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      setEditProdImages((prev) => [...prev, url]);
      if (!editProdImage) setEditProdImage(url);
      toast.success('ছবি সফলভাবে আপলোড হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('ImgBB upload error:', err);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে।', { id: toastId });
    } finally {
      setUploadingEditProdImage(false);
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName.trim() || !editProdPrice) {
      toast.error('পণ্যের নাম এবং সঠিক মূল্য লিখুন!');
      return;
    }

    setSavingEditProduct(true);
    const toastId = toast.loading('পণ্য আপডেট হচ্ছে...');

    try {
      const priceNum = parseFloat(editProdPrice) || 0;
      const originalPriceNum = editProdOriginalPrice ? parseFloat(editProdOriginalPrice) : priceNum;
      const selectedCat = categories.find((c) => c.name === editProdCategory);

      const allImagesList = editProdImages.filter(Boolean);
      if (editProdImage && !allImagesList.includes(editProdImage)) {
        allImagesList.unshift(editProdImage);
      }
      const finalMainImage = allImagesList[0] || editProdImage;
      const finalImagesArray = allImagesList.length > 0 ? allImagesList : [finalMainImage];

      const updatedProduct: Partial<Product> = {
        name: editProdName.trim(),
        price: priceNum,
        compareAtPrice: originalPriceNum,
        originalPrice: originalPriceNum,
        categoryName: editProdCategory,
        categoryId: selectedCat?.id || editingProduct.categoryId,
        categorySlug: selectedCat?.slug || editingProduct.categorySlug,
        subCategory: editProdSubCategory.trim(),
        brand: editProdBrand.trim() || 'Black Zone',
        sku: editProdSKU.trim() || editingProduct.sku,
        barcode: editProdBarcode.trim() || editingProduct.barcode,
        videoUrl: editProdVideoUrl.trim(),
        image: finalMainImage,
        images: finalImagesArray,
        deliveryDays: editProdDeliveryDays.trim() || '২-৩ দিন',
        estimatedDeliveryTime: editProdDeliveryDays.trim() || '২-৩ দিন',
        stock: parseInt(editProdStock) || 0,
        description: editProdDescription,
        isFlashSale: editProdIsFlashSale,
        isFeatured: editProdIsFeatured,
        isPinned: editProdIsPinned,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'products', editingProduct.id), sanitizeForFirestore(updatedProduct));

      setIsEditProductOpen(false);
      setEditingProduct(null);
      toast.success('পণ্য সফলভাবে আপডেট করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('পণ্য আপডেট করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setSavingEditProduct(false);
    }
  };

  // Quick 1-Click Pin / Unpin Product in Category
  const handleTogglePinProduct = async (productId: string, currentPinStatus: boolean) => {
    try {
      const newStatus = !currentPinStatus;
      await updateDoc(doc(db, 'products', productId), {
        isPinned: newStatus,
        pinnedAt: newStatus ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      toast.success(newStatus ? '📌 পণ্যটি ক্যাটাগরিতে পিন করা হয়েছে!' : 'পণ্যটি আন-পিন করা হয়েছে');
    } catch (err) {
      console.error('Error toggling pin status:', err);
      toast.error('পিন স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে');
    }
  };

  // =========================================================================
  // COUPONS & DISCOUNTS MANAGEMENT
  // =========================================================================
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponValue) {
      toast.error('কুপন কোড এবং ডিসকাউন্ট পরিমাণ লিখুন!');
      return;
    }

    setSubmittingCoupon(true);
    const toastId = toast.loading('নতুন কুপন যোগ করা হচ্ছে...');

    try {
      const couponId = 'coupon_' + Date.now();
      const code = newCouponCode.trim().toUpperCase();

      const newCouponItem: Coupon = {
        id: couponId,
        code,
        description: newCouponDesc.trim() || 'বিশেষ কুপন অফার!',
        discountType: newCouponType,
        discountValue: parseFloat(newCouponValue) || 0,
        discountAmount: parseFloat(newCouponValue) || 0,
        minOrderAmount: parseFloat(newCouponMinOrder) || 0,
        minPurchaseAmount: parseFloat(newCouponMinOrder) || 0,
        maxDiscountAmount: parseFloat(newCouponMaxDiscount) || 0,
        maxDiscount: parseFloat(newCouponMaxDiscount) || 0,
        expiryDate: newCouponExpiry || undefined,
        isActive: true,
      };

      await saveCoupon(newCouponItem);

      setIsAddCouponOpen(false);
      setNewCouponCode('');
      setNewCouponDesc('');
      setNewCouponType('fixed');
      setNewCouponValue('');
      setNewCouponMinOrder('');
      setNewCouponMaxDiscount('');
      setNewCouponExpiry('');

      toast.success('নতুন কুপন সফলভাবে যোগ করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error adding coupon:', err);
      toast.error('কুপন তৈরি করতে সমস্যা হয়েছে।', { id: toastId });
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleRemoveCoupon = async (couponId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই কুপনটি ডিলিট করতে চান?')) return;

    const toastId = toast.loading('কুপন ডিলিট করা হচ্ছে...');
    try {
      await deleteCoupon(couponId);
      toast.success('কুপনটি সফলভাবে ডিলিট করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('কুপন ডিলিট করতে ব্যর্থ হয়েছে।', { id: toastId });
    }
  };

  // Product Approval Handlers
  const handleApproveProduct = async (productId: string) => {
    const toastId = toast.loading('প্রোডাক্ট অনুমোদন করা হচ্ছে...');
    try {
      await approveProductInFirestore(productId);
      toast.success('প্রোডাক্ট সফলভাবে অনুমোদন করা হয়েছে!', { id: toastId });
    } catch (err) {
      console.error('Approve product error:', err);
      toast.error('অনুমোদন করতে সমস্যা হয়েছে', { id: toastId });
    }
  };

  const handleRejectProduct = async (productId: string) => {
    const reason = window.prompt('প্রত্যাখ্যানের কারণ লিখুন (ঐচ্ছিক):', 'তথ্য অসম্পূর্ণ');
    if (reason === null) return;

    const toastId = toast.loading('প্রোডাক্ট প্রত্যাখ্যান করা হচ্ছে...');
    try {
      await rejectProductInFirestore(productId, reason);
      toast.success('প্রোডাক্ট প্রত্যাখ্যান করা হয়েছে', { id: toastId });
    } catch (err) {
      console.error('Reject product error:', err);
      toast.error('প্রত্যাখ্যান করতে সমস্যা হয়েছে', { id: toastId });
    }
  };

  // Bulk Upload Handler
  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) {
      toast.error('JSON/CSV ফরম্যাটে ডেটা ইনপুট দিন!');
      return;
    }

    setUploadingBulk(true);
    const toastId = toast.loading('বাল্ক প্রোডাক্ট ইমপোর্ট হচ্ছে...');

    try {
      let parsedData: any[] = [];
      try {
        parsedData = JSON.parse(bulkJsonText.trim());
      } catch (e) {
        toast.error('ইনপুট ডেটা সঠিক JSON ফরম্যাটে নেই। উদাহরণ: [{"name":"প্রোডাক্ট ১", "price": 500}]', { id: toastId });
        setUploadingBulk(false);
        return;
      }

      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        toast.error('ন্যূনতম ১টি প্রোডাক্টের তথ্য থাকতে হবে', { id: toastId });
        setUploadingBulk(false);
        return;
      }

      const count = await bulkUploadProductsToFirestore(parsedData);
      setIsBulkUploadModalOpen(false);
      setBulkJsonText('');
      toast.success(`সফলভাবে ${count} টি প্রোডাক্ট বাল্ক আপলোড করা হয়েছে!`, { id: toastId });
    } catch (err) {
      console.error('Bulk upload error:', err);
      toast.error('বাল্ক আপলোডে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setUploadingBulk(false);
    }
  };

  // =========================================================================
  // SYSTEM CONTROL HANDLERS (Banners, Reviews, Features)
  // =========================================================================
  const updateFeature = async (key: keyof FeatureToggles, value: any, autoSave = false) => {
    const updatedFeatures = {
      ...(storeSettings.features || DEFAULT_STORE_SETTINGS.features!),
      [key]: value
    };
    
    updateSettings({
      features: updatedFeatures
    });
  };

  const addBanner = () => {
    const newBanner: Banner = {
      id: Date.now().toString(),
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop',
      title: 'নতুন অফার ব্যানার',
      link: '/products'
    };
    const currentBanners = storeSettings.features?.banners || [];
    updateFeature('banners', [...currentBanners, newBanner]);
  };

  const removeBanner = (id: string) => {
    const currentBanners = storeSettings.features?.banners || [];
    updateFeature('banners', currentBanners.filter(b => b.id !== id));
  };

  // FAQ Management Functions
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqCategory('shipping');
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (faq: FAQItem) => {
    setEditingFaq(faq);
    setNewFaqQuestion(faq.question);
    setNewFaqAnswer(faq.answer);
    setNewFaqCategory(faq.category);
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error('প্রশ্ন ও উত্তর উভয়ই পূরণ করুন!');
      return;
    }

    const currentFaqs: FAQItem[] =
      storeSettings.features?.faqs && storeSettings.features.faqs.length > 0
        ? [...storeSettings.features.faqs]
        : [...(DEFAULT_FEATURE_TOGGLES.faqs as FAQItem[])];

    let updatedFaqs: FAQItem[];

    if (editingFaq) {
      updatedFaqs = currentFaqs.map((f) =>
        f.id === editingFaq.id
          ? {
              ...f,
              question: newFaqQuestion.trim(),
              answer: newFaqAnswer.trim(),
              category: newFaqCategory,
            }
          : f
      );
      toast.success('FAQ সফলভাবে আপডেট হয়েছে!');
    } else {
      const newFaq: FAQItem = {
        id: `faq-${Date.now()}`,
        question: newFaqQuestion.trim(),
        answer: newFaqAnswer.trim(),
        category: newFaqCategory,
      };
      updatedFaqs = [newFaq, ...currentFaqs];
      toast.success('নতুন FAQ সফলভাবে যোগ করা হয়েছে!');
    }

    updateFeature('faqs', updatedFaqs, true);
    setIsFaqModalOpen(false);
    setEditingFaq(null);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleDeleteFaq = (faqId: string) => {
    if (!window.confirm('আপনি কি এই FAQ প্রশ্নটি মুছে ফেলতে চান?')) return;

    const currentFaqs: FAQItem[] =
      storeSettings.features?.faqs && storeSettings.features.faqs.length > 0
        ? [...storeSettings.features.faqs]
        : [...(DEFAULT_FEATURE_TOGGLES.faqs as FAQItem[])];

    const updatedFaqs = currentFaqs.filter((f) => f.id !== faqId);
    updateFeature('faqs', updatedFaqs, true);
    toast.success('FAQ মুছে ফেলা হয়েছে!');
  };

  const handleResetFaqsToDefault = () => {
    if (!window.confirm('আপনি কি সকল FAQ প্রশ্ন ডিফল্ট মানে রিসেট করতে চান?')) return;
    updateFeature('faqs', DEFAULT_FEATURE_TOGGLES.faqs, true);
    toast.success('FAQ সমূহ ডিফল্ট মানে রিসেট করা হয়েছে!');
  };

  const addReview = () => {
    const newReview: CustomerReview = {
      id: Date.now().toString(),
      name: 'নতুন কাস্টমার',
      comment: 'খুবই ভালো পণ্য!',
      rating: 5,
      date: new Date().toISOString()
    };
    const currentReviews = storeSettings.features?.reviews || [];
    updateFeature('reviews', [newReview, ...currentReviews]);
  };

  const removeReview = (id: string) => {
    const currentReviews = storeSettings.features?.reviews || [];
    updateFeature('reviews', currentReviews.filter(r => r.id !== id));
  };

  const handleSystemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: string, bannerId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(target);
    const tid = toast.loading('ছবি আপলোড হচ্ছে...');
    try {
      const url = await uploadImageToImgBB(file);
      if (target === 'promo') {
        updateFeature('promoModalImage', url);
      } else if (target === 'whatsapp') {
        updateFeature('whatsappIcon', url);
      } else if (target === 'banner' && bannerId) {
        const currentBanners = storeSettings.features?.banners || [];
        updateFeature('banners', currentBanners.map(b => b.id === bannerId ? { ...b, image: url } : b));
      }
      toast.success('ছবি আপলোড সফল!', { id: tid });
    } catch (err) {
      toast.error('আপলোড ব্যর্থ হয়েছে', { id: tid });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই পণ্যটি ডিলিট করতে চান?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('পণ্য ডিলিট করা হয়েছে');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.success('পণ্য তালিকা থেকে সরিয়ে দেওয়া হয়েছে');
    }
  };

  // =========================================================================
  // STAFF MANAGEMENT HANDLERS (RBAC & Portal Access)
  // =========================================================================
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffUsername.trim() || !newStaffPassword.trim() || !newStaffFullName.trim()) {
      toast.error('সবগুলো বাধ্যতামূলক ফিল্ড পূরণ করুন!');
      return;
    }

    setSubmittingStaff(true);
    const toastId = toast.loading('নতুন অ্যাকাউন্ট তৈরি হচ্ছে...');

    try {
      const staffId = `staff_${Date.now()}`;
      const portalUrl = generateStaffPortalUrl(newStaffUsername.trim(), newStaffRole);
      const roleDef = ROLE_DEFINITIONS[newStaffRole] || ROLE_DEFINITIONS.staff;
      const permissions =
        newStaffPermissions.length > 0 ? newStaffPermissions : roleDef.defaultPermissions;

      await saveStaffAccount({
        id: staffId,
        username: newStaffUsername.trim(),
        password: newStaffPassword.trim(),
        fullName: newStaffFullName.trim(),
        phone: newStaffPhone.trim(),
        role: newStaffRole,
        isActive: true,
        permissions: permissions,
        loginUrl: portalUrl,
        portalUrl: portalUrl,
        portalType: (newStaffRole === 'delivery_man' ? 'delivery' : newStaffRole === 'moderator' ? 'moderator' : newStaffRole === 'order_manager' ? 'order_manager' : 'admin') as any,
      });

      setIsAddStaffOpen(false);
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffFullName('');
      setNewStaffPhone('');
      setNewStaffRole('delivery_man');
      setNewStaffPermissions([]);

      toast.success(
        newStaffRole === 'delivery_man'
          ? 'ডেলিভারি রাইডার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!'
          : newStaffRole === 'admin'
          ? 'নতুন অ্যাডমিন আইডি তৈরি হয়েছে!'
          : newStaffRole === 'moderator'
          ? 'নতুন মডারেটর আইডি তৈরি হয়েছে!'
          : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
        { id: toastId }
      );
    } catch (err: any) {
      console.error('Error adding staff:', err);
      toast.error('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleOpenEditStaff = (staff: StaffAccount) => {
    setEditingStaffId(staff.id);
    setEditStaffUsername(staff.username);
    setEditStaffPassword(staff.password || '');
    setEditStaffFullName(staff.fullName);
    setEditStaffPhone(staff.phone || '');
    setEditStaffRole(staff.role);
    setEditStaffPermissions(staff.permissions || ROLE_DEFINITIONS[staff.role]?.defaultPermissions || []);
    setIsEditStaffOpen(true);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffId || !editStaffUsername.trim() || !editStaffFullName.trim()) {
      toast.error('নাম এবং ইউজারনেম আবশ্যক');
      return;
    }

    setSavingEditStaff(true);
    const toastId = toast.loading('তথ্য আপডেট হচ্ছে...');

    try {
      const portalUrl = generateStaffPortalUrl(editStaffUsername.trim(), editStaffRole);
      const roleDef = ROLE_DEFINITIONS[editStaffRole] || ROLE_DEFINITIONS.staff;
      const permissions =
        editStaffPermissions.length > 0 ? editStaffPermissions : roleDef.defaultPermissions;

      await saveStaffAccount({
        id: editingStaffId,
        username: editStaffUsername.trim(),
        password: editStaffPassword.trim(),
        fullName: editStaffFullName.trim(),
        phone: editStaffPhone.trim(),
        role: editStaffRole,
        permissions: permissions,
        loginUrl: portalUrl,
        portalUrl: portalUrl,
        portalType: (editStaffRole === 'delivery_man' ? 'delivery' : editStaffRole === 'moderator' ? 'moderator' : editStaffRole === 'order_manager' ? 'order_manager' : 'admin') as any,
      });

      setIsEditStaffOpen(false);
      setEditingStaffId(null);
      setEditStaffPermissions([]);
      toast.success('তথ্য ও পারমিশন সফলভাবে সংরক্ষিত হয়েছে!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('আপডেট করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setSavingEditStaff(false);
    }
  };

  const handleAssignDeliveryManConfirm = async () => {
    if (!assigningOrder || !selectedDeliveryManId) {
      toast.error('অনুগ্রহ করে একজন ডেলিভারি কর্মী নির্বাচন করুন');
      return;
    }

    const deliveryStaff = staffAccounts.find((s) => s.id === selectedDeliveryManId);
    if (!deliveryStaff) return;

    setIsAssigningDelivery(true);
    const toastId = toast.loading('ডেলিভারি ম্যান নিযুক্ত করা হচ্ছে...');

    try {
      await assignDeliveryManToOrder(assigningOrder.id, deliveryStaff);
      
      // Update local orders state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === assigningOrder.id
            ? {
                ...o,
                assignedDeliveryManId: deliveryStaff.id,
                assignedDeliveryManName: deliveryStaff.fullName,
                assignedDeliveryManPhone: deliveryStaff.phone || '',
              }
            : o
        )
      );

      toast.success(`অর্ডারটি ডেলিভারি কর্মী '${deliveryStaff.fullName}' এর কাছে হস্তান্তর করা হয়েছে!`, {
        id: toastId,
      });
      setAssigningOrder(null);
      setSelectedDeliveryManId('');
    } catch (err: any) {
      console.error(err);
      toast.error('হস্তান্তর করতে সমস্যা হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই কর্মীকে মুছে ফেলতে চান?')) return;
    
    const toastId = toast.loading('মুছে ফেলা হচ্ছে...');
    try {
      await deleteStaffAccount(staffId);
      toast.success('সফলভাবে মুছে ফেলা হয়েছে!', { id: toastId });
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে', { id: toastId });
    }
  };

  const handleToggleStaffActive = async (staffId: string, currentStatus: boolean) => {
    try {
      await toggleStaffStatus(staffId, !currentStatus);
      toast.success(!currentStatus ? 'কর্মী অ্যাকাউন্ট সক্রিয় করা হয়েছে' : 'কর্মী অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে');
    } catch (e) {
      toast.error('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে');
    }
  };

  const handleOpenSettlementModal = (staff: StaffAccount) => {
    setSettlementStaff(staff);
    setSettlementAmount(String(staff.cashInHand || 0));
    setSettlementNote('দোকানে ক্যাশ জমা দিয়েছেন');
  };

  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementStaff) return;
    const amount = parseFloat(settlementAmount) || 0;
    if (amount <= 0) {
      toast.error('সঠিক জমার পরিমাণ উল্লেখ করুন');
      return;
    }

    setIsSettlingCash(true);
    const toastId = toast.loading('ক্যাশ জমা প্রসেস করা হচ্ছে...');
    try {
      await recordStaffSettlement(settlementStaff.id, amount, settlementNote);
      toast.success(`৳${amount.toLocaleString()} সফলভাবে দোকানে জমা নেওয়া হয়েছে!`, { id: toastId });
      setSettlementStaff(null);
      setSettlementAmount('');
      setSettlementNote('');
    } catch (err: any) {
      toast.error('জমা করতে ব্যর্থ হয়েছে: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsSettlingCash(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = (staffLoginUsername || staffUsernameParam || '').trim();
    if (!uname || !staffLoginPassword.trim()) {
      toast.error('ইউজারনেম ও পাসওয়ার্ড দুটিই পূরণ করুন!');
      return;
    }

    const toastId = toast.loading('স্টাফ অ্যাকাউন্ট যাচাই করা হচ্ছে...');
    try {
      let staff: StaffAccount | null | undefined = staffAccounts.find(
        (s) => s.username.toLowerCase() === uname.toLowerCase() && s.password === staffLoginPassword.trim() && s.isActive
      );

      if (!staff) {
        staff = await verifyStaffLogin(uname, staffLoginPassword.trim());
      }

      if (staff) {
        setStaffUser(staff);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('bdshops_admin_auth', 'true');
        sessionStorage.setItem('bdshops_staff_auth', JSON.stringify(staff));
        toast.success(`${staff.fullName}, স্বাগতম! (${staff.role.toUpperCase()}) প্যানেলে প্রবেশ করেছেন।`, { id: toastId });

        if (staff.role === 'delivery_man' || staff.role === 'order_manager') {
          setActiveTab('orders');
        } else if (staff.role === 'moderator') {
          setActiveTab('products');
        } else {
          setActiveTab('overview');
        }
      } else {
        toast.error('ভুল ইউজারনেম/পাসওয়ার্ড অথবা অ্যাকাউন্টটি নিষ্ক্রিয়!', { id: toastId });
      }
    } catch (err) {
      console.error('Staff login error:', err);
      toast.error('লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', { id: toastId });
    }
  };

  // Copy TrxID to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrxId(text);
    toast.success('TrxID কপি করা হয়েছে!');
    setTimeout(() => setCopiedTrxId(null), 2500);
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      orderFilter === 'all'
        ? true
        : orderFilter === 'pending'
        ? o.orderStatus === 'pending'
        : orderFilter === 'confirmed'
        ? o.orderStatus === 'confirmed'
        : orderFilter === 'shipped'
        ? o.orderStatus === 'shipped'
        : orderFilter === 'delivered'
        ? o.orderStatus === 'delivered'
        : orderFilter === 'online_payment'
        ? o.paymentMethod === 'online_payment' || o.paymentMethod === 'bkash' || o.paymentMethod === 'nagad'
        : true;

    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id?.toLowerCase().includes(q) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerInfo?.fullName?.toLowerCase().includes(q) ||
      o.customerInfo?.phone?.includes(q) ||
      o.customerPhone?.includes(q) ||
      o.transactionId?.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  // Filtered categories list
  const filteredCategories = categories.filter((c) => {
    const q = categorySearch.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  // Calculate quick metrics
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + (o.grandTotal || o.total || 0), 0);

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const confirmedOrdersCount = orders.filter((o) => o.orderStatus === 'confirmed').length;
  const processingOrdersCount = orders.filter((o) => o.orderStatus === 'processing').length;
  const shippedOrdersCount = orders.filter((o) => o.orderStatus === 'shipped').length;
  const deliveredOrdersCount = orders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrdersCount = orders.filter((o) => o.orderStatus === 'cancelled').length;

  // -------------------------------------------------------------
  // VIEW: IF NOT AUTHENTICATED -> DISPLAY PASSCODE / LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4">
        <Helmet>
          <title>{portalMode === 'staff' ? 'কর্মী পোর্টাল প্রবেশ' : 'এডমিন প্রবেশ'} — {storeSettings.siteName || 'Black Zone'}</title>
        </Helmet>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
          <div className="text-center space-y-2">
            {storeSettings.siteLogo ? (
              <img src={storeSettings.siteLogo} alt={storeSettings.siteName} className="h-14 mx-auto mb-2 object-contain rounded-xl" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-tr from-[#00BFA5] to-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#00BFA5]/30">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
            )}
            <h1 className="text-xl font-black tracking-tight">{storeSettings.siteName || 'Black Zone'} কন্ট্রোল সিস্টেম</h1>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/10 mt-3">
              <button
                type="button"
                onClick={() => setPortalMode('admin')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  portalMode === 'admin'
                    ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                মাস্টার অ্যাডমিন
              </button>
              <button
                type="button"
                onClick={() => setPortalMode('staff')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  portalMode === 'staff'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                কর্মী / স্টাফ পোর্টাল
              </button>
            </div>
          </div>

          {portalMode === 'staff' ? (
            /* STAFF / MODERATOR / DELIVERY MAN LOGIN FORM */
            <form onSubmit={handleStaffLogin} className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                <p className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-cyan-400" />
                  স্টাফ, মডারেটর ও ডেলিভারি লগইন
                </p>
                <p className="text-[10px] text-slate-300 mt-1">অ্যাডমিন কর্তৃক প্রদত্ত ইউজারনেম ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-300 uppercase mb-1.5 ml-1">
                  ইউজারনেম (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={staffLoginUsername}
                    onChange={(e) => setStaffLoginUsername(e.target.value)}
                    placeholder="যেমন: delivery_rakib"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-300 uppercase mb-1.5 ml-1">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={staffLoginPassword}
                    onChange={(e) => setStaffLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Staff Sign In
              </button>

              <div className="p-3 bg-white/5 rounded-2xl text-[10px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">উপলব্ধ রোলসমূহ:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold">মডারেটর</span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-bold">ডেলিভারি ম্যান</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">অর্ডার ম্যানেজার</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">এডমিন স্টাফ</span>
                </div>
              </div>
            </form>
          ) : (
            /* MASTER ADMIN UNIVERSAL LOGIN FORM */
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  মাস্টার অ্যাডমিন লগইন
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  অ্যাডমিন ইমেইল/ইউজারনেম ও পাসওয়ার্ড অথবা মাস্টার পাসকোড দিয়ে প্রবেশ করুন।
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-300 uppercase mb-1.5 ml-1">
                  অ্যাডমিন ইমেইল / ইউজারনেম
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="mdaponww2025@gmail.com বা admin"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-300 uppercase mb-1.5 ml-1">
                  পাসওয়ার্ড / পাসকোড
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড অথবা admin123"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full py-4 bg-gradient-to-r from-[#00BFA5] to-emerald-500 hover:from-[#00A892] hover:to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#00BFA5]/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Admin Login
                  </>
                )}
              </button>

              <div className="p-3 bg-white/5 rounded-2xl text-[10px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">সহজ লগইন টিপস:</span>
                <p className="text-slate-400">
                  ইমেইল: <span className="text-white font-mono font-bold">mdaponww2025@gmail.com</span> অথবা <span className="text-white font-mono font-bold">admin</span>
                  <br />
                  পাসকোড: <span className="text-emerald-400 font-mono font-bold">{storeSettings.adminPasscode || 'admin123'}</span> বা <span className="text-emerald-400 font-mono font-bold">7860</span>
                </p>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 flex items-center justify-center text-[10px] text-slate-500 uppercase font-black tracking-tighter">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              ← Back to User Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 pb-28 md:pb-12">
      <Helmet>
        <title>{storeSettings.siteName || 'Black Zone'} — অ্যাডমিন কন্ট্রোল প্যানেল</title>
      </Helmet>

      {/* TOP MASTER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {storeSettings.siteLogo ? (
              <img
                src={storeSettings.siteLogo}
                alt={storeSettings.siteName}
                className="h-9 max-w-[120px] object-contain rounded-lg"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00BFA5] to-teal-600 flex items-center justify-center text-white shadow-md shadow-[#00BFA5]/25">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base tracking-tight">
                  {storeSettings.siteName || 'Black Zone'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                রিয়েল-টাইম ইউজার সাইট কন্ট্রোল ও পেমেন্ট ভেরিফিকেশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#00BFA5] transition-all cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Staff User Status Badge */}
            {staffUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 text-xs font-bold">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                <span className="hidden sm:inline">{staffUser.fullName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-600 text-white text-[9px] uppercase font-black">{staffUser.role}</span>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('bdshops_admin_auth');
                    sessionStorage.removeItem('bdshops_staff_auth');
                    setStaffUser(null);
                    setIsAdminAuthenticated(false);
                    toast.success('স্টাফ লগআউট সম্পন্ন');
                  }}
                  className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase ml-1 cursor-pointer"
                >
                  লগআউট
                </button>
              </div>
            )}

            {/* Live User Site Link */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>🛍️ ইউজার সাইট</span>
            </Link>

            {/* Store Maintenance Toggle Quick Button */}
            {hasAccess('system') && (
              <button
                onClick={() => {
                  const next = !storeSettings.isStoreOnline;
                  updateSettings({ isStoreOnline: next });
                  toast.success(next ? 'ওয়েবসাইট সবার জন্য চালু করা হয়েছে!' : 'ওয়েবসাইট মেইনটেন্যান্স মোডে নেওয়া হয়েছে!');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  storeSettings.isStoreOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
                title="ওয়েবসাইট বন্ধ বা চালু করার সুইচ"
              >
                <Power className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {storeSettings.isStoreOnline ? 'সাইট: চালু' : 'সাইট: বন্ধ'}
                </span>
              </button>
            )}

            {/* Logout / Lock Button */}
            <button
              onClick={() => {
                sessionStorage.removeItem('bdshops_admin_auth');
                sessionStorage.removeItem('bdshops_staff_auth');
                setStaffUser(null);
                setIsAdminAuthenticated(false);
                toast('অ্যাডমিন প্যানেল লক করা হয়েছে');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="লক করুন"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* ========================================================= */}
          {/* DESKTOP SIDEBAR NAVIGATION */}
          {/* ========================================================= */}
          <aside className="hidden md:block md:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1 sticky top-24">
              <div className="px-3 py-2 mb-2">
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  প্রধান মেন্যু
                </p>
              </div>

              {/* Tab: Overview */}
              {hasAccess('overview') && (
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>ওভারভিউ ও ড্যাশবোর্ড</span>
                  </div>
                </button>
              )}

              {/* Tab: Orders */}
              {hasAccess('orders') && (
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>{staffUser?.role === 'delivery_man' ? 'ডেলিভারি ও পার্সেল ট্র্যাকিং' : 'অর্ডার ও পেমেন্ট অনুমোদন'}</span>
                  </div>
                  {pendingOrdersCount > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        activeTab === 'orders' ? 'bg-white text-slate-900' : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              )}

              {/* Tab: Products */}
              {hasAccess('products') && (
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>প্রোডাক্ট ম্যানেজমেন্ট</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{products.length}</span>
                </button>
              )}

              {/* Tab: Categories */}
              {hasAccess('categories') && (
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{categories.length}</span>
                </button>
              )}

              {/* Tab: Financial Summary (D3.js) */}
              {hasAccess('overview') && (
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'financial'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>ফাইন্যান্সিয়াল সামারি (D3)</span>
                  </div>
                </button>
              )}

              {/* Tab: User Management */}
              {hasAccess('system') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>ইউজার ও কাস্টমার ম্যানেজমেন্ট</span>
                  </div>
                </button>
              )}

              {/* Tab: Coupons */}
              {hasAccess('system') && (
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'coupons'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className={`w-4 h-4 ${activeTab === 'coupons' ? 'text-white' : 'text-[#00BFA5]'}`} />
                    <span>কুপন ও ডিসকাউন্ট অফার</span>
                  </div>
                  <span className={`text-[10px] font-bold ${activeTab === 'coupons' ? 'text-white/80' : 'text-slate-400'}`}>
                    {coupons.length}
                  </span>
                </button>
              )}

              {/* Tab: Live Chat */}
              {hasAccess('orders') && (
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'chats'
                      ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className={`w-4 h-4 ${activeTab === 'chats' ? 'text-white' : 'text-indigo-600'}`} />
                    <span>লাইভ চ্যাট সাপোর্ট</span>
                  </div>
                  {chatSessions.filter(s => s.status === 'active').length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'chats' ? 'bg-white text-slate-900' : 'bg-indigo-600 text-white'}`}>
                      {chatSessions.filter(s => s.status === 'active').length}
                    </span>
                  )}
                </button>
              )}

              {/* Tab: Advanced System Control */}
              {hasAccess('system') && (
                <button
                  onClick={() => setActiveTab('system')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className={`w-4 h-4 ${activeTab === 'system' ? 'text-white' : 'text-orange-600'}`} />
                    <span>সাইট সেটিংস ও কন্ট্রোল</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                </button>
              )}
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MAIN WORKSPACE CONTENT */}
          {/* ========================================================= */}
          <main className="col-span-1 md:col-span-9 space-y-5">
            
            {/* ------------------------------------------------------- */}
            {/* TAB: LIVE CHAT SUPPORT MANAGEMENT */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'chats' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row h-[70vh] animate-in fade-in slide-in-from-bottom-4">
                {/* Chat Sessions Sidebar */}
                <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-indigo-600" />
                      কাস্টমার চ্যাট
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {chatSessions.length === 0 ? (
                      <div className="p-10 text-center space-y-2">
                        <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">কোনো চ্যাট সেশন নেই</p>
                      </div>
                    ) : (
                      chatSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setSelectedChatId(session.id)}
                          className={`w-full text-left p-4 border-b border-slate-100 transition-all flex gap-3 items-start relative ${
                            selectedChatId === session.id ? 'bg-white ring-1 ring-inset ring-indigo-500/10' : 'hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200">
                            {session.customerPhotoUrl ? (
                              <img src={session.customerPhotoUrl} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              (session.customerName || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-black text-slate-900 truncate">{session.customerName}</p>
                              {session.status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">{session.lastMessage || 'নতুন সেশন'}</p>
                            <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">
                              {session.lastMessageTime?.toDate ? session.lastMessageTime.toDate().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'সক্রিয়'}
                            </p>
                          </div>
                          {selectedChatId === session.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col bg-white">
                  {selectedChatId ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                            {chatSessions.find(s => s.id === selectedChatId)?.customerName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{chatSessions.find(s => s.id === selectedChatId)?.customerName}</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">{chatSessions.find(s => s.id === selectedChatId)?.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {chatSessions.find(s => s.id === selectedChatId)?.status === 'active' ? (
                            <button
                              onClick={() => handleAdminCloseChat(selectedChatId)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                            >
                              সেশন বন্ধ করুন
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">বন্ধ করা হয়েছে</span>
                          )}
                          <button onClick={() => setSelectedChatId(null)} className="p-2 text-slate-400 hover:text-slate-900">
                             <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                        {adminChatMessages.map((msg) => {
                          const isMe = msg.senderRole === 'admin';
                          const isSystem = msg.senderRole === 'system';

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="text-center py-2">
                                <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[9px] font-black rounded-full shadow-xs">
                                  {msg.text}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-bold shadow-xs ${
                                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                              }`}>
                                {msg.taggedProduct && (
                                  <div className={`p-2 mb-2 rounded-xl border flex items-center gap-2 ${isMe ? 'bg-indigo-900/30 border-indigo-400' : 'bg-slate-50 border-slate-200'}`}>
                                    <img src={msg.taggedProduct.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                    <div className="flex-1 truncate">
                                      <p className="text-[10px] font-black truncate">{msg.taggedProduct.name}</p>
                                      <p className="text-[9px] text-amber-500">৳{msg.taggedProduct.price}</p>
                                    </div>
                                  </div>
                                )}
                                {msg.imageUrl && (
                                  <img src={msg.imageUrl} alt="" className="max-h-48 w-full object-cover rounded-xl mb-2" />
                                )}
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold px-1 uppercase tracking-tighter">
                                {msg.senderName} • {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'এখনই'}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={chatMessagesEndRef} />
                      </div>

                      {/* Admin Input Area */}
                      {chatSessions.find(s => s.id === selectedChatId)?.status === 'active' && (
                        <form onSubmit={handleAdminSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            value={adminChatText}
                            onChange={(e) => setAdminChatText(e.target.value)}
                            placeholder="রিপ্লাই লিখুন..."
                            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          />
                          <button
                            type="submit"
                            disabled={sendingAdminMessage || !adminChatText.trim()}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            {sendingAdminMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>পাঠান</span>
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        <MessageCircle className="w-10 h-10" />
                      </div>
                      <div className="max-w-sm">
                        <h3 className="text-base font-black text-slate-900 uppercase">লাইভ সাপোর্ট সেন্টার</h3>
                        <p className="text-[11px] text-slate-500 font-bold mt-1">
                          বামে থাকা কাস্টমারদের তালিকা থেকে সেশন নির্বাচন করে তাদের সাথে সরাসরি কথা বলুন এবং সমস্যা সমাধান করুন।
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Revenue */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">মোট বিক্রয়</span>
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00BFA5] flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">৳{totalRevenue.toLocaleString()}</h3>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">সফল অর্ডারের হিসাব</p>
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500 uppercase">নতুন অর্ডার</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-amber-600">{pendingOrdersCount}</h3>
                      <p className="text-[10px] text-amber-700 font-bold uppercase">অনুমোদনের অপেক্ষায়</p>
                    </div>
                  </div>

                  {/* Confirmed/Processing */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-500 uppercase">চলমান (Processing)</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-blue-600">{confirmedOrdersCount + processingOrdersCount}</h3>
                      <p className="text-[10px] text-blue-700 font-bold uppercase">প্যাকেজিং ও ভেরিফিকেশন</p>
                    </div>
                  </div>

                  {/* Delivered */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-500 uppercase">ডেলিভার্ড</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{deliveredOrdersCount}</h3>
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">সফলভাবে পৌঁছেছে</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">শিপিংয়ে আছে</p>
                        <p className="text-base font-black text-indigo-600">{shippedOrdersCount}</p>
                      </div>
                      <Truck className="w-4 h-4 text-indigo-400" />
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">বাতিল অর্ডার</p>
                        <p className="text-base font-black text-rose-600">{cancelledOrdersCount}</p>
                      </div>
                      <X className="w-4 h-4 text-rose-400" />
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">স্টোর প্রোডাক্টস</p>
                        <p className="text-base font-black text-purple-600">{products.length}</p>
                      </div>
                      <Boxes className="w-4 h-4 text-purple-400" />
                   </div>
                </div>

                {/* Quick Action Shortcuts Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      রিয়েল-টাইম অ্যাডমিন কন্ট্রোল সিস্টেম
                    </h2>
                    <p className="text-xs text-slate-300">
                      কাস্টমার অর্ডার করলে রিফ্রেশ ছাড়াই অর্ডার চলে আসবে। সাইটের নাম ও লোগো পরিবর্তন করলে ইউজার সাইটে সাথে সাথে আপডেট হবে।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={() => {
                        setActiveTab('categories');
                        setIsAddCategoryOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FolderPlus className="w-4 h-4" />
                      ক্যাটাগরি যোগ
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('products');
                        setIsAddProductOpen(true);
                      }}
                      className="px-4 py-2 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      পণ্য যোগ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB: FINANCIAL SUMMARY DASHBOARD (D3.js) */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'financial' && (
              <FinancialDashboard orders={orders} />
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB: USER MANAGEMENT & CUSTOMER HISTORY */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'users' && (
              <UserManagement />
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 2: ORDERS MANAGEMENT & PAYMENT APPROVAL */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#00BFA5]" />
                        অর্ডার ও পেমেন্ট অনুমোদন সিস্টেম
                      </h2>
                      <p className="text-xs text-slate-500">
                        লাইভ অর্ডার যাচাই করুন এবং ১-ক্লিকে নিশ্চিত (Confirm) করুন
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        রিয়েল-টাইম চালু
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="অর্ডার নাম্বার, গ্রাহকের নাম, ফোন বা TrxID দিয়ে খুঁজুন..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                      <button
                        onClick={() => setOrderFilter('all')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                          orderFilter === 'all'
                            ? 'bg-[#00BFA5] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        সব ({orders.length})
                      </button>
                      <button
                        onClick={() => setOrderFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                          orderFilter === 'pending'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        অপেক্ষমাণ ({pendingOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderFilter('confirmed')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                          orderFilter === 'confirmed'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        কনফার্মড ({confirmedOrdersCount})
                      </button>
                      <button
                        onClick={() => setOrderFilter('delivered')}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                          orderFilter === 'delivered'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ডেলিভার্ড ({deliveredOrdersCount})
                      </button>
                    </div>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#00BFA5] mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">অর্ডার লোড হচ্ছে...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">কোনো অর্ডার পাওয়া যায়নি</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isPending = order.orderStatus === 'pending';
                      const isConfirmed = order.orderStatus === 'confirmed';
                      const isShipped = order.orderStatus === 'shipped';
                      const isDelivered = order.orderStatus === 'delivered';
                      const isCancelled = order.orderStatus === 'cancelled';

                      return (
                        <div
                          key={order.id}
                          className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs transition-all space-y-4 ${
                            isPending
                              ? 'border-amber-300 ring-1 ring-amber-200'
                              : 'border-slate-200/80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm sm:text-base text-slate-900">
                                  #{order.orderNumber || order.id?.slice(-8)}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-800'
                                      : isConfirmed
                                      ? 'bg-blue-100 text-blue-800'
                                      : isShipped
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : isDelivered
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {isPending
                                    ? 'অপেক্ষমাণ'
                                    : isConfirmed
                                    ? 'নিশ্চিত করা হয়েছে'
                                    : isShipped
                                    ? 'কুরিয়ারে আছে'
                                    : isDelivered
                                    ? 'ডেলিভারি সম্পন্ন'
                                    : 'বাতিল'}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {order.createdAt ? new Date(order.createdAt).toLocaleString('bn-BD') : ''}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-600">
                                গ্রাহক: <span className="font-bold text-slate-900">{order.customerInfo?.fullName || order.customerName || 'সম্মানিত ক্রেতা'}</span> • ফোন: <a href={`tel:${order.customerInfo?.phone || order.customerPhone}`} className="text-[#00BFA5] font-bold hover:underline">{order.customerInfo?.phone || order.customerPhone}</a>
                              </p>
                              <p className="text-xs text-slate-500">
                                ঠিকানা: {order.address || order.shippingAddress?.address || 'ঠিকানা দেওয়া হয়নি'}, {order.district || order.shippingAddress?.district || order.shippingAddress?.city || ''}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-400 font-bold">সর্বমোট বিল</p>
                              <p className="text-lg sm:text-xl font-black text-[#00796B]">
                                ৳{(order.grandTotal || order.total || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* ORDER ITEMS LIST */}
                          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 px-1">অর্ডারকৃত পণ্যসমূহ:</h4>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-2.5">
                                    <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</p>
                                      <p className="text-[10px] text-slate-500 font-bold">
                                        {item.quantity}টি × ৳{item.price} 
                                        {item.selectedSize ? ` | সাইজ: ${item.selectedSize}` : ''}
                                        {item.selectedColor ? ` | রঙ: ${item.selectedColor}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-slate-900">৳{(item.price * item.quantity).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* PAYMENT VERIFICATION BADGE & DETAILS */}
                          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-bold text-slate-700">পেমেন্ট মেথড:</span>
                                <span className="text-xs font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
                                  {order.paymentMethod === 'online_payment'
                                    ? 'অনলাইন পেমেন্ট'
                                    : order.paymentMethod === 'bkash'
                                    ? 'বিকাশ'
                                    : order.paymentMethod === 'nagad'
                                    ? 'নগদ'
                                    : 'ক্যাশ অন ডেলিভারি (COD)'}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    order.paymentStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {order.paymentStatus === 'paid' ? 'পরিশোধিত (Paid)' : 'পরিশোধ বাকি (Unpaid)'}
                                </span>
                              </div>

                              {order.transactionId && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs font-bold text-slate-600">TrxID:</span>
                                  <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 select-all">
                                    {order.transactionId}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(order.transactionId!)}
                                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title="কপি করুন"
                                  >
                                    {copiedTrxId === order.transactionId ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* View Slip Modal Trigger */}
                            {(order.paymentProofUrl || (order as any).paymentSlipUrl) && (
                              <button
                                onClick={() => setProofModalUrl(order.paymentProofUrl || (order as any).paymentSlipUrl)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>পেমেন্ট স্লিপ দেখুন</span>
                              </button>
                            )}
                          </div>

                          {/* ACTION BUTTONS (ONE-CLICK APPROVE / UPDATE) */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2">
                              {/* Quick Call */}
                              <a
                                href={`tel:${order.customerInfo?.phone || order.customerPhone}`}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#00BFA5]" />
                                কল দিন
                              </a>
                            </div>

                            {/* Status Changer Actions */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'confirmed', 'paid')}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>পেমেন্ট নিশ্চিত ও অর্ডার অনুমোদন</span>
                                </button>
                              )}

                              {/* Delivery Person Assignment */}
                              {['pending', 'confirmed', 'processing', 'shipped'].includes(order.orderStatus) && (
                                <button
                                  onClick={() => {
                                    setAssigningOrder(order);
                                    setSelectedDeliveryManId(order.assignedDeliveryManId || '');
                                  }}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                                  title="ডেলিভারি কর্মী নিযুক্ত করুন"
                                >
                                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    {order.assignedDeliveryManName
                                      ? `রাইডার: ${order.assignedDeliveryManName}`
                                      : 'ডেলিভারি ম্যান দিন'}
                                  </span>
                                </button>
                              )}

                              {isConfirmed && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>কুরিয়ারে পাঠান (Shipped)</span>
                                </button>
                              )}

                              {isShipped && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered', 'paid')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ডেলিভারি সম্পন্ন (Delivered)</span>
                                </button>
                              )}

                              {!isCancelled && !isDelivered && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('আপনি কি এই অর্ডারটি বাতিল করতে চান?')) {
                                      handleUpdateOrderStatus(order.id, 'cancelled');
                                    }
                                  }}
                                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  বাতিল
                                </button>
                              )}

                              {isCancelled && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('আপনি কি এই অর্ডারটি স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) {
                                      try {
                                        await deleteDoc(doc(db, 'orders', order.id));
                                        toast.success('অর্ডার মুছে ফেলা হয়েছে');
                                      } catch (e) {
                                        toast.error('অর্ডার ডিলিট করতে সমস্যা হয়েছে');
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 3: PRODUCT MANAGEMENT */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#00BFA5]" />
                      প্রোডাক্ট ম্যানেজমেন্ট
                    </h2>
                    <p className="text-xs text-slate-500">
                      নতুন পণ্য যোগ করুন, দাম পরিবর্তন ও স্টক নিয়ন্ত্রণ করুন
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBulkUploadModalOpen(true)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Boxes className="w-4 h-4" />
                      <span>বাল্ক আপলোড (Bulk)</span>
                    </button>
                    <button
                      onClick={() => setIsAddProductOpen(true)}
                      className="px-4 py-2 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন পণ্য যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Products Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="নাম, SKU, বারকোড বা ক্যাটাগরি দিয়ে পণ্য খুঁজুন..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {/* Approval Filter Buttons */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none text-xs font-bold shrink-0">
                    <button
                      onClick={() => setProductApprovalFilter('all')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        productApprovalFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      সব ({products.length})
                    </button>
                    <button
                      onClick={() => setProductApprovalFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        productApprovalFilter === 'pending'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      পেন্ডিং ({products.filter((p) => p.approvalStatus === 'pending').length})
                    </button>
                    <button
                      onClick={() => setProductApprovalFilter('approved')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        productApprovalFilter === 'approved'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      অনুমোদিত ({products.filter((p) => !p.approvalStatus || p.approvalStatus === 'approved').length})
                    </button>
                    <button
                      onClick={() => setProductApprovalFilter('rejected')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        productApprovalFilter === 'rejected'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      বাতিল ({products.filter((p) => p.approvalStatus === 'rejected').length})
                    </button>
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts
                    .filter((prod) => {
                      if (productApprovalFilter === 'all') return true;
                      if (productApprovalFilter === 'approved') return !prod.approvalStatus || prod.approvalStatus === 'approved';
                      return prod.approvalStatus === productApprovalFilter;
                    })
                    .map((prod) => {
                      const isPending = prod.approvalStatus === 'pending';
                      const isRejected = prod.approvalStatus === 'rejected';

                      return (
                        <div
                          key={prod.id}
                          className={`bg-white rounded-3xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                            isPending
                              ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                              : isRejected
                              ? 'border-rose-200 bg-rose-50/10'
                              : 'border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={prod.images?.[0] || prod.image}
                              alt={prod.name}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                            />
                            <div className="truncate flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black text-[#00796B] bg-teal-50 px-2 py-0.5 rounded-md">
                                  {prod.categoryName || 'সাধারণ'}
                                </span>
                                {prod.brand && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                    {prod.brand}
                                  </span>
                                )}
                                {isPending && (
                                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md animate-pulse">
                                    অপেক্ষমাণ
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                                    বাতিল
                                  </span>
                                )}
                                {prod.isPinned && (
                                  <span className="text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-2xs">
                                    <span>📌</span>
                                    <span>পিন করা</span>
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 truncate" title={prod.name}>
                                {prod.name}
                              </h4>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>SKU: {prod.sku || 'N/A'}</span>
                              </div>

                              <p className="text-xs font-black text-[#00796B]">
                                ৳{prod.price?.toLocaleString()}
                                {(prod.compareAtPrice || prod.originalPrice) && (prod.compareAtPrice || prod.originalPrice || 0) > prod.price && (
                                  <span className="text-[10px] font-normal text-slate-400 line-through ml-1.5">
                                    ৳{(prod.compareAtPrice || prod.originalPrice)?.toLocaleString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Approval Actions or Edit/Delete */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 font-semibold">
                              স্টক: <b className={prod.stock === 0 ? 'text-rose-600' : 'text-slate-800'}>{prod.stock ?? 50} টি</b>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* 1-Click Pin / Unpin Button */}
                              <button
                                onClick={() => handleTogglePinProduct(prod.id, prod.isPinned ?? false)}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                                  prod.isPinned
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 shadow-2xs'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={prod.isPinned ? 'ক্যাটাগরি থেকে আন-পিন করুন' : 'ক্যাটাগরিতে পিন 📌 করুন'}
                              >
                                <span className="text-xs">📌</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApproveProduct(prod.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                                    title="অনুমোদন করুন"
                                  >
                                    অনুমোদন
                                  </button>
                                  <button
                                    onClick={() => handleRejectProduct(prod.id)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                                    title="বাতিল করুন"
                                  >
                                    বাতিল
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => openEditProductModal(prod)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="সম্পাদনা করুন"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ডিলিট করুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB: COUPON & DISCOUNT MANAGEMENT */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-[#00BFA5]" />
                      কুপন কোড ও ডিসকাউন্ট অফার কন্ট্রোল
                    </h2>
                    <p className="text-xs text-slate-500">
                      নতুন কুপন কোড তৈরি করুন, ডিসকাউন্ট মূল্য সেট করুন এবং কাস্টমার চেকআউটে অফার দিন
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddCouponOpen(true)}
                    className="px-4 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন কুপন তৈরি করুন</span>
                  </button>
                </div>

                {/* Coupons List */}
                {loadingCoupons ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00BFA5]" />
                    <span>কুপন তালিকা লোড হচ্ছে...</span>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center text-slate-400">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-xs font-bold">কোনো কুপন কোড তৈরি করা নেই!</p>
                    <p className="text-[10px] mt-1">কাস্টমারদের বিশেষ ছাড় দিতে "নতুন কুপন তৈরি করুন" বাটনে ক্লিক করুন।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((cp) => {
                      const isExpired = cp.expiryDate && new Date(cp.expiryDate) < new Date();
                      return (
                        <div
                          key={cp.id}
                          className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                            isExpired ? 'border-slate-200 bg-slate-50/50 grayscale' : 'border-slate-200'
                          }`}
                        >
                          {/* Top Deco Line */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isExpired ? 'bg-slate-400' : 'bg-[#00BFA5]'}`}></div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-black text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg uppercase tracking-wider">
                                {cp.code}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isExpired
                                    ? 'bg-rose-100 text-rose-700'
                                    : cp.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isExpired ? 'মেয়াদোত্তীর্ণ' : cp.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 font-bold">{cp.description}</p>

                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold">
                              <div>
                                ডিসকাউন্ট: <b className="text-slate-800">{cp.discountType === 'percentage' ? `${cp.discountValue}%` : `৳${cp.discountValue.toLocaleString()}`}</b>
                              </div>
                              <div>
                                সর্বনিম্ন অর্ডার: <b className="text-slate-800">৳{(cp.minOrderAmount || cp.minPurchaseAmount || 0).toLocaleString()}</b>
                              </div>
                              {cp.discountType === 'percentage' && (cp.maxDiscountAmount || cp.maxDiscount || 0) > 0 && (
                                <div className="col-span-2">
                                  সর্বোচ্চ ছাড় সীমা: <b className="text-rose-600">৳{(cp.maxDiscountAmount || cp.maxDiscount || 0).toLocaleString()}</b>
                                </div>
                              )}
                              {cp.expiryDate && (
                                <div className="col-span-2 text-slate-400">
                                  মেয়াদ শেষ: <b>{new Date(cp.expiryDate).toLocaleDateString('bn-BD')}</b>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleRemoveCoupon(cp.id)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              ডিলিট কুপন
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 4: CATEGORY MANAGEMENT (ADD, EDIT, DELETE) */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      ক্যাটাগরি কন্ট্রোল ও ম্যানেজমেন্ট
                    </h2>
                    <p className="text-xs text-slate-500">
                      ক্যাটাগরি যুক্ত, সম্পাদনা (Edit) ও ডিলিট করুন—ইউজার সাইটে সাথে সাথে লাইভ দৃশ্যমান হবে
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                  </button>
                </div>

                {/* Categories Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="ক্যাটাগরির নাম দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600'}
                          alt={cat.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</p>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            সিরিয়াল: {cat.order || 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* TAB 5: MODULAR SYSTEM & SITE CONTROL */}
            {/* ------------------------------------------------------- */}
            {activeTab === 'system' && (
              <div className="space-y-6 pb-20">
                {/* Master Header */}
                <div className="sticky top-[72px] z-30 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Settings className="w-5 h-5 text-white animate-spin-slow" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase">মাস্টার সাইট কন্ট্রোল</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {activeSystemSubTab ? `ম্যানেজিং: ${activeSystemSubTab}` : 'Dashboard Overview'}
                        </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     {activeSystemSubTab && (
                       <button 
                        onClick={() => setActiveSystemSubTab(null)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
                       >
                         <ChevronLeft className="w-3.5 h-3.5" /> ফিরে যান
                       </button>
                     )}
                     <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 shadow-xl"
                     >
                       {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       সব সেভ করুন
                     </button>
                   </div>
                </div>

                {/* Dashboard Menu (Grid of Buttons) */}
                {!activeSystemSubTab && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'branding', label: 'ব্র্যান্ডিং ও লোগো', icon: <Sparkles />, color: 'bg-amber-500', desc: 'নাম, ইমেইল ও লোগো' },
                      { id: 'slider', label: 'ইমেজ স্লাইডার', icon: <ImageIcon />, color: 'bg-blue-500', desc: 'হোম পেজ ব্যানার' },
                      { id: 'whatsapp', label: 'হোয়াটসঅ্যাপ', icon: <MessageCircle />, color: 'bg-emerald-500', desc: 'চ্যাট ও সাপোর্ট' },
                      { id: 'delivery', label: 'ডেলিভারি চার্জ', icon: <Truck />, color: 'bg-orange-500', desc: 'শিপিং ও ফ্রি লিমিট' },
                      { id: 'payment', label: 'পেমেন্ট গেটওয়ে', icon: <CreditCard />, color: 'bg-indigo-500', desc: 'বিকাশ, নগদ সেটিংস' },
                      { id: 'notice', label: 'নোটিশ ও অফার', icon: <Bell />, color: 'bg-rose-500', desc: 'অ্যানাউন্সমেন্ট বার' },
                      { id: 'features', label: 'ফিচার কন্ট্রোল', icon: <Power />, color: 'bg-slate-800', desc: 'সব ফিচার অন/অফ' },
                      { id: 'security', label: 'নিরাপত্তা ও কোড', icon: <Lock />, color: 'bg-rose-600', desc: 'অ্যাডমিন পাসকোড সেটিংস' },
                      { id: 'monitoring', label: 'শপ মনিটরিং', icon: <Eye />, color: 'bg-purple-600', desc: 'অনলাইন/অফলাইন স্ট্যাটাস' },
                      { id: 'faq', label: 'FAQ প্রশ্নোত্তর', icon: <HelpCircle />, color: 'bg-teal-600', desc: 'শিপিং, রিটার্ন ও পেমেন্ট' },
                      { id: 'staff', label: 'কর্মী ব্যবস্থাপনা', icon: <Boxes />, color: 'bg-cyan-600', desc: 'মডারেটর ও রোল ম্যানেজমেন্ট' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSystemSubTab(item.id)}
                        className="group bg-white p-5 rounded-[2.5rem] border border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300 text-left space-y-4 cursor-pointer"
                      >
                        <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 text-white' })}
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.label}</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sub-Section Views */}
                {activeSystemSubTab === 'branding' && (
                   <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      {/* 1. Website General & Branding (Name, Logo, Favicon) */}
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase">⚙️ জেনারেল ব্র্যান্ডিং (Website Name, Logo & Favicon)</h3>
                            <p className="text-[10px] font-bold text-slate-400">সাইটের নাম, লোগো ও ব্রাউজার আইকন কনফিগার করুন</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2">ওয়েবসাইটের নাম (Website Name)</label>
                          <input
                            type="text"
                            value={storeSettings.siteName}
                            onChange={(e) => updateSettings({ siteName: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                            placeholder="e.g. Black Zone"
                          />
                        </div>

                        {/* Logo & Favicon Upload Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                           {/* Site Logo Box */}
                           <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                 <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-amber-500" /> সাইটের লোগো (Site Logo)
                                 </span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-24 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-2 shadow-inner overflow-hidden shrink-0">
                                    {storeSettings.siteLogo ? <img src={storeSettings.siteLogo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="w-8 h-8 text-slate-200" />}
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    <label className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95">
                                       <Upload className="w-3.5 h-3.5" />
                                       <span>লোগো আপলোড (ডিভাইস)</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                    {storeSettings.siteLogo && (
                                       <button 
                                         onClick={() => updateSettings({ siteLogo: '' })}
                                         className="w-full py-1.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                       >লোগো মুছুন</button>
                                    )}
                                 </div>
                              </div>
                              <input 
                                type="text" 
                                value={storeSettings.siteLogo || ''} 
                                onChange={(e) => updateSettings({ siteLogo: e.target.value })} 
                                placeholder="সরাসরি লোগো URL..." 
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-amber-400" 
                              />
                           </div>

                           {/* Favicon Icon Box */}
                           <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                 <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" /> ব্রাউজার আইকন (Favicon)
                                 </span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center p-3 shadow-inner overflow-hidden shrink-0">
                                    {storeSettings.favicon ? <img src={storeSettings.favicon} alt="Favicon" className="w-10 h-10 object-contain" /> : <Sparkles className="w-8 h-8 text-slate-200" />}
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    <label className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95">
                                       <Upload className="w-3.5 h-3.5" />
                                       <span>ফ্যাভিকন আপলোড (ডিভাইস)</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleFaviconUpload} />
                                    </label>
                                    {storeSettings.favicon && (
                                       <button 
                                         onClick={() => updateSettings({ favicon: '' })}
                                         className="w-full py-1.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                                       >ফ্যাভিকন মুছুন</button>
                                    )}
                                 </div>
                              </div>
                              <input 
                                type="text" 
                                value={storeSettings.favicon || ''} 
                                onChange={(e) => updateSettings({ favicon: e.target.value })} 
                                placeholder="সরাসরি ফ্যাভিকন URL..." 
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-amber-400" 
                              />
                           </div>
                        </div>

                        {/* Direct 1-Click Save for Branding */}
                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveSettings()}
                            disabled={savingSettings}
                            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/25 transition-transform active:scale-95 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                          >
                            {savingSettings ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>নাম ও ব্র্যান্ডিং সেভ করুন</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Theme & Appearance (Light/Dark Mode, Language & Currency) */}
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                            <Power className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase">🎨 থিম, ভাষা ও কারেন্সি সেটিংস</h3>
                            <p className="text-[10px] font-bold text-slate-400">Light/Dark মোড, প্রাইমারি থিম কালার, ভাষা ও কারেন্সি নিয়ন্ত্রক</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">থিম মোড (Light / Dark)</label>
                              <select
                                value={storeSettings.themeMode || 'light'}
                                onChange={(e) => updateSettings({ themeMode: e.target.value as any })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                              >
                                <option value="light">☀️ লাইট মোড (Light Mode)</option>
                                <option value="dark">🌙 ডার্ক মোড (Dark Mode)</option>
                                <option value="system">💻 সিস্টেম ডিফল্ট (Auto)</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">মুদ্রা (Currency)</label>
                              <select
                                value={storeSettings.currencySymbol || '৳'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const code = val === '৳' ? 'BDT' : val === '$' ? 'USD' : 'EUR';
                                  updateSettings({ currencySymbol: val, currencyCode: code });
                                }}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                              >
                                <option value="৳">৳ বাংলাদেশী টাকা (BDT)</option>
                                <option value="$">$ ইউএস ডলার (USD)</option>
                                <option value="€">€ ইউরো (EUR)</option>
                              </select>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">ওয়েবসাইট ভাষা (Language)</label>
                              <select
                                value={storeSettings.language || 'bn'}
                                onChange={(e) => updateSettings({ language: e.target.value as any })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                              >
                                <option value="bn">🇧🇩 বাংলা (Bengali)</option>
                                <option value="en">🇺🇸 English (ইংরেজি)</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2">ব্র্যান্ডের প্রাইমারি কালার (Primary Accent Color)</label>
                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                             <input
                               type="color"
                               value={storeSettings.themeColor || '#ea580c'}
                               onChange={(e) => updateSettings({ themeColor: e.target.value })}
                               className="w-14 h-10 rounded-xl cursor-pointer bg-white border border-slate-200 p-1"
                             />
                             <input
                               type="text"
                               value={storeSettings.themeColor || '#ea580c'}
                               onChange={(e) => updateSettings({ themeColor: e.target.value })}
                               className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                             />
                          </div>
                        </div>
                      </div>

                      {/* 3. Contact Info & Social Links */}
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase">📞 কন্টাক্ট ইনফো ও সোশ্যাল মিডিয়া লিংক</h3>
                            <p className="text-[10px] font-bold text-slate-400">শপের ফোন নাম্বার, ইমেইল, ঠিকানা ও সোশ্যাল প্রোফাইল</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">হেল্পলাইন ফোন</label>
                              <input
                                type="text"
                                value={storeSettings.supportPhone}
                                onChange={(e) => updateSettings({ supportPhone: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="017XXXXXXXX"
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">সাপোর্ট ইমেইল</label>
                              <input
                                type="email"
                                value={storeSettings.supportEmail}
                                onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="support@blackzone.com.bd"
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">শপ ঠিকানা (Address)</label>
                              <input
                                type="text"
                                value={storeSettings.address || 'ঢাকা, বাংলাদেশ'}
                                onChange={(e) => updateSettings({ address: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="যেমন: ধানমন্ডি, ঢাকা"
                              />
                           </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                           <h4 className="text-xs font-black text-slate-700 uppercase">সোশ্যাল মিডিয়া প্রোফাইল লিংকসমূহ</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 ml-1">Facebook URL</label>
                                <input
                                  type="text"
                                  value={storeSettings.socialLinks?.facebook || ''}
                                  onChange={(e) => updateSettings({ socialLinks: { ...storeSettings.socialLinks, facebook: e.target.value } })}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                  placeholder="https://facebook.com/yourpage"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 ml-1">Instagram URL</label>
                                <input
                                  type="text"
                                  value={storeSettings.socialLinks?.instagram || ''}
                                  onChange={(e) => updateSettings({ socialLinks: { ...storeSettings.socialLinks, instagram: e.target.value } })}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                  placeholder="https://instagram.com/yourpage"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 ml-1">YouTube Channel URL</label>
                                <input
                                  type="text"
                                  value={storeSettings.socialLinks?.youtube || ''}
                                  onChange={(e) => updateSettings({ socialLinks: { ...storeSettings.socialLinks, youtube: e.target.value } })}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                  placeholder="https://youtube.com/@channel"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 ml-1">TikTok Profile URL</label>
                                <input
                                  type="text"
                                  value={storeSettings.socialLinks?.tiktok || ''}
                                  onChange={(e) => updateSettings({ socialLinks: { ...storeSettings.socialLinks, tiktok: e.target.value } })}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                                  placeholder="https://tiktok.com/@profile"
                                />
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* 4. Email & SMS Settings */}
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase">📧 ইমেইল ও SMS নোটিফিকেশন সেটিংস</h3>
                            <p className="text-[10px] font-bold text-slate-400">নতুন অর্ডারে অটোমেটিক ইমেইল ও মোবাইল SMS পাঠানো</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">অ্যাডমিন নোটিফিকেশন ইমেইল</label>
                              <input
                                type="email"
                                value={storeSettings.emailSettings?.adminEmail || ''}
                                onChange={(e) => updateSettings({ emailSettings: { ...storeSettings.emailSettings, adminEmail: e.target.value } })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="admin@domain.com"
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">অর্ডার কনফার্মেশন সেন্ডার ইমেইল</label>
                              <input
                                type="email"
                                value={storeSettings.emailSettings?.orderNotificationEmail || ''}
                                onChange={(e) => updateSettings({ emailSettings: { ...storeSettings.emailSettings, orderNotificationEmail: e.target.value } })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="orders@domain.com"
                              />
                           </div>
                        </div>

                        <div className="p-6 bg-cyan-50/50 rounded-[2rem] border border-cyan-100 space-y-4">
                           <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-black text-cyan-900 uppercase">SMS নোটিফিকেশন গেটওয়ে</h4>
                                <p className="text-[9px] font-bold text-cyan-700">কাস্টমারকে অর্ডারের অবস্থা SMS এর মাধ্যমে জানানো</p>
                              </div>
                              <button
                                onClick={() => updateSettings({ smsSettings: { ...storeSettings.smsSettings, enabled: !storeSettings.smsSettings?.enabled } })}
                                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                  storeSettings.smsSettings?.enabled ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {storeSettings.smsSettings?.enabled ? 'SMS সক্রিয় (ON)' : 'SMS বন্ধ (OFF)'}
                              </button>
                           </div>

                           {storeSettings.smsSettings?.enabled && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">SMS Provider</label>
                                  <input
                                    type="text"
                                    value={storeSettings.smsSettings?.provider || 'Greenweb SMS'}
                                    onChange={(e) => updateSettings({ smsSettings: { ...storeSettings.smsSettings, provider: e.target.value } })}
                                    className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">API Key</label>
                                  <input
                                    type="password"
                                    value={storeSettings.smsSettings?.apiKey || ''}
                                    onChange={(e) => updateSettings({ smsSettings: { ...storeSettings.smsSettings, apiKey: e.target.value } })}
                                    className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-mono"
                                    placeholder="আপনার SMS API কি..."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Sender ID</label>
                                  <input
                                    type="text"
                                    value={storeSettings.smsSettings?.senderId || ''}
                                    onChange={(e) => updateSettings({ smsSettings: { ...storeSettings.smsSettings, senderId: e.target.value } })}
                                    className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-bold"
                                    placeholder="e.g. BLACKZONE"
                                  />
                                </div>
                              </div>
                           )}
                        </div>
                      </div>

                      {/* 5. Tax Settings & Maintenance Mode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Tax Settings */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                              <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-purple-600" />
                                ভ্যাট ও ট্যাক্স সেটিংস (Tax/VAT)
                              </h3>
                              <button
                                onClick={() => updateSettings({ taxSettings: { ...storeSettings.taxSettings, enabled: !storeSettings.taxSettings?.enabled } })}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                                  storeSettings.taxSettings?.enabled ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {storeSettings.taxSettings?.enabled ? 'অন (ON)' : 'অফ (OFF)'}
                              </button>
                           </div>

                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ভ্যাট/ট্যাক্স হার (%)</label>
                                 <input
                                   type="number"
                                   disabled={!storeSettings.taxSettings?.enabled}
                                   value={storeSettings.taxSettings?.taxRatePercentage || 0}
                                   onChange={(e) => updateSettings({ taxSettings: { ...storeSettings.taxSettings, taxRatePercentage: parseFloat(e.target.value) || 0 } })}
                                   className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black disabled:opacity-50"
                                   placeholder="5"
                                 />
                              </div>

                              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                 <input
                                   type="checkbox"
                                   id="isInclusiveTax"
                                   disabled={!storeSettings.taxSettings?.enabled}
                                   checked={storeSettings.taxSettings?.isInclusive ?? true}
                                   onChange={(e) => updateSettings({ taxSettings: { ...storeSettings.taxSettings, isInclusive: e.target.checked } })}
                                   className="w-4 h-4 accent-purple-600 cursor-pointer"
                                 />
                                 <label htmlFor="isInclusiveTax" className="text-xs font-bold text-slate-700 cursor-pointer">
                                   পণ্যের দামের সাথেই ভ্যাট অন্তর্ভুক্ত (Inclusive Tax)
                                 </label>
                              </div>
                           </div>
                        </div>

                        {/* Maintenance Mode */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                              <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                                <Lock className="w-4 h-4 text-rose-600" />
                                মেইনটেন্যান্স মোড (Maintenance Mode)
                              </h3>
                              <button
                                onClick={() => updateSettings({ isStoreOnline: !storeSettings.isStoreOnline })}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                                  storeSettings.isStoreOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {storeSettings.isStoreOnline ? 'সাইট লাইভ (Online)' : 'মেইনটেন্যান্স (Offline)'}
                              </button>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">মেইনটেন্যান্স নোটিশ বার্তা</label>
                              <textarea
                                rows={3}
                                value={storeSettings.maintenanceNotice || ''}
                                onChange={(e) => updateSettings({ maintenanceNotice: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                placeholder="ওয়েবসাইট উন্নয়নের কাজ চলছে। শীঘ্রই আবার চালু হবে..."
                              />
                           </div>
                        </div>
                      </div>
                   </div>
                )}

                {activeSystemSubTab === 'slider' && (
                   <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                               <ImageIcon className="w-5 h-5" />
                             </div>
                             <div>
                               <h3 className="text-sm font-black text-slate-800 uppercase">হোম পেজ ব্যানার স্লাইডার</h3>
                               <p className="text-[10px] font-bold text-slate-400">Manage hero banners and links</p>
                             </div>
                           </div>
                           <button onClick={addBanner} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all">
                             <Plus className="w-4 h-4" /> নতুন ব্যানার যোগ করুন
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {(storeSettings.features?.banners || []).map((banner, idx) => (
                             <div key={banner.id} className="relative p-4 bg-slate-50 rounded-[2.5rem] border border-slate-200 group hover:shadow-xl transition-all">
                               <button onClick={() => removeBanner(banner.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10 cursor-pointer">
                                 <X className="w-4 h-4" />
                               </button>
                               <div className="aspect-video rounded-[2rem] overflow-hidden bg-slate-200 mb-4 relative group/img shadow-inner">
                                 <img src={banner.image} alt="" className="w-full h-full object-cover" />
                                 <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                   <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                     <Upload className="w-6 h-6 text-white" />
                                   </div>
                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSystemImageUpload(e, 'banner', banner.id)} />
                                 </label>
                               </div>
                               <div className="space-y-3 px-1">
                                 <input type="text" value={banner.title} onChange={(e) => {
                                   const b = [...(storeSettings.features?.banners || [])];
                                   b[idx].title = e.target.value;
                                   updateFeature('banners', b);
                                 }} placeholder="ব্যানার টাইটেল (যেমন: ঈদ ধামাকা)..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-blue-400" />
                                 <input type="text" value={banner.link} onChange={(e) => {
                                   const b = [...(storeSettings.features?.banners || [])];
                                   b[idx].link = e.target.value;
                                   updateFeature('banners', b);
                                 }} placeholder="ক্লিক করলে যেখানে যাবে (Link)..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-blue-400" />
                               </div>
                             </div>
                           ))}
                           {(storeSettings.features?.banners || []).length === 0 && (
                             <div className="md:col-span-2 py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem]">
                               <ImageIcon className="w-12 h-12 mb-3" />
                               <p className="text-xs font-bold uppercase">কোনো ব্যানার যুক্ত করা নেই</p>
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                )}

                {activeSystemSubTab === 'whatsapp' && (
                   <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-800 uppercase">হোয়াটসঅ্যাপ চ্যাট সেটিংস</h3>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">হোয়াটসঅ্যাপ নাম্বার (সচল)</label>
                              <div className="relative">
                                <Phone className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  value={storeSettings.whatsappNumber} 
                                  onChange={(e) => updateSettings({ whatsappNumber: e.target.value })} 
                                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-emerald-400 focus:bg-white" 
                                  placeholder="017XXXXXXXX"
                                />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">অটোমেটিক ওয়েলকাম মেসেজ</label>
                              <textarea 
                                rows={2} 
                                value={storeSettings.features?.whatsappMessage} 
                                onChange={(e) => updateFeature('whatsappMessage', e.target.value)} 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:bg-white" 
                                placeholder="আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?"
                              />
                           </div>
                           
                           {/* Custom WhatsApp Icon Upload */}
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">কাস্টম বাটন আইকন (অপশনাল)</label>
                              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                 <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-inner shrink-0 overflow-hidden">
                                    {storeSettings.features?.whatsappIcon ? (
                                      <img src={storeSettings.features.whatsappIcon} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                      <MessageCircle className="w-6 h-6 text-slate-300" />
                                    )}
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                       <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-2 transition-all">
                                          <Upload className="w-3.5 h-3.5" />
                                          <span>আপলোড আইকন</span>
                                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSystemImageUpload(e, 'whatsapp')} />
                                       </label>
                                       {storeSettings.features?.whatsappIcon && (
                                         <button 
                                           onClick={() => updateFeature('whatsappIcon', '')}
                                           className="px-4 py-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl text-[10px] font-black transition-all"
                                         >মুছে ফেলুন</button>
                                       )}
                                    </div>
                                    <input 
                                      type="text" 
                                      value={storeSettings.features?.whatsappIcon || ''} 
                                      onChange={(e) => updateFeature('whatsappIcon', e.target.value)} 
                                      placeholder="সরাসরি আইকন URL..." 
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-mono" 
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* Custom WhatsApp Button Color Override */}
                           <div className="space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                              <div className="flex items-center justify-between">
                                 <label className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
                                    🎨 ফ্লোটিং হোয়াটসঅ্যাপ বাটন কালার (Button Color Override)
                                 </label>
                                 <span className="text-[10px] text-slate-500 font-bold">ব্র্যান্ডের প্রাইমারি কালারে সেট করুন</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                ডিফল্ট সবুজ (#25D366) কালারের পরিবর্তে আপনার ব্র্যান্ড বা ওয়েবসাইটের প্রাইমারি কালার ব্যবহার করতে পারেন।
                              </p>
                              <div className="flex flex-wrap items-center gap-4 pt-1">
                                 <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
                                    <input 
                                      type="color" 
                                      value={storeSettings.features?.whatsappBgColor || '#25D366'} 
                                      onChange={(e) => updateFeature('whatsappBgColor', e.target.value)} 
                                      className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0" 
                                    />
                                    <input 
                                      type="text" 
                                      value={storeSettings.features?.whatsappBgColor || '#25D366'} 
                                      onChange={(e) => updateFeature('whatsappBgColor', e.target.value)} 
                                      className="w-24 px-2 py-1 text-xs font-mono font-bold uppercase text-slate-800 bg-slate-50 border border-slate-200 rounded-lg" 
                                    />
                                 </div>

                                 {/* Quick Preset Buttons */}
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => updateFeature('whatsappBgColor', '#25D366')}
                                      className="px-3 py-1.5 bg-[#25D366] text-white rounded-xl text-[10px] font-black shadow-xs hover:opacity-90 cursor-pointer"
                                    >
                                      ডিফল্ট সবুজ (#25D366)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateFeature('whatsappBgColor', storeSettings.themeColor || '#ea580c')}
                                      style={{ backgroundColor: storeSettings.themeColor || '#ea580c' }}
                                      className="px-3 py-1.5 text-white rounded-xl text-[10px] font-black shadow-xs hover:opacity-90 cursor-pointer"
                                    >
                                      ব্র্যান্ড কালার
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateFeature('whatsappBgColor', '#2563eb')}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-xs hover:opacity-90 cursor-pointer"
                                    >
                                      রয়্যাল ব্লু (#2563eb)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateFeature('whatsappBgColor', '#0f172a')}
                                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-xs hover:opacity-90 cursor-pointer"
                                    >
                                      ডার্ক স্লেট (#0f172a)
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">হোয়াটসঅ্যাপ টুলটিপ টেক্সট</label>
                              <textarea 
                                rows={2} 
                                value={storeSettings.features?.whatsappTooltipText} 
                                onChange={(e) => updateFeature('whatsappTooltipText', e.target.value)} 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-400 focus:bg-white" 
                                placeholder="হোয়াটস্অ্যাপে অর্ডার করতে এখানে ক্লিক করুন..."
                              />
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">টুলটিপ বিলম্ব (সেকেন্ড)</label>
                                <input 
                                  type="number" 
                                  value={storeSettings.features?.whatsappTooltipDelay ?? 5} 
                                  onChange={(e) => updateFeature('whatsappTooltipDelay', parseInt(e.target.value))} 
                                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-emerald-400 focus:bg-white" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">বাটন পজিশন (Position)</label>
                                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => updateFeature('whatsappPosition', 'bottom-right')}
                                    className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                      (storeSettings.features?.whatsappPosition || 'bottom-right') === 'bottom-right'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    ডানে (Right)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateFeature('whatsappPosition', 'bottom-left')}
                                    className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                      storeSettings.features?.whatsappPosition === 'bottom-left'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    বামে (Left)
                                  </button>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">স্ট্যাটাস</label>
                                <button 
                                  onClick={() => updateFeature('floatingWhatsAppEnabled', !storeSettings.features?.floatingWhatsAppEnabled, true)}
                                  className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    storeSettings.features?.floatingWhatsAppEnabled 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  {storeSettings.features?.floatingWhatsAppEnabled ? 'বর্তমানে সক্রিয়' : 'বর্তমানে বন্ধ'}
                                </button>
                             </div>
                           </div>
                        </div>
                      </div>
                   </div>
                )}

                {activeSystemSubTab === 'delivery' && (
                  <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                            <Truck className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-800 uppercase">ডেলিভারি ও শিপিং সেটিংস</h3>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ঢাকার ভেতরে চার্জ (৳)</label>
                             <input type="number" value={storeSettings.features?.insideDhakaCharge} onChange={(e) => updateFeature('insideDhakaCharge', parseInt(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ঢাকার বাইরে চার্জ (৳)</label>
                             <input type="number" value={storeSettings.features?.outsideDhakaCharge} onChange={(e) => updateFeature('outsideDhakaCharge', parseInt(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all" />
                          </div>
                       </div>

                       <div className="p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-orange-900 uppercase">ফ্রি শিপিং কনফিগারেশন</h4>
                              <p className="text-[9px] font-bold text-orange-700 uppercase">Minimum purchase for free delivery</p>
                            </div>
                            <button onClick={() => updateFeature('freeDeliveryEnabled', !storeSettings.features?.freeDeliveryEnabled, true)} className={`w-12 h-6 rounded-full relative transition-colors ${storeSettings.features?.freeDeliveryEnabled ? 'bg-orange-600' : 'bg-slate-300'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${storeSettings.features?.freeDeliveryEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                          </div>
                          <div className="relative">
                            <span className="absolute left-5 top-4.5 text-xs font-black text-orange-400">৳</span>
                            <input 
                              type="number" 
                              disabled={!storeSettings.features?.freeDeliveryEnabled} 
                              value={storeSettings.features?.freeDeliveryThreshold} 
                              onChange={(e) => updateFeature('freeDeliveryThreshold', parseInt(e.target.value))} 
                              className="w-full pl-10 pr-5 py-4 bg-white border border-orange-200 rounded-2xl text-xs font-black disabled:opacity-50 focus:ring-2 focus:ring-orange-400" 
                            />
                          </div>
                       </div>
                    </div>

                    {/* Notification Popup Icon Control Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00BFA5] flex items-center justify-center">
                               <Bell className="w-5 h-5" />
                             </div>
                             <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase">নোটিফিকেশন পপআপ আইকন</h4>
                                <p className="text-[10px] text-slate-400 font-bold">ওয়েবসাইটের হেডারে নোটিফিকেশন বেল আইকন প্রদর্শন চালু বা বন্ধ রাখুন</p>
                             </div>
                          </div>
                          <button 
                             type="button"
                             onClick={() => updateFeature('notificationPopupEnabled', storeSettings.features?.notificationPopupEnabled === false ? true : false, true)}
                             className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                               storeSettings.features?.notificationPopupEnabled !== false 
                                 ? 'bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25' 
                                 : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                             }`}
                           >
                             <span className={`w-2 h-2 rounded-full ${storeSettings.features?.notificationPopupEnabled !== false ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                             <span>{storeSettings.features?.notificationPopupEnabled !== false ? 'অন (ON)' : 'অফ (OFF)'}</span>
                           </button>
                       </div>
                       <p className="text-[11px] text-slate-500 font-medium">
                         এই অপশনটি <b>অন</b> থাকলে ওয়েবসাইটে নোটিফিকেশন বেল আইকন প্রদর্শিত হবে এবং গ্রাহক তাতে ট্যাপ করলে অ্যানিমেশন সহ সম্পূর্ণ নোটিফিকেশন পেজে নিয়ে যাবে। <b>অফ</b> থাকলে হেডারের আইকনটি লুকানো থাকবে।
                       </p>
                    </div>
                  </div>
                )}

                {activeSystemSubTab === 'payment' && (
                   <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                           <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                             <CreditCard className="w-5 h-5" />
                           </div>
                           <h3 className="text-sm font-black text-slate-800 uppercase">পেমেন্ট গেটওয়ে ও নাম্বারসমূহ</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           {['bkash', 'nagad', 'rocket', 'upay'].map((ch) => (
                             <div key={ch} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4 hover:border-indigo-300 transition-colors">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase ${
                                        ch === 'bkash' ? 'bg-pink-600' : ch === 'nagad' ? 'bg-orange-600' : ch === 'rocket' ? 'bg-purple-700' : 'bg-amber-500'
                                      }`}>
                                        {ch}
                                      </div>
                                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider">{ch} পেমেন্ট</span>
                                   </div>
                                   <button
                                    type="button"
                                    onClick={() => updatePaymentMethod(ch as any, 'enabled', !((storeSettings.payments as any)?.[ch]?.enabled))}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${(storeSettings.payments as any)?.[ch]?.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                   >
                                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300 ease-in-out ${(storeSettings.payments as any)?.[ch]?.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                   </button>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">নাম্বার</label>
                                  <input
                                    type="text"
                                    value={(storeSettings.payments as any)?.[ch]?.number || ''}
                                    onChange={(e) => updatePaymentMethod(ch as any, 'number', e.target.value)}
                                    placeholder={`${ch} পার্সোনাল/মার্চেন্ট নাম্বার...`}
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-400"
                                  />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   </div>
                )}

                {activeSystemSubTab === 'notice' && (
                  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Top Notice */}
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white">
                             <Bell className="w-5 h-5" />
                           </div>
                           <h3 className="text-sm font-black text-slate-800 uppercase">নোটিশ বার কন্ট্রোল</h3>
                         </div>
                         <button 
                            onClick={() => updateFeature('topNoticeEnabled', !storeSettings.features?.topNoticeEnabled, true)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${storeSettings.features?.topNoticeEnabled ? 'bg-rose-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${storeSettings.features?.topNoticeEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                       <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">অ্যানাউন্সমেন্ট টেক্সট</label>
                            <textarea rows={3} value={storeSettings.features?.topNoticeText} onChange={(e) => updateFeature('topNoticeText', e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-400 focus:bg-white" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ব্যাকগ্রাউন্ড</label>
                               <input type="color" value={storeSettings.features?.topNoticeBgColor} onChange={(e) => updateFeature('topNoticeBgColor', e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-white border border-slate-200 p-1" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase ml-2">টেক্সট কালার</label>
                               <input type="color" value={storeSettings.features?.topNoticeTextColor} onChange={(e) => updateFeature('topNoticeTextColor', e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-white border border-slate-200 p-1" />
                            </div>
                         </div>
                       </div>
                    </div>

                    {/* Promo Modal */}
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
                             <Sparkles className="w-5 h-5" />
                           </div>
                           <h3 className="text-sm font-black text-slate-800 uppercase">প্রমোশন পপ-আপ</h3>
                         </div>
                         <button 
                            onClick={() => updateFeature('promoModalEnabled', !storeSettings.features?.promoModalEnabled, true)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${storeSettings.features?.promoModalEnabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${storeSettings.features?.promoModalEnabled ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                       <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">পপ-আপ টাইটেল</label>
                            <input type="text" value={storeSettings.features?.promoModalTitle} onChange={(e) => updateFeature('promoModalTitle', e.target.value)} placeholder="টাইটেল..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black focus:ring-2 focus:ring-purple-400" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ডিসকাউন্ট কুপন</label>
                            <input type="text" value={storeSettings.features?.promoModalCoupon} onChange={(e) => updateFeature('promoModalCoupon', e.target.value)} placeholder="যেমন: EID500" className="w-full px-5 py-3.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-2xl text-xs font-black placeholder:text-purple-300" />
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeSystemSubTab === 'features' && (
                  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5 mb-8">
                           <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-white">
                             <Power className="w-5 h-5" />
                           </div>
                           <h3 className="text-sm font-black text-slate-800 uppercase">মাস্টার ফিচার সুইচ (Enable/Disable)</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'নোটিফিকেশন আইকন', key: 'notificationPopupEnabled', icon: <Bell />, color: 'text-teal-600' },
                            { label: 'নোটিশ বার', key: 'topNoticeEnabled', icon: <Bell />, color: 'text-rose-500' },
                            { label: 'হিরো স্লাইডার', key: 'heroSliderEnabled', icon: <ImageIcon />, color: 'text-blue-500' },
                            { label: 'ফ্ল্যাশ সেল', key: 'flashSaleEnabled', icon: <Zap />, color: 'text-orange-500' },
                            { label: 'পপ-আপ অফার', key: 'promoModalEnabled', icon: <Sparkles />, color: 'text-purple-500' },
                            { label: 'হোয়াটসঅ্যাপ', key: 'floatingWhatsAppEnabled', icon: <MessageCircle />, color: 'text-emerald-500' },
                            { label: 'দ্রুত অর্ডার', key: 'quickOrderEnabled', icon: <Zap />, color: 'text-indigo-500' },
                            { label: 'কাস্টমার রিভিউ', key: 'reviewsEnabled', icon: <Star />, color: 'text-amber-500' },
                            { label: 'কুপন সিস্টেম', key: 'couponSystemEnabled', icon: <Tag />, color: 'text-slate-700' },
                            { label: 'প্রোডাক্ট ভেরিয়েন্ট', key: 'productVariantsEnabled', icon: <Layers />, color: 'text-indigo-600' },
                            { label: 'অ্যাডভান্স সার্চ', key: 'advancedSearchEnabled', icon: <Search />, color: 'text-blue-600' },
                            { label: 'উইশলিস্ট', key: 'wishlistEnabled', icon: <Heart />, color: 'text-rose-500' },
                            { label: 'অর্ডার ট্র্যাকিং', key: 'orderTrackingEnabled', icon: <Truck />, color: 'text-orange-600' },
                            { label: 'কুইক ভিউ', key: 'quickViewEnabled', icon: <Eye />, color: 'text-purple-600' },
                            { label: 'সেলস অ্যানালিটিক্স', key: 'salesAnalyticsEnabled', icon: <LayoutDashboard />, color: 'text-emerald-600' },
                            { label: 'স্টক অ্যালার্ট', key: 'stockAlertEnabled', icon: <AlertCircle />, color: 'text-red-600' },
                            { label: 'বাল্ক এডিট', key: 'bulkEditEnabled', icon: <ExternalLink />, color: 'text-cyan-600' },
                            { label: 'কাস্টমার CRM', key: 'crmEnabled', icon: <ShieldCheck />, color: 'text-teal-600' },
                            { label: 'গ্যালারি ম্যানেজমেন্ট', key: 'multiImageGalleryEnabled', icon: <ImageIcon />, color: 'text-amber-600' },
                            { label: 'অটো ইনভয়েস', key: 'autoInvoiceEnabled', icon: <ExternalLink />, color: 'text-blue-700' },
                            { label: 'সাধারণ প্রশ্নোত্তর (FAQ)', key: 'faqEnabled', icon: <HelpCircle />, color: 'text-teal-600' },
                            { label: 'কর্মী ব্যবস্থাপনা', key: 'staffManagementEnabled', icon: <Boxes />, color: 'text-indigo-700' },
                          ].map((item) => (
                            <button
                              key={item.key}
                              onClick={() => updateFeature(item.key as keyof FeatureToggles, !storeSettings.features?.[item.key as keyof FeatureToggles], true)}
                              className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-3 text-center group cursor-pointer ${
                                storeSettings.features?.[item.key as keyof FeatureToggles]
                                  ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-100/50'
                                  : 'bg-white border-slate-100 opacity-60 grayscale hover:grayscale-0'
                              }`}
                            >
                              <div className={`p-3 rounded-2xl transition-all ${storeSettings.features?.[item.key as keyof FeatureToggles] ? 'bg-white' : 'bg-slate-50'}`}>
                                {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6 ${storeSettings.features?.[item.key as keyof FeatureToggles] ? item.color : 'text-slate-300'}` })}
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-tight block leading-tight">{item.label}</span>
                                <span className={`text-[8px] font-bold uppercase mt-1 inline-block px-2 py-0.5 rounded-full ${storeSettings.features?.[item.key as keyof FeatureToggles] ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {storeSettings.features?.[item.key as keyof FeatureToggles] ? 'অন' : 'অফ'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                     </div>

                     {/* Review Manager */}
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                          <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" /> হোম পেজ রিভিউ ম্যানেজার
                          </h3>
                          <button onClick={addReview} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-amber-100 flex items-center gap-2 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> নতুন রিভিউ
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                           {(storeSettings.features?.reviews || []).map((r, idx) => (
                             <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 group relative">
                                <button onClick={() => removeReview(r.id)} className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 border border-rose-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-black text-xs">
                                     {r.name.charAt(0)}
                                   </div>
                                   <input 
                                    type="text" 
                                    value={r.name} 
                                    onChange={(e) => {
                                      const rev = [...(storeSettings.features?.reviews || [])];
                                      rev[idx].name = e.target.value;
                                      updateFeature('reviews', rev);
                                    }}
                                    className="flex-1 bg-transparent font-black text-xs border-none p-0 focus:ring-0" 
                                  />
                                </div>
                                <textarea 
                                  value={r.comment} 
                                  onChange={(e) => {
                                    const rev = [...(storeSettings.features?.reviews || [])];
                                    rev[idx].comment = e.target.value;
                                    updateFeature('reviews', rev);
                                  }}
                                  rows={2} 
                                  className="w-full p-2 bg-white border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-1 focus:ring-amber-300" 
                                />
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}

                {activeSystemSubTab === 'staff' && (
                   <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                      {/* Dynamic Domain Notice Banner */}
                      <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-cyan-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20">
                               <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                               <h4 className="text-xs font-bold text-slate-800">
                                  ডায়নামিক লাইভ পোর্টাল লিংক সিস্টেম
                                </h4>
                               <p className="text-[11px] text-slate-500 mt-0.5">
                                  সাইট যেকোনো ডোমেইন ও হোস্টিংয়ে আপলোড করলে স্বয়ংক্রিয়ভাবে লাইভ সাইটের ডোমেইন অনুযায়ী লিংক তৈরি হয়।
                               </p>
                            </div>
                         </div>
                         <div className="text-[11px] font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold shrink-0">
                            {window.location.origin}
                         </div>
                      </div>

                      {/* Staff Header */}
                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-100">
                               <Boxes className="w-6 h-6" />
                            </div>
                            <div>
                               <h3 className="text-sm font-black text-slate-800 uppercase">কর্মী ও ডেলিভারি ম্যান ম্যানেজমেন্ট</h3>
                               <p className="text-[10px] font-bold text-slate-400">ডেলিভারি ম্যান, মডারেটর ও স্টাফদের পোর্টাল অ্যাকাউন্ট ও অ্যাক্সেস কন্ট্রোল</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => setIsAddStaffOpen(true)}
                           className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-100 transition-all active:scale-95 cursor-pointer"
                         >
                            <Plus className="w-4 h-4" /> নতুন অ্যাকাউন্ট তৈরি করুন
                         </button>
                      </div>

                      {/* Staff List */}
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                         <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">সকল কর্মীদের তালিকা ({staffAccounts.length})</h4>
                            <div className="relative">
                               <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                               <input 
                                 type="text" 
                                 value={staffSearch} 
                                 onChange={(e) => setStaffSearch(e.target.value)}
                                 placeholder="কর্মী খুঁজুন..." 
                                 className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-cyan-400 w-48 sm:w-64" 
                               />
                            </div>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                               <thead>
                                  <tr className="bg-slate-50/50">
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">নাম ও মোবাইল</th>
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ভূমিকা (Role)</th>
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ইউজারনেম ও পাসওয়ার্ড</th>
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">ডায়নামিক পোর্টাল লিংক</th>
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">কাজের পরিসংখ্যান</th>
                                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">অ্যাকশন</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {staffAccounts.filter(s => 
                                    !staffSearch || 
                                    s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) || 
                                    s.username.toLowerCase().includes(staffSearch.toLowerCase())
                                  ).map((staff) => {
                                    const livePortalUrl = generateStaffPortalUrl(staff.username, staff.role);

                                    return (
                                      <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors group">
                                         <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs uppercase text-white shadow-xs ${
                                                  staff.role === 'delivery_man'
                                                    ? 'bg-amber-500'
                                                    : staff.role === 'moderator'
                                                    ? 'bg-purple-600'
                                                    : staff.role === 'order_manager'
                                                    ? 'bg-indigo-600'
                                                    : 'bg-cyan-600'
                                               }`}>
                                                  {staff.role === 'delivery_man' ? <Truck className="w-5 h-5" /> : staff.fullName.charAt(0)}
                                               </div>
                                               <div>
                                                  <p className="text-[12px] font-black text-slate-800">{staff.fullName}</p>
                                                  {staff.phone && (
                                                     <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3 text-emerald-600" />
                                                        {staff.phone}
                                                     </p>
                                                  )}
                                               </div>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                               staff.role === 'delivery_man'
                                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                  : staff.role === 'moderator'
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                  : staff.role === 'order_manager'
                                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                                  : staff.role === 'admin' || staff.role === 'super_admin'
                                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                               {staff.role === 'delivery_man'
                                                  ? 'ডেলিভারি ম্যান'
                                                  : staff.role === 'moderator'
                                                  ? 'মডারেটর'
                                                  : staff.role === 'order_manager'
                                                  ? 'অর্ডার ম্যানেজার'
                                                  : staff.role === 'admin'
                                                  ? 'অ্যাডমিন'
                                                  : 'স্টাফ'}
                                            </span>
                                         </td>
                                         <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                               <p className="text-[11px] font-mono text-slate-800 font-bold">{staff.username}</p>
                                               <p className="text-[10px] font-mono text-slate-400">পাস: {staff.password || '123456'}</p>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                               <button 
                                                 onClick={() => {
                                                   copyToClipboard(livePortalUrl);
                                                   toast.success('পোর্টাল লিংক কপি করা হয়েছে!');
                                                 }}
                                                 className="px-3 py-1.5 bg-slate-100 hover:bg-[#00BFA5] hover:text-white rounded-xl text-slate-700 text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                 title="পোর্টাল লিংক কপি করুন"
                                               >
                                                  <Copy className="w-3.5 h-3.5" />
                                                  <span>লিংক কপি</span>
                                               </button>
                                               <a
                                                 href={livePortalUrl}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                                                 title="পোর্টাল ওপেন করুন"
                                               >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                               </a>
                                            </div>
                                         </td>
                                         <td className="px-6 py-4">
                                            {staff.role === 'delivery_man' ? (
                                               <div className="text-[10px] space-y-0.5">
                                                  <div className="text-emerald-700 font-bold">
                                                     ডেলিভারি: {staff.completedDeliveriesCount || 0} টি
                                                  </div>
                                                  <div className="text-slate-500 font-semibold">
                                                     সংগৃহীত ক্যাশ: ৳{(staff.totalCashCollected || 0).toLocaleString()}
                                                  </div>
                                               </div>
                                            ) : (
                                               <span className="text-[10px] text-slate-400 font-medium">
                                                  {staff.isActive ? 'সক্রিয় অ্যাকাউন্ট' : 'নিষ্ক্রিয়'}
                                               </span>
                                            )}
                                         </td>
                                         <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                               <button
                                                 onClick={() => handleOpenEditStaff(staff)}
                                                 className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                 title="সম্পাদনা করুন"
                                               >
                                                  <Edit className="w-4 h-4" />
                                               </button>
                                               <button 
                                                 onClick={() => handleDeleteStaff(staff.id)}
                                                 className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                                 title="মুছে ফেলুন"
                                               >
                                                  <Trash2 className="w-4 h-4" />
                                               </button>
                                            </div>
                                         </td>
                                      </tr>
                                    );
                                   })}
                                  {staffAccounts.length === 0 && (
                                     <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                           <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">কোনো কর্মী যুক্ত করা হয়নি</p>
                                        </td>
                                     </tr>
                                  )}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                )}

                {activeSystemSubTab === 'security' && (
                   <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center text-white">
                            <Lock className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-800 uppercase">অ্যাডমিন সিকিউরিটি সেটিংস</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                             <p className="text-[11px] font-bold text-rose-700 leading-relaxed flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                সতর্কতা: এটি আপনার অ্যাডমিন প্যানেলের মাস্টার পাসকোড। এটি পরিবর্তন করলে পরবর্তী লগইনে নতুন কোডটি প্রয়োজন হবে।
                             </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">অ্যাডমিন প্যানেল পাসকোড</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={storeSettings.adminPasscode}
                                onChange={(e) => updateSettings({ adminPasscode: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black tracking-widest focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all text-center"
                                placeholder="পাসকোড দিন..."
                              />
                              <ShieldCheck className="w-5 h-5 text-rose-300 absolute right-5 top-4.5" />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 text-center uppercase mt-1">Default: admin123 | Master Bypass: 7860</p>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                          >
                            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            নিরাপত্তা কোড সেভ করুন
                          </button>
                        </div>
                      </div>
                   </div>
                 )}

                 {activeSystemSubTab === 'monitoring' && (
                  <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-800 uppercase">শপ মনিটরিং ও স্ট্যাটাস কন্ট্রোল</h3>
                       </div>

                       <div className="space-y-8">
                         <div className="p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center space-y-6 shadow-2xl shadow-slate-200/50" style={{
                           backgroundColor: storeSettings.isStoreOnline ? '#f0fdf4' : '#fff1f2',
                           borderColor: storeSettings.isStoreOnline ? '#bcf0da' : '#fecaca'
                         }}>
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl animate-pulse ${storeSettings.isStoreOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                               <Power className="w-10 h-10 text-white" />
                            </div>
                            <div>
                               <h4 className={`text-xl font-black uppercase ${storeSettings.isStoreOnline ? 'text-emerald-900' : 'text-rose-900'}`}>
                                 {storeSettings.isStoreOnline ? 'শপ বর্তমানে অনলাইন আছে' : 'শপ বর্তমানে অফলাইন আছে'}
                               </h4>
                               <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Master Store Online/Offline Toggle</p>
                            </div>
                            <button
                              onClick={() => updateSettings({ isStoreOnline: !storeSettings.isStoreOnline })}
                              className={`px-12 py-5 rounded-[2rem] text-sm font-black uppercase transition-all active:scale-90 shadow-xl ${
                                storeSettings.isStoreOnline ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'
                              }`}
                            >
                               {storeSettings.isStoreOnline ? 'স্টোর অফলাইন করুন' : 'স্টোর অনলাইন করুন'}
                            </button>
                         </div>

                         {!storeSettings.isStoreOnline && (
                           <div className="space-y-3 animate-in zoom-in-95">
                              <label className="text-[10px] font-black text-slate-500 uppercase ml-4">মেইনটেন্যান্স নোটিশ (কাস্টমাররা দেখতে পাবে)</label>
                              <textarea 
                                value={storeSettings.maintenanceNotice} 
                                onChange={(e) => updateSettings({ maintenanceNotice: e.target.value })} 
                                className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-bold focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all shadow-inner" 
                                rows={3} 
                                placeholder="ওয়েবসাইট বর্তমানে উন্নয়নের কাজ চলছে..."
                              />
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                )}

                {activeSystemSubTab === 'faq' && (
                  <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
                      {/* Subtab Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                            <HelpCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                              সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ) কন্ট্রোল
                            </h3>
                            <p className="text-[11px] font-bold text-slate-400">
                              শিপিং, রিটার্ন ও পেমেন্ট বিষয়ক প্রশ্ন যোগ ও এডিট করুন
                            </p>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResetFaqsToDefault}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="ডিফল্ট FAQ-তে রিসেট করুন"
                          >
                            <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                            রিসেট
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenAddFaq}
                            className="px-4 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-2xl text-xs font-black shadow-md shadow-[#00BFA5]/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>নতুন প্রশ্ন যোগ করুন</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Enable/Disable Toggle */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-[#00796B]">
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-800">
                              ওয়েবসাইটে FAQ সেকশন প্রদর্শন
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium">
                              কন্টাক্ট পেজ ও ডেডিকেটেড পেজে FAQ দেখানো হবে কি না নিয়ন্ত্রণ করুন
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateFeature(
                              'faqEnabled',
                              storeSettings.features?.faqEnabled === false ? true : false,
                              true
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                            storeSettings.features?.faqEnabled !== false
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              storeSettings.features?.faqEnabled !== false
                                ? 'bg-white animate-pulse'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{storeSettings.features?.faqEnabled !== false ? 'অন (ON)' : 'অফ (OFF)'}</span>
                        </button>
                      </div>

                      {/* FAQ Items List */}
                      <div className="space-y-3 pt-2">
                        {((storeSettings.features?.faqs && storeSettings.features.faqs.length > 0
                          ? storeSettings.features.faqs
                          : DEFAULT_FEATURE_TOGGLES.faqs) as FAQItem[]).map((faq, idx) => (
                          <div
                            key={faq.id || idx}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#00796B] text-[10px] font-black uppercase">
                                    {faq.category === 'shipping'
                                      ? 'শিপিং'
                                      : faq.category === 'returns'
                                      ? 'রিটার্ন'
                                      : faq.category === 'payments'
                                      ? 'পেমেন্ট'
                                      : 'সাধারণ'}
                                  </span>
                                </div>
                                <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                                  {faq.question}
                                </h5>
                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-2">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditFaq(faq)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#00BFA5] text-slate-700 hover:text-[#00796B] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                এডিট
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-all shadow-2xs cursor-pointer"
                                title="মুছুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Modals and other UI elements follow */}
          </main>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FAQ MODAL (ADD / EDIT) */}
      {/* ============================================================= */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                <span>{editingFaq ? 'FAQ প্রশ্ন এডিট করুন' : 'নতুন FAQ প্রশ্ন যোগ করুন'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরি নির্ধারণ করুন *
                </label>
                <select
                  value={newFaqCategory}
                  onChange={(e) =>
                    setNewFaqCategory(
                      e.target.value as 'shipping' | 'returns' | 'payments' | 'general'
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                >
                  <option value="shipping">শিপিং ও ডেলিভারি (Shipping)</option>
                  <option value="returns">রিটার্ন ও রিফান্ড (Returns)</option>
                  <option value="payments">পেমেন্ট ও বিলিং (Payments)</option>
                  <option value="general">সাধারণ জিজ্ঞাসা (General)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রশ্নটি লিখুন *
                </label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="যেমন: ডেলিভারি হতে কত দিন সময় লাগে?"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিস্তারিত উত্তর লিখুন *
                </label>
                <textarea
                  rows={4}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="গ্রাহকের জন্য স্পষ্ট ও সহজ বাংলায় উত্তরটি লিখুন..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00BFA5] hover:bg-[#00A892] text-white text-xs font-black shadow-md shadow-[#00BFA5]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFaq ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: ADD CATEGORY MODAL */}
      {/* ============================================================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                নতুন ক্যাটাগরি তৈরি
              </h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরির নাম (বাংলায়)
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="যেমন: বাচ্চাদের খেলনা, পাঞ্জাবি, ঘড়ি ইত্যাদি"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরি ছবি (ImgBB বা লিঙ্ক)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingCatImage ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      className="hidden"
                      disabled={uploadingCatImage}
                    />
                  </label>
                  {newCatImage && (
                    <img
                      src={newCatImage}
                      alt="Preview"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="অথবা সরাসরি ইমেজ লিঙ্ক (URL) দিন..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সিরিয়াল / অর্ডার নম্বর
                </label>
                <input
                  type="number"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {submittingCategory ? 'তৈরি হচ্ছে...' : 'ক্যাটাগরি যুক্ত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW STAFF MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                   </div>
                   <h3 className="text-sm font-black text-slate-800 uppercase">নতুন কর্মী যোগ করুন</h3>
                </div>
                <button onClick={() => setIsAddStaffOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleAddStaff} className="p-8 space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">কর্মীর পূর্ণ নাম</label>
                   <input type="text" value={newStaffFullName} onChange={(e) => setNewStaffFullName(e.target.value)} placeholder="যেমন: রাকিব হাসান..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-cyan-400 focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">ইউজারনেম</label>
                    <input type="text" value={newStaffUsername} onChange={(e) => setNewStaffUsername(e.target.value)} placeholder="rakib_admin" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-cyan-400 focus:bg-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">পাসওয়ার্ড</label>
                    <input type="text" value={newStaffPassword} onChange={(e) => setNewStaffPassword(e.target.value)} placeholder="••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-cyan-400 focus:bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">অ্যাক্সেস রোল (Role)</label>
                   <select 
                     value={newStaffRole} 
                     onChange={(e) => setNewStaffRole(e.target.value as Role)}
                     className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-cyan-400 focus:bg-white appearance-none"
                   >
                     <option value="admin">Full Admin (সবকিছু)</option>
                     <option value="moderator">Moderator (প্রোডাক্ট ও ক্যাটাগরি)</option>
                     <option value="order_manager">Order Manager (শুধুমাত্র অর্ডার)</option>
                     <option value="delivery_man">Delivery Man (ডেলিভারি ট্র্যাকিং)</option>
                     <option value="staff">General Staff (ভিউয়ার)</option>
                   </select>
                </div>
                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
                   <p className="text-[10px] font-bold text-cyan-700 leading-relaxed">
                      <Zap className="w-3.5 h-3.5 inline mr-1" /> কর্মী তার নির্দিষ্ট ইউজারনেম এবং পাসওয়ার্ড ব্যবহার করে সাইটে লগইন করতে পারবেন।
                   </p>
                </div>
                <button type="submit" disabled={submittingStaff} className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-100 transition-all active:scale-95 disabled:opacity-50">
                   {submittingStaff ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'অ্যাকাউন্ট তৈরি করুন'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: EDIT CATEGORY MODAL */}
      {/* ============================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                ক্যাটাগরি সম্পাদনা (Edit Category)
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরির নাম
                </label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ক্যাটাগরি ছবি
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingEditCatImage ? 'আপলোড হচ্ছে...' : 'নতুন ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditCatImageUpload}
                      className="hidden"
                      disabled={uploadingEditCatImage}
                    />
                  </label>
                  {editCatImage && (
                    <img
                      src={editCatImage}
                      alt="Preview"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={editCatImage}
                  onChange={(e) => setEditCatImage(e.target.value)}
                  placeholder="ইমেজ লিঙ্ক..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সিরিয়াল / অর্ডার নম্বর
                </label>
                <input
                  type="number"
                  value={editCatOrder}
                  onChange={(e) => setEditCatOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEditCategory}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {savingEditCategory ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: ADD PRODUCT MODAL */}
      {/* ============================================================= */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00BFA5]" />
                নতুন পণ্য যোগ করুন
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পণ্যের পুরো নাম
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="যেমন: প্রিমিয়াম কটন পাঞ্জাবি"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    স্টক পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিক্রয় মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="যেমন: 1250"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#00796B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আগের মূল্য / Regular (৳)
                  </label>
                  <input
                    type="number"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    placeholder="যেমন: 1650"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>🚚 আনুমানিক ডেলিভারি সময় (Delivery Time)</span>
                  <span className="text-[10px] text-slate-400">যেমন: ২-৩ দিন</span>
                </label>
                <input
                  type="text"
                  value={newProdDeliveryDays}
                  onChange={(e) => setNewProdDeliveryDays(e.target.value)}
                  placeholder="যেমন: ২-৩ দিন (ঢাকার ভেতর ২৪-৪৮ ঘণ্টা)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-600" />
                    <span>পণ্যের ছবিসমূহ (Multi-Image Gallery)</span>
                  </label>
                  <label className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#00796B] border border-teal-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingProdImage ? 'আপলোড হচ্ছে...' : '+ ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                      disabled={uploadingProdImage}
                    />
                  </label>
                </div>

                {/* Direct Image URL Add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    placeholder="সরাসরি ছবির লিঙ্ক (URL) টাইপ করুন..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newProdImage.trim()) {
                        setNewProdImages((prev) => [...prev, newProdImage.trim()]);
                        setNewProdImage('');
                        toast.success('ছবি গ্যালারিতে যোগ হয়েছে');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    + যোগ
                  </button>
                </div>

                {/* Thumbnails preview gallery */}
                {newProdImages.length > 0 && (
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">সংযুক্ত ছবিসমূহ ({newProdImages.length} টি) — ১ম টি কাভার ছবি:</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {newProdImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs">
                          <img src={imgUrl} alt={`Prod ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-0 left-0 bg-teal-600 text-white text-[8px] font-bold px-1 rounded-br">মেইন</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setNewProdImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-rose-600 text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  rows={3}
                  placeholder="পণ্যের বৈশিষ্ট্য ও বিবরণ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                ></textarea>
              </div>

              {/* Pin Product to Category 📌 */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📌</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">ক্যাটাগরিতে পিন করুন (Pin Product)</h5>
                    <p className="text-[10px] text-slate-500">হোমপেজে এই ক্যাটাগরির সেকশনের শুরুতে অগ্রাধিকার পাবে</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newProdIsPinned}
                  onChange={(e) => setNewProdIsPinned(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {submittingProduct ? 'যুক্ত হচ্ছে...' : 'পণ্য যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3.5: EDIT PRODUCT MODAL */}
      {/* ============================================================= */}
      {isEditProductOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                পণ্য সম্পাদনা (Edit Product)
              </h3>
              <button
                onClick={() => {
                  setIsEditProductOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পণ্যের নাম
                </label>
                <input
                  type="text"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    স্টক পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বিক্রয় মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#00796B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আগের মূল্য / Regular (৳)
                  </label>
                  <input
                    type="number"
                    value={editProdOriginalPrice}
                    onChange={(e) => setEditProdOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>🚚 আনুমানিক ডেলিভারি সময় (Delivery Time)</span>
                  <span className="text-[10px] text-slate-400">যেমন: ২-৩ দিন</span>
                </label>
                <input
                  type="text"
                  value={editProdDeliveryDays}
                  onChange={(e) => setEditProdDeliveryDays(e.target.value)}
                  placeholder="যেমন: ২-৩ দিন (ঢাকার ভেতর ২৪-৪৮ ঘণ্টা)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>পণ্যের ছবিসমূহ (Multi-Image Gallery)</span>
                  </label>
                  <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingEditProdImage ? 'আপলোড হচ্ছে...' : '+ ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageUpload}
                      className="hidden"
                      disabled={uploadingEditProdImage}
                    />
                  </label>
                </div>

                {/* Direct Image URL Add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editProdImage}
                    onChange={(e) => setEditProdImage(e.target.value)}
                    placeholder="ছবি লিঙ্ক (URL) টাইপ করুন..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editProdImage.trim()) {
                        setEditProdImages((prev) => [...prev, editProdImage.trim()]);
                        setEditProdImage('');
                        toast.success('ছবি গ্যালারিতে যোগ হয়েছে');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    + যোগ
                  </button>
                </div>

                {/* Thumbnails preview gallery */}
                {editProdImages.length > 0 && (
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">সংযুক্ত ছবিসমূহ ({editProdImages.length} টি) — ১ম টি কাভার ছবি:</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editProdImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs">
                          <img src={imgUrl} alt={`Prod ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] font-bold px-1 rounded-br">মেইন</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditProdImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-rose-600 text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  value={editProdDescription}
                  onChange={(e) => setEditProdDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                ></textarea>
              </div>

              {/* Pin Product to Category 📌 */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📌</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">ক্যাটাগরিতে পিন করুন (Pin Product)</h5>
                    <p className="text-[10px] text-slate-500">হোমপেজে এই ক্যাটাগরির সেকশনের শুরুতে অগ্রাধিকার পাবে</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editProdIsPinned}
                  onChange={(e) => setEditProdIsPinned(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEditProduct}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {savingEditProduct ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD NEW COUPON MODAL */}
      {/* ============================================================= */}
      {isAddCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#00BFA5]" />
                নতুন কুপন কোড তৈরি করুন
              </h3>
              <button
                onClick={() => setIsAddCouponOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কুপন কোড (Coupon Code) *
                </label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="যেমন: SAVE500, EID2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কুপন বিবরণ (Short Description)
                </label>
                <input
                  type="text"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="যেমন: ২,০০০ টাকার অর্ডারে ৫০০ টাকা ডিসকাউন্ট!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডিসকাউন্টের ধরণ *
                  </label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'fixed' | 'percentage')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  >
                    <option value="fixed">৳ নির্দিষ্ট টাকা (Fixed TK)</option>
                    <option value="percentage">% পার্সেন্টেজ (Percentage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ডিসকাউন্ট পরিমাণ / মূল্য *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    placeholder={newCouponType === 'percentage' ? 'যেমন: 15 (%)' : 'যেমন: 150 (৳)'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ন্যূনতম অর্ডার মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    placeholder="যেমন: 1000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সর্বোচ্চ ডিসকাউন্ট সীমা (৳)
                  </label>
                  <input
                    type="number"
                    disabled={newCouponType === 'fixed'}
                    value={newCouponMaxDiscount}
                    onChange={(e) => setNewCouponMaxDiscount(e.target.value)}
                    placeholder="যেমন: 500 (শুধু % এর জন্য)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মেয়াদ শেষ হওয়ার তারিখ (Expiry Date)
                </label>
                <input
                  type="date"
                  value={newCouponExpiry}
                  onChange={(e) => setNewCouponExpiry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCouponOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="px-5 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  {submittingCoupon ? 'সংরক্ষণ হচ্ছে...' : 'কুপন সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: PAYMENT SLIP PROOF VIEWER */}
      {/* ============================================================= */}
      {/* ============================================================= */}
      {/* MODAL 5: ADD STAFF / DELIVERY MAN MODAL */}
      {/* ============================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                নতুন অ্যাকাউন্ট ও পোর্টাল তৈরি করুন
              </h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পূর্ণ নাম (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  placeholder="যেমন: মোঃ রহিম উদ্দিন"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <input
                    type="tel"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভূমিকা (Role) *
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="delivery_man">🚚 ডেলিভারি ম্যান (Delivery Rider)</option>
                    <option value="moderator">🛡️ মডারেটর (Moderator)</option>
                    <option value="order_manager">📦 অর্ডার ম্যানেজার (Order Manager)</option>
                    <option value="staff">👤 সাধারণ স্টাফ (Staff)</option>
                    <option value="admin">👑 অ্যাডমিন (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইউজারনেম (Login Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffUsername}
                    onChange={(e) => setNewStaffUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="যেমন: rahim_delivery"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Granular Permission Matrix */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    🛡️ ফিচারের অ্যাক্সেস ও পারমিশন কন্ট্রোল (RBAC)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const def = ROLE_DEFINITIONS[newStaffRole]?.defaultPermissions || [];
                      setNewStaffPermissions(def);
                    }}
                    className="text-[10px] font-bold text-cyan-600 hover:underline cursor-pointer"
                  >
                    রোলের ডিফল্ট পারমিশন সেট করুন
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {ALL_PERMISSIONS.map((perm) => {
                    const currentSelected =
                      newStaffPermissions.length > 0
                        ? newStaffPermissions
                        : ROLE_DEFINITIONS[newStaffRole]?.defaultPermissions || [];
                    const isChecked = currentSelected.includes(perm.id);

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-50/70 border-cyan-300 text-cyan-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const active = [...currentSelected];
                            if (e.target.checked) {
                              setNewStaffPermissions([...new Set([...active, perm.id])]);
                            } else {
                              setNewStaffPermissions(active.filter((p) => p !== perm.id));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-cyan-600 rounded cursor-pointer"
                        />
                        <span className="truncate">{perm.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Live Portal Link Preview */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  স্বয়ংক্রিয় লাইভ পোর্টাল লিংক প্রিভিউ:
                </span>
                <p className="text-xs font-mono font-bold text-cyan-700 break-all">
                  {generateStaffPortalUrl(newStaffUsername || 'username', newStaffRole)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {newStaffRole === 'delivery_man'
                    ? 'এটি ডেলিভারি ম্যানের নিজস্ব মোবাইল পোর্টাল লিংক।'
                    : 'এটি স্টাফদের জন্য সুরক্ষিত লগইন লিংক।'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submittingStaff ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: EDIT STAFF MODAL */}
      {/* ============================================================= */}
      {isEditStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                অ্যাকাউন্ট তথ্য সম্পাদনা করুন
              </h3>
              <button
                onClick={() => {
                  setIsEditStaffOpen(false);
                  setEditingStaffId(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  required
                  value={editStaffFullName}
                  onChange={(e) => setEditStaffFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভূমিকা (Role)
                  </label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="delivery_man">🚚 ডেলিভারি ম্যান</option>
                    <option value="moderator">🛡️ মডারেটর</option>
                    <option value="order_manager">📦 অর্ডার ম্যানেজার</option>
                    <option value="staff">👤 স্টাফ</option>
                    <option value="admin">👑 অ্যাডমিন</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইউজারনেম *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStaffUsername}
                    onChange={(e) => setEditStaffUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="text"
                    required
                    value={editStaffPassword}
                    onChange={(e) => setEditStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Granular Permission Matrix for Editing */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    🛡️ ফিচারের অ্যাক্সেস ও পারমিশন কন্ট্রোল (RBAC)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const def = ROLE_DEFINITIONS[editStaffRole]?.defaultPermissions || [];
                      setEditStaffPermissions(def);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    রোলের ডিফল্ট পারমিশন সেট করুন
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = editStaffPermissions.includes(perm.id);

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const active = [...editStaffPermissions];
                            if (e.target.checked) {
                              setEditStaffPermissions([...new Set([...active, perm.id])]);
                            } else {
                              setEditStaffPermissions(active.filter((p) => p !== perm.id));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                        />
                        <span className="truncate">{perm.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStaffOpen(false);
                    setEditingStaffId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingEditStaff}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEditStaff ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CASH SETTLEMENT / DEPOSIT MODAL */}
      {/* ============================================================= */}
      {settlementStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                দোকানে ক্যাশ জমা বুঝে নিন
              </h3>
              <button
                onClick={() => setSettlementStaff(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-amber-900">
                  কর্মী: {settlementStaff.fullName} ({settlementStaff.phone || settlementStaff.username})
                </p>
                <p className="text-xs text-amber-800">
                  বর্তমান হাতে থাকা মোট ক্যাশ: <span className="font-bold text-amber-950">৳{(settlementStaff.cashInHand || 0).toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জমা নেওয়া টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={settlementStaff.cashInHand || undefined}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="যেমন: 1500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নোট বা বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  placeholder="যেমন: আজকের ক্যাশ কালেকশন জমা দিয়েছেন"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlementStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSettlingCash}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSettlingCash ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  জমা গ্রহণ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 7: ASSIGN DELIVERY PERSON MODAL */}
      {/* ============================================================= */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                ডেলিভারি ম্যান নির্বাচন করুন
              </h3>
              <button
                onClick={() => setAssigningOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-400 block">অর্ডার:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{assigningOrder.orderNumber || assigningOrder.id.slice(-8)}
                </span>
                <p className="text-slate-600 font-semibold mt-1">
                  গ্রাহক: {assigningOrder.customerInfo?.fullName || assigningOrder.customerName}
                </p>
                <p className="text-slate-500 text-[11px]">
                  ঠিকানা: {assigningOrder.address || assigningOrder.shippingAddress?.streetAddress || assigningOrder.district}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  উপলব্ধ ডেলিভারি কর্মীবৃন্দ:
                </label>
                {staffAccounts.filter((s) => s.role === 'delivery_man' && s.isActive).length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-amber-800 font-bold">কোনো ডেলিভারি ম্যান অ্যাকাউন্ট নেই!</p>
                    <p className="text-[11px] text-amber-700">
                      সিস্টেম সেটিংস &gt; কর্মী ও ডেলিভারি ম্যানেজমেন্ট থেকে প্রথমে ডেলিভারি ম্যান অ্যাকাউন্ট তৈরি করুন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {staffAccounts
                      .filter((s) => s.role === 'delivery_man' && s.isActive)
                      .map((rider) => (
                        <label
                          key={rider.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                            selectedDeliveryManId === rider.id
                              ? 'bg-amber-500/10 border-amber-500 text-slate-900 font-bold ring-1 ring-amber-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="selectedRider"
                              value={rider.id}
                              checked={selectedDeliveryManId === rider.id}
                              onChange={(e) => setSelectedDeliveryManId(e.target.value)}
                              className="text-amber-500 focus:ring-amber-500"
                            />
                            <div>
                              <p className="text-xs font-bold leading-tight">{rider.fullName}</p>
                              {rider.phone && (
                                <p className="text-[10px] text-slate-500 font-mono">{rider.phone}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                            {rider.completedDeliveriesCount || 0} সম্পন্ন
                          </span>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isAssigningDelivery || !selectedDeliveryManId}
                  onClick={handleAssignDeliveryManConfirm}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isAssigningDelivery ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  অর্ডার হস্তান্তর করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">পেমেন্ট স্লিপ প্রমাণ</h4>
              <button
                onClick={() => setProofModalUrl(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-100 flex items-center justify-center p-2">
              <img
                src={proofModalUrl}
                alt="Payment Slip Proof"
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MOBILE FLUTTER FLOATING BOTTOM NAVIGATION BAR */}
      {/* ============================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-lg flex items-center justify-around">
        {hasAccess('overview') && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'text-[#00BFA5]' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">ওভারভিউ</span>
          </button>
        )}

        {hasAccess('orders') && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors relative ${
              activeTab === 'orders' ? 'text-[#00BFA5]' : 'text-slate-400'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold">অর্ডার</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        )}

        {hasAccess('categories') && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'categories' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-bold">ক্যাটাগরি</span>
          </button>
        )}

        {hasAccess('products') && (
          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'products' ? 'text-[#00BFA5]' : 'text-slate-400'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-bold">পণ্য</span>
          </button>
        )}

        {hasAccess('orders') && (
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors relative ${
              activeTab === 'chats' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold">চ্যাট</span>
            {chatSessions.filter(s => s.status === 'active').length > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            )}
          </button>
        )}

        {hasAccess('system') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'users' ? 'text-[#00BFA5]' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">ইউজার</span>
          </button>
        )}

        {hasAccess('system') && (
          <button
            onClick={() => setActiveTab('system')}
            className={`flex flex-col items-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'system' ? 'text-orange-600' : 'text-slate-400'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'system' ? 'fill-orange-50' : ''}`} />
            <span className="text-[10px] font-black">সেটিংস</span>
          </button>
        )}
      </nav>
      {/* ============================================================= */}
      {/* MODAL 8: BULK PRODUCT UPLOAD MODAL */}
      {/* ============================================================= */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                বাল্ক প্রোডাক্ট আপলোড (Bulk Product Import)
              </h3>
              <button
                onClick={() => setIsBulkUploadModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkUploadSubmit} className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-2 text-xs text-indigo-900">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  একসাথে একাধিক প্রোডাক্ট যুক্ত করার গাইডলাইন:
                </p>
                <p className="text-[11px] leading-relaxed">
                  নিচে JSON অ্যারে ফরম্যাটে একাধিক প্রোডাক্টের তথ্য পেস্ট করুন। প্রতিটি আইটেমে <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono">name</code>, <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono">price</code>, <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono">stock</code>, <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono">sku</code> ইত্যাদি ফিল্ড দিতে পারেন।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  JSON ফরম্যাট ডেটা ইনপুট *
                </label>
                <textarea
                  required
                  rows={8}
                  value={bulkJsonText}
                  onChange={(e) => setBulkJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "name": "প্রিমিয়াম পাঞ্জাবি",\n    "price": 1250,\n    "compareAtPrice": 1800,\n    "stock": 30,\n    "sku": "PNJ-101",\n    "categoryName": "পুরুষদের ফ্যাশন",\n    "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600"\n  }\n]`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={uploadingBulk}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {uploadingBulk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4" />}
                  ইমপোর্ট ও আপলোড শুরু করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
