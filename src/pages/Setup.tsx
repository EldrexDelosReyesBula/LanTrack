import React from "react";
import { motion } from "motion/react";
import { Database, Key, ShieldAlert } from "lucide-react";
import { Card } from "../components/ui/Card";

export function Setup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="text-center p-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Setup Required
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            LanTrack requires Firebase to function. Please configure your
            environment variables to continue.
          </p>

          <div className="text-left bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" /> Required Variables
            </h3>
            <ul className="text-xs font-mono text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add these to your{" "}
            <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
              .env
            </code>{" "}
            file and restart the server.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
