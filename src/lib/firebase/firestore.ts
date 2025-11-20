import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  collection,
  query,
  where,
  addDoc,
  onSnapshot,
  orderBy,
  limitToLast,
  limit,
  updateDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';

export interface UserProfile {
  displayName: string;
  avatar?: string;
  status?: string;
  lastSeen?: any;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfileInput {
  displayName: string;
  avatar?: string;
  status?: string;
}

/**
 * Create a new user profile document in Firestore
 */
export const createUserProfile = async (
  uid: string,
  data: UserProfileInput
): Promise<void> => {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);

  // Remove undefined values (Firestore doesn't accept undefined)
  const cleanData: Record<string, any> = {
    displayName: data.displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.avatar !== undefined) {
    cleanData.avatar = data.avatar;
  }

  if (data.status !== undefined) {
    cleanData.status = data.status;
  }

  await setDoc(userRef, cleanData);
};

/**
 * Get a user profile document from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error: any) {
    // If it's a permissions error, log it but don't throw
    // This allows the app to continue working with auth user data
    if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
      console.warn('Firestore permissions not configured. Please deploy firestore.rules to Firebase.');
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Update specific fields in a user profile
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export const updateUserProfile = async (
  uid: string,
  patch: Partial<UserProfileInput>
): Promise<void> => {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);

  // Check if document exists
  const userSnap = await getDoc(userRef);
  const exists = userSnap.exists();

  // Remove undefined values (Firestore doesn't accept undefined)
  const cleanPatch: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.displayName !== undefined) {
    cleanPatch.displayName = patch.displayName;
  }

  if (patch.avatar !== undefined) {
    cleanPatch.avatar = patch.avatar;
  }

  if (patch.status !== undefined) {
    cleanPatch.status = patch.status;
  }

  // If document doesn't exist, set createdAt as well
  if (!exists) {
    cleanPatch.createdAt = serverTimestamp();
  }

  // Use setDoc with merge to create or update
  await setDoc(userRef, cleanPatch, { merge: true });
};

/**
 * Update user's last seen timestamp
 */
export const updateLastSeen = async (uid: string): Promise<void> => {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    lastSeen: serverTimestamp(),
  });
};

/**
 * Search for users by display name
 * Returns users with their UIDs included
 */
export interface UserProfileWithId extends UserProfile {
  uid: string;
}

/**
 * Search for users by display name
 * Note: Firestore doesn't support case-insensitive search natively,
 * so we search with both uppercase and lowercase prefixes and filter client-side
 */
export const searchUsers = async (searchTerm: string, limitCount: number = 20): Promise<UserProfileWithId[]> => {
  if (!searchTerm.trim()) {
    return [];
  }

  const db = getFirebaseFirestore();
  const usersRef = collection(db, 'users');
  
  const searchLower = searchTerm.toLowerCase();
  const searchUpper = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
  
  // Try both the original search term and capitalized version
  // Firestore range queries are case-sensitive, so we need to try both
  const queries = [
    query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(limitCount * 3)
    ),
  ];
  
  // If first char is lowercase, also try uppercase version
  if (searchTerm[0] === searchTerm[0].toLowerCase() && searchUpper !== searchTerm) {
    queries.push(
      query(
        usersRef,
        where('displayName', '>=', searchUpper),
        where('displayName', '<=', searchUpper + '\uf8ff'),
        limit(limitCount * 3)
      )
    );
  }
  
  const allUsers = new Map<string, UserProfileWithId>();
  
  // Execute all queries and combine results
  for (const q of queries) {
    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data() as UserProfile;
        // Filter client-side for case-insensitive contains matching
        if (userData.displayName.toLowerCase().includes(searchLower)) {
          allUsers.set(docSnap.id, {
            ...userData,
            uid: docSnap.id,
          });
        }
      });
    } catch (error) {
      // If query fails (e.g., missing index), continue with other queries
      console.warn('Search query failed:', error);
    }
  }
  
  return Array.from(allUsers.values()).slice(0, limitCount);
};

// Chat interfaces
export interface Chat {
  id: string;
  members: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  readBy: Record<string, any>;
  createdAt: any;
}

export interface MessageAttachment {
  url: string;
  path: string;
  type: string;
  name: string;
  size?: number;
}

export interface MessagePayload {
  text: string;
  senderId: string;
  type?: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
}

