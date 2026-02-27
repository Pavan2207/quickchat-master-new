// Firebase configuration for QuickChat
// Using Firebase Modular SDK

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getDatabase, Database, ref as dbRef, set, remove, onValue, off, DataSnapshot } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDv2I4zGafbmAFuNdWWOhc3GiykGNNL32Q",
  authDomain: "quickchat-967d7.firebaseapp.com",
  databaseURL: "https://quickchat-967d7-default-rtdb.firebaseio.com",
  projectId: "quickchat-967d7",
  storageBucket: "quickchat-967d7.firebasestorage.app",
  messagingSenderId: "137921806360",
  appId: "1:137921806360:web:c6b33fd14e059ce824436d",
  measurementId: "G-4R9768TDXB"
};

// Initialize Firebase only once
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let storage: FirebaseStorage | undefined;
let database: Database | undefined;
let firestore: Firestore | undefined;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  storage = getStorage(app);
  database = getDatabase(app);
  firestore = getFirestore(app);
}

export { app, auth, storage, database, firestore };

// Firebase Auth helpers
export const firebaseAuth = {
  signInWithPhone: async (phoneNumber: string) => {
    console.log('Phone auth requested for:', phoneNumber);
    return null;
  },
  
  signInWithGoogle: async () => {
    console.log('Google sign in requested');
    return null;
  },
  
  signInWithGithub: async () => {
    console.log('GitHub sign in requested');
    return null;
  },
  
  signInWithBiometric: async () => {
    console.log('Biometric auth not supported in this demo');
    return null;
  },
  
  signOut: async () => {
    if (auth) {
      await auth.signOut();
    }
  }
};

// Firebase Storage helpers
export const firebaseStorage = {
  uploadFile: async (file: File, path: string): Promise<string | null> => {
    if (!storage) return null;
    try {
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },
  
  uploadImage: async (file: File, path: string): Promise<string | null> => {
    if (!storage) return null;
    
    const s = storage;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          const response = await fetch(compressedDataUrl);
          const blob = await response.blob();
          
          const fileRef = storageRef(s, path);
          await uploadBytes(fileRef, blob);
          const downloadUrl = await getDownloadURL(fileRef);
          resolve(downloadUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  },
  
  deleteFile: async (path: string): Promise<boolean> => {
    if (!storage) return false;
    try {
      const fileRef = storageRef(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },
  
  getFileUrl: async (path: string): Promise<string | null> => {
    if (!storage) return null;
    try {
      const fileRef = storageRef(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }
};

// Firebase Realtime Database helpers for presence
export const firebasePresence = {
  setOnlineStatus: async (userId: string, isOnline: boolean) => {
    if (!database) return;
    try {
      const userStatusRef = dbRef(database, `presence/${userId}`);
      await set(userStatusRef, { online: isOnline, lastSeen: Date.now() });
    } catch (error) {
      console.log('Firebase presence (optional):', error);
    }
  },
  
  subscribeToOnlineStatus: (userId: string, callback: (isOnline: boolean) => void) => {
    if (!database) { callback(false); return () => {}; }
    try {
      const userStatusRef = dbRef(database, `presence/${userId}`);
      const unsubscribe = onValue(userStatusRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        callback(data?.online || false);
      }, (error) => { callback(false); });
      return () => off(userStatusRef);
    } catch (error) { callback(false); return () => {}; }
  },
  
  setTypingStatus: async (conversationId: string, userId: string, isTyping: boolean) => {
    if (!database) return;
    try {
      const typingRef = dbRef(database, `typing/${conversationId}/${userId}`);
      if (isTyping) {
        await set(typingRef, true);
        setTimeout(async () => { await remove(typingRef); }, 3000);
      } else {
        await remove(typingRef);
      }
    } catch (error) { console.log('Firebase typing (optional):', error); }
  },
  
  subscribeToTypingStatus: (conversationId: string, callback: (users: string[]) => void) => {
    if (!database) { callback([]); return () => {}; }
    try {
      const typingRef = dbRef(database, `typing/${conversationId}`);
      const unsubscribe = onValue(typingRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        const users = data ? Object.keys(data) : [];
        callback(users);
      }, (error) => { callback([]); });
      return () => off(typingRef);
    } catch (error) { callback([]); return () => {}; }
  },
  
  setPrivacySettings: async (userId: string, settings: { showOnlineStatus: boolean; showLastSeen: boolean; showReadReceipts: boolean; allowGroupInvites: boolean }) => {
    if (!database) return;
    try {
      const privacyRef = dbRef(database, `privacy/${userId}`);
      await set(privacyRef, { ...settings, updatedAt: Date.now() });
    } catch (error) { console.error('Error setting privacy settings:', error); throw error; }
  },
  
  subscribeToPrivacySettings: (userId: string, callback: (settings: { showOnlineStatus: boolean; showLastSeen: boolean; showReadReceipts: boolean; allowGroupInvites: boolean } | null) => void) => {
    if (!database) { callback(null); return () => {}; }
    try {
      const privacyRef = dbRef(database, `privacy/${userId}`);
      const unsubscribe = onValue(privacyRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          callback({ showOnlineStatus: data.showOnlineStatus ?? true, showLastSeen: data.showLastSeen ?? true, showReadReceipts: data.showReadReceipts ?? true, allowGroupInvites: data.allowGroupInvites ?? true });
        } else { callback(null); }
      }, (error) => { callback(null); });
      return () => off(privacyRef);
    } catch (error) { callback(null); return () => {}; }
  },
  
  blockUser: async (blockerId: string, blockedId: string, blockedUserInfo: { name: string; email: string; image?: string }) => {
    if (!database) return;
    try {
      const blockRef = dbRef(database, `blocked/${blockerId}/${blockedId}`);
      await set(blockRef, { ...blockedUserInfo, blockedAt: Date.now() });
    } catch (error) { console.error('Error blocking user:', error); throw error; }
  },
  
  unblockUser: async (blockerId: string, blockedId: string) => {
    if (!database) return;
    try {
      const blockRef = dbRef(database, `blocked/${blockerId}/${blockedId}`);
      await remove(blockRef);
    } catch (error) { console.error('Error unblocking user:', error); throw error; }
  },
  
  subscribeToBlockedUsers: (blockerId: string, callback: (blockedUsers: Array<{ blockedId: string; name: string; email: string; image?: string }>) => void) => {
    if (!database) { callback([]); return () => {}; }
    try {
      const blockedRef = dbRef(database, `blocked/${blockerId}`);
      const unsubscribe = onValue(blockedRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val() as Record<string, { name?: string; email?: string; image?: string }> | null;
        if (data) {
          const blockedList = Object.entries(data).map(([id, info]) => ({ blockedId: id, name: info?.name || 'Unknown', email: info?.email || '', image: info?.image }));
          callback(blockedList);
        } else { callback([]); }
      }, (error) => { callback([]); });
      return () => off(blockedRef);
    } catch (error) { callback([]); return () => {}; }
  }
};

export default { app: app || null, auth: auth || null, storage: storage || null, database: database || null, firestore: firestore || null, firebaseAuth, firebaseStorage, firebasePresence };
