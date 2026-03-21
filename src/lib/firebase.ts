import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

// Import the Firebase configuration
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase only if config is provided
const isConfigured = !!firebaseConfig.apiKey;

export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isConfigured ? getAuth(app!) : null;

// Use initializeFirestore with cache settings to avoid deprecation warning
// Make sure to respect the named database if it's provided.
export const db = isConfigured 
  ? initializeFirestore(app!, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId) 
  : null;

export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;

// Test connection to Firestore
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
