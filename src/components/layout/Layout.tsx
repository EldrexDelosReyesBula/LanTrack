import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Clock,
  History,
  CheckSquare,
  Calendar as CalendarIcon,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationsDropdown } from "../NotificationsDropdown";
import { Button } from "../ui/Button";

import { PromptsManager } from "../PromptsManager";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dtr", label: "DTR", icon: Clock },
  { path: "/history", label: "History", icon: History },
  { path: "/calendar", label: "Calendar", icon: CalendarIcon },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/reports", label: "Reports", icon: FileBarChart },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = () => {
    setShowSignOutConfirm(false);
    logout();
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      <PromptsManager />

      {/* Sidebar (Desktop) */}
      <aside className="w-64 flex-shrink-0 glass z-20 flex-col hidden md:flex m-4 rounded-3xl overflow-hidden">
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            LanTrack
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/5"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm shadow-inner">
              {user?.initials || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-zinc-500 truncate capitalize font-medium">
                Personal
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
        {/* Desktop Header (Notifications) */}
        <header className="hidden md:flex items-center justify-end p-4 z-30">
          <NotificationsDropdown />
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/20 dark:border-white/5 z-30 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              LanTrack
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/20 dark:border-white/5 z-40 pb-safe">
          <div className="flex items-center justify-around p-2">
            {[
              { path: "/", label: "Home", icon: LayoutDashboard },
              { path: "/dtr", label: "DTR", icon: Clock },
              { path: "/tasks", label: "Tasks", icon: CheckSquare },
              { path: "/calendar", label: "Calendar", icon: CalendarIcon },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`
                }
              >
                <item.icon className={`w-6 h-6 mb-1 ${location.pathname === item.path ? 'fill-indigo-100 dark:fill-indigo-900/30' : ''}`} />
                <span className="text-[10px]">{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center w-16 h-14 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
            >
              <Menu className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Menu</span>
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-zinc-950 z-50 flex flex-col shadow-2xl md:hidden"
              >
                <div className="p-4 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                      LanTrack
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow-inner">
                    {user?.initials || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-sm text-zinc-500 truncate capitalize font-medium">
                      Personal
                    </p>
                  </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`
                      }
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-base">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>

                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 pb-safe">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-3 w-full px-4 py-4 text-base font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
                  >
                    <LogOut className="w-6 h-6" />
                    Sign Out
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSignOutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Sign Out</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                Are you sure you want to sign out? You will need to log in again to access your account.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
