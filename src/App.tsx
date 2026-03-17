/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Setup } from "./pages/Setup";
import { Dashboard } from "./pages/Dashboard";
import { DTR } from "./pages/DTR";
import { History } from "./pages/History";
import { Tasks } from "./pages/Tasks";
import { Calendar } from "./pages/Calendar";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { NotFound } from "./pages/NotFound";
import { Offline } from "./pages/Offline";

export default function App() {
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

  if (!isOnline) {
    return <Offline />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/setup" element={<Setup />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dtr" element={<DTR />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
