import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Link
      to="/notifications"
      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
    >
      <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </Link>
  );
}
