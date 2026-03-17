import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db, isConfigured, getMessagingInstance } from "../lib/firebase";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function getInitialPermission(): NotificationPermission {
  try {
    return "Notification" in window ? Notification.permission : "default";
  } catch (e) {
    console.warn("Could not access Notification.permission:", e);
    return "denied";
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission());

  useEffect(() => {
    if (!isConfigured || !user) return;

    let unsubscribe: any;

    const initMessaging = async () => {
      if (permission === "granted") {
        await setupMessaging();
      }

      const messaging = await getMessagingInstance();
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log("Message received. ", payload);
          // Show local notification
          try {
            if (Notification.permission === "granted") {
              new Notification(payload.notification?.title || "New Notification", {
                body: payload.notification?.body,
                icon: "/pwa-192x192.png"
              });
            }
          } catch (e) {
            console.warn("Could not show notification:", e);
          }
        });
      }
    };

    initMessaging();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, permission]);

  const setupMessaging = async () => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging || !user) return;
      
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("VITE_FIREBASE_VAPID_KEY is not set. Push notifications may not work.");
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey || "YOUR_VAPID_KEY_HERE"
      });

      if (currentToken) {
        // Save token to user profile
        const userRef = doc(db!, "users", user.uid);
        await updateDoc(userRef, {
          fcmToken: currentToken,
          notificationsEnabled: true
        });
      }
    } catch (error) {
      console.error("An error occurred while retrieving token. ", error);
    }
  };

  const requestPermission = async () => {
    try {
      if (!("Notification" in window)) return;
      
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === "granted") {
        await setupMessaging();
      } else if (p === "denied" && user) {
        const userRef = doc(db!, "users", user.uid);
        await updateDoc(userRef, {
          notificationsEnabled: false
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setPermission("denied");
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
