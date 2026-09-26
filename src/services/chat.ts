/**
 * BD SHOPS — Live Chat Realtime Firestore Service
 * Enables live messenger chat between customers and support/admin.
 * Allows tagging products, uploading images via ImgBB, and session closing by admin.
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase/config';
import { Product } from '../types';

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'system';
  text?: string;
  imageUrl?: string;
  taggedProduct?: TaggedProduct | null;
  createdAt: any;
}

export interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerPhotoUrl?: string;
  status: 'active' | 'closed';
  lastMessage?: string;
  lastMessageTime?: any;
  createdAt: any;
  closedAt?: any;
}

/**
 * Gets or creates an active chat session for a customer
 */
export async function getOrCreateChatSession(
  customerId: string,
  customerName: string,
  customerEmail?: string,
  customerPhotoUrl?: string
): Promise<ChatSession> {
  const sessionsRef = collection(db, 'chatSessions');
  const q = query(
    sessionsRef,
    where('customerId', '==', customerId),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data(),
    } as ChatSession;
  }

  // Create new active session if none exists or previous was closed
  const newSessionData = {
    customerId,
    customerName: customerName || 'সম্মানিত কাস্টমার',
    customerEmail: customerEmail || '',
    customerPhotoUrl: customerPhotoUrl || '',
    status: 'active' as const,
    lastMessage: 'লাইব চ্যাট তৈরি করা হয়েছে',
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(sessionsRef, newSessionData);
  return {
    id: docRef.id,
    ...newSessionData,
  };
}

/**
 * Sends a message in a chat session
 */
export async function sendChatMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  senderRole: 'customer' | 'admin' | 'system',
  text?: string,
  imageUrl?: string,
  taggedProduct?: TaggedProduct | null
): Promise<void> {
  if (!text && !imageUrl && !taggedProduct) return;

  const messagesRef = collection(db, 'chatSessions', chatId, 'messages');
  await addDoc(messagesRef, {
    chatId,
    senderId,
    senderName,
    senderRole,
    text: text || '',
    imageUrl: imageUrl || '',
    taggedProduct: taggedProduct || null,
    createdAt: serverTimestamp(),
  });

  // Update session last message
  const sessionDocRef = doc(db, 'chatSessions', chatId);
  let summary = text || (imageUrl ? '📷 [ছবি পাঠান হয়েছে]' : '🛍️ [পণ্য ট্যাগ করা হয়েছে]');
  await updateDoc(sessionDocRef, {
    lastMessage: summary,
    lastMessageTime: serverTimestamp(),
  });
}

/**
 * Subscribes to real-time chat messages for a session
 */
export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, 'chatSessions', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      onUpdate(list);
    },
    (error) => {
      console.warn('Realtime chat snapshot listener warning:', error);
    }
  );
}

/**
 * Subscribes to chat session status changes
 */
export function subscribeToChatSession(
  chatId: string,
  onUpdate: (session: ChatSession | null) => void
) {
  const sessionDocRef = doc(db, 'chatSessions', chatId);
  return onSnapshot(
    sessionDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as ChatSession);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Realtime chat session listener warning:', error);
    }
  );
}

/**
 * Closes a chat session (Admin action or system action)
 */
export async function closeChatSession(chatId: string): Promise<void> {
  const sessionDocRef = doc(db, 'chatSessions', chatId);
  await updateDoc(sessionDocRef, {
    status: 'closed',
    closedAt: serverTimestamp(),
  });

  // System notification message inside chat
  await sendChatMessage(
    chatId,
    'system',
    'সিস্টেম বার্তা',
    'system',
    '🔒 এই চ্যাট সেশনটি সম্পন্ন/বন্ধ করা হয়েছে। নতুন বার্তার জন্য পুনরায় চ্যাট শুরু করতে পারেন।'
  );
}

/**
 * Fetch all chat history sessions for a customer
 */
export async function fetchCustomerChatHistory(customerId: string): Promise<ChatSession[]> {
  try {
    const sessionsRef = collection(db, 'chatSessions');
    const q = query(
      sessionsRef,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ChatSession[];
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return [];
  }
}
