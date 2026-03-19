import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, Moon, Sun, Stars } from 'lucide-react';

export function AuthBackground() {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'noon' | 'evening' | 'night'>('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay('morning');
    } else if (hour >= 12 && hour < 17) {
      setTimeOfDay('noon');
    } else if (hour >= 17 && hour < 20) {
      setTimeOfDay('evening');
    } else {
      setTimeOfDay('night');
    }
  }, []);

  const getBackgroundClass = () => {
    switch (timeOfDay) {
      case 'morning':
        return "bg-gradient-to-br from-orange-100 via-amber-50 to-blue-100 dark:from-orange-900/40 dark:via-amber-900/20 dark:to-blue-900/40";
      case 'noon':
        return "bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100 dark:from-blue-900/40 dark:via-cyan-900/20 dark:to-sky-900/40";
      case 'evening':
        return "bg-gradient-to-br from-orange-200 via-rose-100 to-purple-200 dark:from-orange-900/40 dark:via-rose-900/20 dark:to-purple-900/40";
      case 'night':
        return "bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950";
    }
  };

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000 ${getBackgroundClass()}`}>
      {/* Morning: Sunrise & Fog */}
      {timeOfDay === 'morning' && (
        <>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute bottom-20 right-20 text-orange-400/50"
          >
            <Sun className="w-64 h-64 blur-xl" />
          </motion.div>
          <motion.div
            animate={{ x: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white/40 to-transparent blur-2xl"
          />
        </>
      )}

      {/* Noon: Bright Sun & Clouds */}
      {timeOfDay === 'noon' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-20 text-yellow-300/50"
          >
            <Sun className="w-48 h-48 blur-lg" />
          </motion.div>
          <motion.div
            animate={{ x: [-100, window.innerWidth + 100] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 text-white/40"
          >
            <Cloud className="w-32 h-32 blur-sm" />
          </motion.div>
          <motion.div
            animate={{ x: [window.innerWidth + 100, -100] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-60 text-white/30"
          >
            <Cloud className="w-48 h-48 blur-md" />
          </motion.div>
        </>
      )}

      {/* Evening: Sunset */}
      {timeOfDay === 'evening' && (
        <>
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 50 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute bottom-40 left-20 text-orange-500/50"
          >
            <Sun className="w-64 h-64 blur-2xl" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent mix-blend-overlay" />
        </>
      )}

      {/* Night: Moon & Stars */}
      {timeOfDay === 'night' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-20 text-slate-200/50"
          >
            <Moon className="w-48 h-48 blur-md" />
          </motion.div>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
              className="absolute bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                boxShadow: "0 0 10px rgba(255,255,255,0.8)"
              }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-20"
          >
            <Stars className="w-full h-full max-w-3xl max-h-3xl text-indigo-200" />
          </motion.div>
        </>
      )}

      {/* Generic Sparkles / Blobs for all times */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
      <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
    </div>
  );
}
