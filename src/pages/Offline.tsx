import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Offline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-8">
          <WifiOff className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">You're Offline</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
          It seems you've lost your internet connection. Please check your network and try again.
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="lg" 
          className="rounded-full gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Retry Connection
        </Button>
      </motion.div>
    </div>
  );
}