/**
 * Create or get an existing chat between members
 * Uses sorted member IDs joined as document ID for deduplication
 */
export const createOrGetChat = async (members: string[]): Promise<string> => {
  if (members.length < 2) {
    throw new Error('Chat must have at least 2 members');
  }

  const db = getFirebaseFirestore();
  
  // Sort member IDs and join to create consistent chat ID
  const sortedMembers = [...members].sort();
  const chatId = sortedMembers.join('_');
  
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      try {
        await setDoc(chatRef, {
          members: sortedMembers,
          createdAt: serverTimestamp(),
        });
        console.log('Chat created successfully:', chatId);
      } catch (createError: any) {
        // If creation fails, it might be a permissions issue
        console.error('Error creating chat document:', createError);
        if (createError?.code === 'permission-denied' || createError?.code === 'PERMISSION_DENIED') {
          throw new Error(`Permission denied: Unable to create chat. Code: ${createError.code}. Please check Firestore rules.`);
        }
        throw createError;
      }
    } else {
      console.log('Chat already exists:', chatId);
    }
    
    return chatId;
  } catch (readError: any) {
    // If read fails, it might be a permissions issue
    console.error('Error reading chat document:', readError);
    if (readError?.code === 'permission-denied' || readError?.code === 'PERMISSION_DENIED') {
      throw new Error(`Permission denied: Unable to access chats. Code: ${readError.code}. Please check Firestore rules. Make sure you've deployed the latest rules.`);
    }
    throw readError;
  }
};

/**
 * Get real-time listener for user's chats
 */
export const getUserChats = (
  uid: string,
  callback: (chats: Chat[]) => void
): Unsubscribe => {
  const db = getFirebaseFirestore();
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('members', 'array-contains', uid));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        chats.push({
          id: doc.id,
          ...doc.data(),
        } as Chat);
      });
      // Sort by lastMessageAt descending
      chats.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      callback(chats);
    },
    (error) => {
      // Handle errors (e.g., permissions denied)
      console.error('Error fetching chats:', error);
      // Still call callback with empty array so loading state updates
      callback([]);
    }
  );
};

/**
 * Send a message to a chat
 */
export const sendMessage = async (
  chatId: string,
  messagePayload: MessagePayload
): Promise<string> => {
  const db = getFirebaseFirestore();
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  const messageData = {
    text: messagePayload.text,
    senderId: messagePayload.senderId,
    type: messagePayload.type || 'text',
    attachments: messagePayload.attachments || [],
    readBy: {
      [messagePayload.senderId]: serverTimestamp(),
    },
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(messagesRef, messageData);
  
  // Update chat's lastMessage and lastMessageAt
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: messagePayload.text,
    lastMessageAt: serverTimestamp(),
  });
  
  return docRef.id;
};

/**
 * Listen to messages in a chat with real-time updates
 */
export const listenMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 50
): Unsubscribe => {
  const db = getFirebaseFirestore();
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limitToLast(messageLimit));
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      } as Message);
    });
    // Reverse to show oldest first
    messages.reverse();
    callback(messages);
  });
};

/**
 * Mark a message as read by a user
 */
export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  uid: string
): Promise<void> => {
  const db = getFirebaseFirestore();
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    [`readBy.${uid}`]: serverTimestamp(),
  });
};

/**
 * Set typing indicator for a user in a chat
 */
export const setTyping = async (
  chatId: string,
  uid: string,
  isTyping: boolean
): Promise<void> => {
  const db = getFirebaseFirestore();
  const typingRef = doc(db, 'chats', chatId, 'typing', uid);
  
  if (isTyping) {
    await setDoc(typingRef, {
      uid,
      timestamp: serverTimestamp(),
    });
  } else {
    await deleteDoc(typingRef);
  }
};

/**
 * Listen to typing indicators in a chat
 */
export const listenTyping = (
  chatId: string,
  callback: (typingUsers: string[]) => void
): Unsubscribe => {
  const db = getFirebaseFirestore();
  const typingRef = collection(db, 'chats', chatId, 'typing');
  
  return onSnapshot(typingRef, (snapshot) => {
    const typingUsers: string[] = [];
    snapshot.forEach((doc) => {
      typingUsers.push(doc.id);
    });
    callback(typingUsers);
  });
};

