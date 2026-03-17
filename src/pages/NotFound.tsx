import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-zinc-900 dark:text-zinc-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <FileQuestion className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-bold tracking-tighter mb-4 text-zinc-900 dark:text-zinc-100">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" className="rounded-full gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
