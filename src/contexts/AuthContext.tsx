import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, isConfigured } from "../lib/firebase";
import { getInitials } from "../lib/utils";

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  initials: string;
  school?: string;
  partners?: { id: string; name: string; allocatedHours: number }[];
  customTags?: string[];
  dailyGoalHours?: number;
  weeklyGoalHours?: number;
  scheduleStart?: string;
  scheduleEnd?: string;
  lastDisplayNameChange?: string;
  notifyApprovals?: boolean;
  notifyResources?: boolean;
  notifyReminders?: boolean;
  autoClockIn?: string;
  autoClockOut?: string;
  autoClockEnabled?: boolean;
  autoClockDays?: number[];
  holidays?: string[];
  timeFormat?: "12h" | "24h";
  clockType?: "analog" | "digital";
  alarmEnabled?: boolean;
  fcmToken?: string;
  notificationsEnabled?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  logout: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db!, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let appUser: AppUser;

        if (userSnap.exists()) {
          appUser = userSnap.data() as AppUser;
        } else {
          // Create new user (fallback if not created in signUpWithEmail or signInWithGoogle)
          appUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            initials: getInitials(
              firebaseUser.displayName || firebaseUser.email || "User",
            ),
            dailyGoalHours: 8,
            weeklyGoalHours: 40,
            scheduleStart: "09:00",
            scheduleEnd: "17:00",
            school: "",
            partners: [],
            customTags: ["Coding", "Meeting", "Research", "Break"],
          };
          await setDoc(userRef, appUser);
        }
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) throw new Error("Firebase not configured");
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if user exists, if not create with the specified role
    const userRef = doc(db!, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const appUser: AppUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        initials: getInitials(result.user.displayName || result.user.email || "User"),
        dailyGoalHours: 8,
        weeklyGoalHours: 40,
        scheduleStart: "09:00",
        scheduleEnd: "17:00",
        school: "",
        partners: [],
        customTags: ["Coding", "Meeting", "Research", "Break"],
      };
      await setDoc(userRef, appUser);
      setUser(appUser);
    }
    return { ...result, isNewUser: !userSnap.exists() };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!auth) throw new Error("Firebase not configured");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user doc
    const userRef = doc(db!, "users", userCredential.user.uid);
    const appUser: AppUser = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: name,
      initials: getInitials(name),
      dailyGoalHours: 8,
      weeklyGoalHours: 40,
      scheduleStart: "09:00",
      scheduleEnd: "17:00",
      school: "",
      partners: [],
      customTags: ["Coding", "Meeting", "Research", "Break"],
    };
    await setDoc(userRef, appUser);
    setUser(appUser);
    return userCredential;
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!auth?.currentUser) throw new Error("User not authenticated");
    if (!auth.currentUser.email) throw new Error("User email not found");
    
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Then update password
    await updatePassword(auth.currentUser, newPassword);
  };

  const updateUserEmail = async (currentPassword: string, newEmail: string) => {
    if (!auth?.currentUser) throw new Error("User not authenticated");
    if (!auth.currentUser.email) throw new Error("User email not found");
    
    // Re-authenticate first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Then update email
    await updateEmail(auth.currentUser, newEmail);
    
    // Also update in Firestore
    const userRef = doc(db!, "users", auth.currentUser.uid);
    await setDoc(userRef, { email: newEmail }, { merge: true });
    
    if (user) {
      setUser({ ...user, email: newEmail });
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, updateUserPassword, updateUserEmail, logout, isConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
