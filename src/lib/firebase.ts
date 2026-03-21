import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const configs = import.meta.glob("/firebase-applet-config.json", { eager: true });
const configFromFile = (configs["/firebase-applet-config.json"] as any)?.default;

const firebaseConfig = {
  apiKey: configFromFile?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: configFromFile?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: configFromFile?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: configFromFile?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: configFromFile?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: configFromFile?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: configFromFile?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.includes('://')) {
  console.warn("Invalid Firestore Database ID detected (looks like a URL). Falling back to default.");
  firebaseConfig.firestoreDatabaseId = undefined;
}

const isConfigured = !!firebaseConfig.apiKey;

export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isConfigured ? getAuth(app!) : null;

export const db = isConfigured 
  ? initializeFirestore(app!, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId) 
  : null;

export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;

if (db) {
  const testConnection = async () => {
    try {
      const { doc, getDocFromServer } = await import("firebase/firestore");
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
    }
  };
  testConnection();
}

export const getMessagingInstance = async () => {
  if (!isConfigured) return null;
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app!);
  }
  return null;
};

export { isConfigured };
