import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FullScreenModal({ isOpen, onClose, title, children }: FullScreenModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10 sticky top-0">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
