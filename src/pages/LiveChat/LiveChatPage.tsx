/**
 * BD SHOPS — Live Chat Page & Messenger UI
 * Direct messenger chat with support/admin.
 * Features:
 *  - Real-time messaging
 *  - Product tagging & selection
 *  - Image upload via ImgBB API with preview and direct download
 *  - Profile picture updates
 *  - Admin session close status handling
 *  - Chat history storage
 */

import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Paperclip,
  X,
  Download,
  ShoppingBag,
  CheckCircle2,
  Lock,
  RefreshCw,
  User,
  Plus,
  Search,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Camera,
  History,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import { fetchProducts } from '../../services/products';
import {
  getOrCreateChatSession,
  sendChatMessage,
  subscribeToChatMessages,
  subscribeToChatSession,
  closeChatSession,
  fetchCustomerChatHistory,
  ChatMessage,
  ChatSession,
  TaggedProduct,
} from '../../services/chat';
import { uploadImageToImgBB } from '../../utils/imgbb';
import { Product } from '../../types';

export const LiveChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('product');
  const orderNumber = searchParams.get('order');

  const { currentUser, userProfile, updateUserProfile } = useAuth();

  // Session & Message State
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Input & Upload State
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Product Tagging State
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedTaggedProduct, setSelectedTaggedProduct] = useState<TaggedProduct | null>(null);

  // Profile Photo Upload State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Load catalog products for product tagging
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prods = await fetchProducts();
        setProducts(prods);

        if (preselectedProductId) {
          const match = prods.find((p) => p.id === preselectedProductId || p.slug === preselectedProductId);
          if (match) {
            setSelectedTaggedProduct({
              id: match.id,
              name: match.name,
              price: match.discountPrice || match.price,
              image: match.images?.[0] || match.image,
              slug: match.slug,
            });
          }
        }
        
        // If there's an order number, set initial text
        if (orderNumber && !inputText) {
          setInputText(`আসসালামু আলাইকুম, আমি আমার অর্ডার #${orderNumber} নিয়ে কথা বলতে চাই।`);
        }
      } catch (err) {
        console.error('Error fetching catalog for chat:', err);
      }
    };
    loadProducts();
  }, [preselectedProductId, orderNumber]);

  // Load or initialize active session
  const initChat = async () => {
    if (!currentUser) {
      setLoadingSession(false);
      return;
    }

    setLoadingSession(true);
    try {
      const session = await getOrCreateChatSession(
        currentUser.uid,
        userProfile?.displayName || currentUser.email || 'কাস্টমার',
        currentUser.email || '',
        userProfile?.photoURL || ''
      );
      setCurrentSession(session);

      // Load history
      const history = await fetchCustomerChatHistory(currentUser.uid);
      setChatHistory(history);
    } catch (err) {
      console.error('Error initializing chat session:', err);
      toast.error('লাইভ চ্যাট কানেক্ট করতে সমস্যা হয়েছে');
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    initChat();
  }, [currentUser, userProfile]);

  // Subscribe to realtime messages & session updates
  useEffect(() => {
    if (!currentSession?.id) return;

    const unsubMessages = subscribeToChatMessages(currentSession.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    const unsubSession = subscribeToChatSession(currentSession.id, (sess) => {
      if (sess) {
        setCurrentSession(sess);
      }
    });

    return () => {
      unsubMessages();
      unsubSession();
    };
  }, [currentSession?.id]);

  // Handle Image File Selection for Chat
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ছবি ফাইল অবশ্যই ১০ মেগাবাইটের নিচে হতে হবে');
        return;
      }
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Upload Profile Picture via ImgBB
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfilePic(true);
    try {
      toast.loading('প্রোফাইল ছবি আপলোড করা হচ্ছে...', { id: 'pic_upload' });
      const imgUrl = await uploadImageToImgBB(file);
      await updateUserProfile({ photoURL: imgUrl });
      toast.success('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!', { id: 'pic_upload' });
      setShowProfileModal(false);
    } catch (err) {
      console.error('Profile pic upload error:', err);
      toast.error('ছবি আপলোড করতে ব্যর্থ হয়েছে', { id: 'pic_upload' });
    } finally {
      setUploadingProfilePic(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentSession) {
      toast.error('চ্যাট সেশন তৈরি হয়নি');
      return;
    }

    if (currentSession.status === 'closed') {
      toast.error('এই সেশনটি এডমিন কর্তৃক বন্ধ করা হয়েছে। নতুন চ্যাট শুরু করুন।');
      return;
    }

    if (!inputText.trim() && !selectedImageFile && !selectedTaggedProduct) {
      return;
    }

    setSending(true);
    try {
      let uploadedUrl = '';

      if (selectedImageFile) {
        setUploadingImage(true);
        toast.loading('ছবি আপলোড হচ্ছে...', { id: 'chat_upload' });
        uploadedUrl = await uploadImageToImgBB(selectedImageFile);
        toast.dismiss('chat_upload');
      }

      await sendChatMessage(
        currentSession.id,
        currentUser?.uid || 'guest',
        userProfile?.displayName || currentUser?.email || 'কাস্টমার',
        'customer',
        inputText.trim(),
        uploadedUrl,
        selectedTaggedProduct
      );

      // Reset Inputs
      setInputText('');
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setSelectedTaggedProduct(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('মেসেজ পাঠাতে সমস্যা হয়েছে');
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  };

  // Start New Chat Session
  const handleStartNewSession = async () => {
    if (!currentUser) return;
    setLoadingSession(true);
    try {
      const sessionsRef = collection(db, 'chatSessions');
      const newSessionData = {
        customerId: currentUser.uid,
        customerName: userProfile?.displayName || currentUser.email || 'কাস্টমার',
        customerEmail: currentUser.email || '',
        customerPhotoUrl: userProfile?.photoURL || '',
        status: 'active' as const,
        lastMessage: 'নতুন চ্যাট শুরু করা হয়েছে',
        lastMessageTime: new Date(),
        createdAt: new Date(),
      };
      const docRef = await addDoc(sessionsRef, newSessionData);
      setCurrentSession({ id: docRef.id, ...newSessionData });
      toast.success('নতুন চ্যাট সেশন শুরু হয়েছে');
      setShowHistoryModal(false);
    } catch (err) {
      toast.error('নতুন চ্যাট খুলতে সমস্যা হয়েছে');
    } finally {
      setLoadingSession(false);
    }
  };

  // Filtered products for modal
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
      <Helmet>
        <title>লাইভ চ্যাট সাপোর্ট — BD SHOPS</title>
      </Helmet>

      <div className="w-full h-full max-w-5xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* MESSENGER TOP BAR WITH CLEAR BACK BUTTON */}
        <div className="bg-gradient-to-r from-[#00796B] via-[#00BFA5] to-teal-700 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer flex items-center gap-1"
              title="আগের পেজে ফিরে যান"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">ফিরে যান</span>
            </button>

            <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#00796B] font-black flex items-center justify-center text-lg overflow-hidden border-2 border-white/80 shadow-xs">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  BD SHOPS সাপোর্ট টিম
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-teal-100 font-medium">
                অনলাইন লাইব চ্যাট হেল্পডেস্ক
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="পূর্বের চ্যাট হিস্ট্রি"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">চ্যাট হিস্ট্রি</span>
              </button>
            )}

            {currentSession?.status === 'closed' && (
              <button
                onClick={handleStartNewSession}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন চ্যাট</span>
              </button>
            )}
          </div>
        </div>

        {/* MESSENGER CHAT AREA / BODY */}
        <div className="flex-1 bg-slate-50/70 p-3 sm:p-5 overflow-y-auto space-y-4">
          {!currentUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#00BFA5] flex items-center justify-center shadow-md">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">লগইন প্রয়োজন</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  এডমিন ও সাপোর্ট টিমের সাথে মেসেঞ্জারে লাইভ কথা বলতে এবং মেসেজ হিস্ট্রি জমা রাখতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।
                </p>
              </div>
              <Link
                to="/login?redirect=/chat"
                className="px-6 py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
              >
                লগইন বা রেজিস্টার করুন
              </Link>
            </div>
          ) : loadingSession ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#00BFA5] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00BFA5] mx-auto flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                আসসালামু আলাইকুম! আপনাকে কীভাবে সাহায্য করতে পারি?
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                নিচে আপনার প্রশ্ন লিখুন, ছবি পাঠাতে ইমেজে ক্লিক করুন অথবা যেকোনো প্রোডাক্ট নির্বাচন করে ট্যাগ করুন।
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid;
              const isSystem = msg.senderRole === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-3">
                    <span className="inline-block px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold shadow-xs">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <span className="text-[10px] font-bold text-slate-400 px-1">
                    {msg.senderName} •{' '}
                    {msg.createdAt?.toDate
                      ? msg.createdAt.toDate().toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'এখনই'}
                  </span>

                  <div
                    className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-3xl text-xs font-semibold shadow-xs space-y-2.5 ${
                      isMe
                        ? 'bg-[#00796B] text-white rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Tagged Product Attachment */}
                    {msg.taggedProduct && (
                      <div
                        className={`p-2.5 rounded-2xl border flex items-center gap-2.5 ${
                          isMe
                            ? 'bg-teal-900/40 border-teal-500/50 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <img
                          src={msg.taggedProduct.image}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-white/20"
                        />
                        <div className="flex-1 truncate">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                            📦 ট্যাগকৃত পণ্য:
                          </span>
                          <p className="font-bold truncate text-xs">{msg.taggedProduct.name}</p>
                          <span className="font-extrabold text-amber-300">
                            ৳{msg.taggedProduct.price.toLocaleString('bn-BD')}
                          </span>
                        </div>
                        {msg.taggedProduct.slug && (
                          <Link
                            to={`/products/${msg.taggedProduct.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                            title="পণ্যটি দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Image Attachment with Download */}
                    {msg.imageUrl && (
                      <div className="relative group rounded-2xl overflow-hidden border border-black/10">
                        <img
                          src={msg.imageUrl}
                          alt="সংযুক্ত ছবি"
                          className="max-h-60 w-full object-cover rounded-2xl"
                        />
                        <a
                          href={msg.imageUrl}
                          target="_blank"
                          download="chat_image.jpg"
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-black transition-all flex items-center gap-1 text-[10px] font-bold backdrop-blur-xs cursor-pointer shadow-md"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </a>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT ATTACHMENT PREVIEW BAR */}
        {(selectedTaggedProduct || imagePreviewUrl) && (
          <div className="bg-amber-50 p-2.5 px-4 border-t border-amber-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              {selectedTaggedProduct && (
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-amber-300 text-xs font-bold text-slate-800 shrink-0">
                  <ShoppingBag className="w-4 h-4 text-[#00BFA5]" />
                  <span className="truncate max-w-[150px]">{selectedTaggedProduct.name}</span>
                  <button
                    onClick={() => setSelectedTaggedProduct(null)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {imagePreviewUrl && (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-300 shrink-0">
                  <img src={imagePreviewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                    }}
                    className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <span className="text-[10px] font-bold text-amber-800">সেন্ড করতে বার্তা লিখুন</span>
          </div>
        )}

        {/* SESSION CLOSED NOTICE */}
        {currentSession?.status === 'closed' && (
          <div className="bg-rose-50 border-t border-rose-200 p-3 text-center text-xs font-bold text-rose-800 flex items-center justify-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>এডমিন চ্যাট সেশনটি বন্ধ করেছেন। নতুন মেসেজ পাঠাতে "নতুন চ্যাট" চালু করুন।</span>
          </div>
        )}

        {/* MESSENGER INPUT FOOTER BAR */}
        {currentUser && currentSession?.status !== 'closed' && (
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 sm:p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            {/* Hidden inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="ছবি সংযুক্ত করুন (ImgBB Upload)"
            >
              <ImageIcon className="w-5 h-5 text-[#00BFA5]" />
            </button>

            {/* Tag Product Button */}
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="পণ্য ট্যাগ করুন"
            >
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </button>

            {/* Text Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="আপনার বার্তাটি লিখুন..."
              className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5] focus:bg-white transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !selectedImageFile && !selectedTaggedProduct)}
              className="p-2.5 px-4 sm:px-5 bg-[#00796B] hover:bg-[#00BFA5] disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {sending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">পাঠান</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* PRODUCT SELECTOR MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#00BFA5]" />
                <span>চ্যাটে ট্যাগ করার জন্য পণ্য নির্বাচন করুন</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="পণ্যের নাম লিখে সার্চ করুন..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]"
                />
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedTaggedProduct({
                      id: p.id,
                      name: p.name,
                      price: p.discountPrice || p.price,
                      image: p.images?.[0] || p.image,
                      slug: p.slug,
                    });
                    setShowProductModal(false);
                    toast.success(`"${p.name}" সিলেক্ট করা হয়েছে`);
                  }}
                  className="p-2.5 rounded-2xl border border-slate-200 hover:border-[#00BFA5] hover:bg-teal-50/50 flex items-center gap-3 cursor-pointer transition-all"
                >
                  <img
                    src={p.images?.[0] || p.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{p.name}</p>
                    <span className="text-xs font-bold text-[#00796B]">
                      ৳{(p.discountPrice || p.price).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <button className="px-3 py-1 bg-[#00BFA5] text-white text-xs font-bold rounded-xl">
                    সিলেক্ট
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE PICTURE UPDATE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900">প্রোফাইল ছবি পরিবর্তন</h3>
            <div className="w-24 h-24 rounded-full bg-teal-50 text-[#00796B] font-black mx-auto overflow-hidden border-4 border-[#00BFA5] flex items-center justify-center text-3xl shadow-md">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                (userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()
              )}
            </div>

            <input
              type="file"
              ref={profileInputRef}
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />

            <div className="space-y-2 pt-2">
              <button
                onClick={() => profileInputRef.current?.click()}
                disabled={uploadingProfilePic}
                className="w-full py-2.5 bg-[#00BFA5] hover:bg-[#00A892] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>নতুন ছবি আপলোড করুন</span>
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-[#00BFA5]" />
                <span>আপনার পূর্বের চ্যাট হিস্ট্রি</span>
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {chatHistory.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">কোনো ইতিহাস পাওয়া যায়নি</p>
              ) : (
                chatHistory.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setCurrentSession(sess);
                      setShowHistoryModal(false);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      currentSession?.id === sess.id
                        ? 'border-[#00BFA5] bg-teal-50/60'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          sess.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sess.status === 'active' ? 'চলমান (Active)' : 'সম্পন্ন (Closed)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {sess.createdAt?.toDate
                          ? sess.createdAt.toDate().toLocaleDateString('bn-BD')
                          : 'সেশন'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                      {sess.lastMessage || 'কোনো মেসেজ নেই'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
