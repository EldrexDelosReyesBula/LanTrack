import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { sendNotification } from "../lib/notifications";

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: any;
  link?: string;
}

export const createNotification = async (
  userId: string,
  notification: Omit<AppNotification, "id" | "read" | "createdAt">
) => {
  if (!db) return;
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });

    // Send push notification if user has FCM token and notifications enabled
    const userRef = doc(db, `users`, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.fcmToken && userData.notificationsEnabled !== false) {
        // Check specific notification preferences based on title/type
        let shouldNotify = true;
        if (notification.title.toLowerCase().includes('approv') && userData.notifyApprovals === false) {
          shouldNotify = false;
        } else if (notification.title.toLowerCase().includes('resource') && userData.notifyResources === false) {
          shouldNotify = false;
        } else if (notification.title.toLowerCase().includes('reminder') && userData.notifyReminders === false) {
          shouldNotify = false;
        }

        if (shouldNotify) {
          try {
            await sendNotification(userData.fcmToken, notification.title, notification.message, {
              link: notification.link || ''
            });
          } catch (e) {
            console.warn("Failed to send push notification:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
