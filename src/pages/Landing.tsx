import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, CheckSquare, Calendar, BarChart3, ArrowRight, Zap, Shield, Smartphone } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20"></div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute top-40 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <img 
                src="https://epublication.neocities.org/lantrack_logo.svg" 
                alt="LanTrack Logo" 
                className="w-10 h-10 shadow-lg shadow-indigo-500/20 rounded-xl object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-2xl font-bold tracking-tight">LanTrack</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full px-6">Get Started</Button>
              </Link>
            </div>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                TRACK TIME.<br />
                <span className="text-indigo-600 dark:text-indigo-400">BOOST FOCUS.</span>
              </h1>
              <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto font-medium">
                The modern, professional DTR system for students and interns. 
                Manage tasks, schedules, and goals with ease.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-16 px-10 text-lg rounded-full shadow-xl shadow-indigo-500/20 gap-2">
                    Start Your Journey <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg rounded-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Auto Clock-In"
              description="Set your schedule and let LanTrack handle the rest. Never miss a log again."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Offline First"
              description="Works perfectly even without internet. Your data syncs automatically when you're back."
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile Ready"
              description="A seamless experience across all your devices. Track time on the go."
            />
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[800px] md:h-[600px]">
            <div className="md:col-span-2 md:row-span-2 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-end relative overflow-hidden group">
              <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <BarChart3 className="w-12 h-12 mb-6" />
              <h3 className="text-3xl font-bold mb-4">Advanced Analytics</h3>
              <p className="text-indigo-100 text-lg">Visualize your progress with detailed charts and reports. Stay on top of your goals.</p>
            </div>
            <div className="md:col-span-2 bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 flex flex-col justify-end">
              <CheckSquare className="w-10 h-10 mb-4 text-indigo-600" />
              <h3 className="text-2xl font-bold mb-2">Task Management</h3>
              <p className="text-zinc-500">Organize your daily assignments and track completion status.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 flex flex-col justify-end">
              <Calendar className="w-10 h-10 mb-4 text-indigo-600" />
              <h3 className="text-xl font-bold mb-2">Schedules</h3>
              <p className="text-zinc-500 text-sm">Plan your week ahead.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-8 flex flex-col justify-end">
              <Smartphone className="w-10 h-10 mb-4 text-indigo-600" />
              <h3 className="text-xl font-bold mb-2">Progressive Web App</h3>
              <p className="text-zinc-500 text-sm">Install on any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img 
              src="https://epublication.neocities.org/lantrack_logo.svg" 
              alt="LanTrack Logo" 
              className="w-8 h-8 rounded-lg object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tight">LanTrack</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 LanTrack. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/login" className="text-sm text-zinc-500 hover:text-indigo-600">Privacy</Link>
            <Link to="/login" className="text-sm text-zinc-500 hover:text-indigo-600">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
