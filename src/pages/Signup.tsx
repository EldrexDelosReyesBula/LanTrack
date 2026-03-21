import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, Mail, Lock, User, ArrowRight, Github, Chrome } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
      showToast("Account created successfully!", "success");
      navigate("/onboarding");
    } catch (error: any) {
      showToast(error.message || "Failed to create account", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
      showToast("Signed up with Google!", "success");
      navigate("/onboarding");
    } catch (error: any) {
      showToast(error.message || "Google signup failed", "error");
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <img 
                src="https://epublication.neocities.org/lantrack_logo.svg" 
                alt="LanTrack Logo" 
                className="w-10 h-10 shadow-lg shadow-indigo-500/20 rounded-xl object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-2xl font-bold tracking-tight">LanTrack</span>
            </Link>
            <h1 className="text-4xl font-black tracking-tighter mb-2">CREATE ACCOUNT</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Start tracking your journey today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 gap-2"
            >
              Sign Up <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-950 px-4 text-zinc-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4">
            <Button 
              variant="outline" 
              onClick={handleGoogleSignup}
              className="h-14 rounded-2xl border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 gap-3 font-bold"
            >
              <Chrome className="w-5 h-5" />
              Google
            </Button>
          </div>

          <p className="mt-12 text-center text-zinc-500 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side: Branding (Desktop Only) */}
      <div className="hidden lg:flex flex-1 bg-zinc-50 dark:bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent"></div>
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-lg text-center">
          <div className="w-32 h-32 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-indigo-500/40 rotate-12 p-4">
            <img 
              src="https://epublication.neocities.org/lantrack_logo.svg" 
              alt="LanTrack Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-5xl font-black tracking-tighter mb-6 leading-tight">
            THE MODERN WAY TO TRACK YOUR TIME.
          </h2>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Join thousands of students and interns who use LanTrack to manage their daily time records and stay productive.
          </p>
          
          <div className="mt-16 grid grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-indigo-600 mb-1">99%</div>
              <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-800 rounded-3xl shadow-sm">
              <div className="text-3xl font-black text-indigo-600 mb-1">24/7</div>
              <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Offline Sync</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
