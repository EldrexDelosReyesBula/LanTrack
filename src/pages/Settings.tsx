import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Shield,
  Bell,
  User,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNotification } from "../contexts/NotificationContext";
import { useToast } from "../contexts/ToastContext";
import { db, auth } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";

export function Settings() {
  const { user, updateUserPassword, updateUserEmail } = useAuth();
  const { theme, setTheme } = useTheme();
  const { permission, requestPermission } = useNotification();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<
    | "menu"
    | "profile"
    | "appearance"
    | "notifications"
    | "security"
    | "automation"
    | "goals"
  >("menu");
  const [isPasswordSheetOpen, setIsPasswordSheetOpen] = useState(false);
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [autoClockIn, setAutoClockIn] = useState(user?.autoClockIn || "");
  const [autoClockOut, setAutoClockOut] = useState(user?.autoClockOut || "");
  const [autoClockEnabled, setAutoClockEnabled] = useState(
    user?.autoClockEnabled || false,
  );

  const [notifyApprovals, setNotifyApprovals] = useState(
    user?.notifyApprovals ?? true,
  );
  const [notifyResources, setNotifyResources] = useState(
    user?.notifyResources ?? true,
  );
  const [notifyReminders, setNotifyReminders] = useState(
    user?.notifyReminders ?? true,
  );

  const [school, setSchool] = useState(user?.school || "");
  const [partners, setPartners] = useState(user?.partners || []);
  const [customTags, setCustomTags] = useState(user?.customTags || ["Coding", "Meeting", "Research", "Break"]);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerHours, setNewPartnerHours] = useState("");
  const [newTag, setNewTag] = useState("");
  const [dailyGoalHours, setDailyGoalHours] = useState(user?.dailyGoalHours || 8);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(user?.weeklyGoalHours || 40);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">(user?.timeFormat || "12h");
  const [clockType, setClockType] = useState<"analog" | "digital">(user?.clockType || "digital");
  const [alarmEnabled, setAlarmEnabled] = useState(user?.alarmEnabled ?? false);

  const openMobileView = (
    content:
      | "profile"
      | "appearance"
      | "notifications"
      | "security"
      | "automation",
  ) => {
    setMobileActiveView(content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeMobileView = () => {
    setMobileActiveView("menu");
  };

  const canChangeName = () => {
    if (!user?.lastDisplayNameChange) return true;
    const lastChange = new Date(user.lastDisplayNameChange);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastChange.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
  };

  const getDaysUntilChange = () => {
    if (!user?.lastDisplayNameChange) return 0;
    const lastChange = new Date(user.lastDisplayNameChange);
    const nextChange = new Date(
      lastChange.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const now = new Date();
    const diffTime = nextChange.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !canChangeName()) return;

    try {
      setIsUpdating(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        school,
        lastDisplayNameChange: new Date().toISOString(),
      });
      showToast("Profile updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showToast(error.message || "Failed to update profile", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    try {
      setIsUpdating(true);
      await updateUserPassword(currentPassword, newPassword);
      showToast("Password updated successfully", "success");
      setIsPasswordSheetOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        showToast("Incorrect current password", "error");
      } else if (error.code === "auth/requires-recent-login") {
        showToast(
          "Please log out and log back in to change your password.",
          "error",
        );
      } else {
        showToast(error.message || "Failed to update password", "error");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await updateUserEmail(currentPassword, newEmail);
      showToast("Email updated successfully", "success");
      setIsEmailSheetOpen(false);
      setNewEmail("");
      setCurrentPassword("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        showToast("Incorrect current password", "error");
      } else if (error.code === "auth/requires-recent-login") {
        showToast(
          "Please log out and log back in to change your email.",
          "error",
        );
      } else {
        showToast(error.message || "Failed to update email", "error");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      setIsUpdating(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        notifyApprovals,
        notifyResources,
        notifyReminders,
        alarmEnabled,
      });
      showToast("Notification preferences updated", "success");
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      showToast(error.message || "Failed to update notifications", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      setIsUpdating(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        autoClockIn,
        autoClockOut,
        autoClockEnabled,
      });
      showToast("Automation settings updated", "success");
    } catch (error: any) {
      console.error("Error updating automation:", error);
      showToast(error.message || "Failed to update automation", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      setIsUpdating(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        timeFormat,
        clockType,
      });
      showToast("Appearance settings updated", "success");
    } catch (error: any) {
      console.error("Error updating appearance:", error);
      showToast(error.message || "Failed to update appearance", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      setIsUpdating(true);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        dailyGoalHours,
        weeklyGoalHours,
        partners,
        customTags,
      });
      showToast("Goals and preferences updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating goals:", error);
      showToast(error.message || "Failed to update goals", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const addPartner = () => {
    if (newPartnerName && newPartnerHours) {
      setPartners([...partners, { id: Date.now().toString(), name: newPartnerName, allocatedHours: Number(newPartnerHours) }]);
      setNewPartnerName("");
      setNewPartnerHours("");
    }
  };

  const removePartner = (id: string) => {
    setPartners(partners.filter(p => p.id !== id));
  };

  const addTag = () => {
    if (newTag && !customTags.includes(newTag)) {
      setCustomTags([...customTags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const renderProfileContent = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
          Profile Information
        </h2>

        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
            {user?.initials || "U"}
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.displayName || "User"}</h3>
            <p className="text-zinc-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              disabled={!canChangeName() || isUpdating}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 ${!canChangeName() ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-indigo-500"}`}
            />
            {!canChangeName() ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                You can change your name again in {getDaysUntilChange()} days.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">
                You can only change your display name once every 30 days.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              School / Institution
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
              placeholder="e.g. University of Technology"
            />
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                !canChangeName() ||
                isUpdating ||
                displayName === user?.displayName
              }
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Time Goals
        </h2>
        <form onSubmit={handleUpdateGoals} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Daily Goal (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Weekly Goal (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isUpdating ||
                (dailyGoalHours === user?.dailyGoalHours &&
                  weeklyGoalHours === user?.weeklyGoalHours)
              }
            >
              {isUpdating ? "Saving..." : "Save Goals"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderAppearanceContent = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-indigo-500" />
          Appearance
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "system", icon: Monitor, label: "System" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  theme === t.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
              >
                <t.icon className="w-6 h-6" />
                <span className="font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Time & Display
        </h2>
        <form onSubmit={handleUpdateAppearance} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Time Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={timeFormat === "12h"}
                    onChange={(e) => setTimeFormat(e.target.value as "12h" | "24h")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                  />
                  <span className="text-sm font-medium">12-hour (1:00 PM)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={timeFormat === "24h"}
                    onChange={(e) => setTimeFormat(e.target.value as "12h" | "24h")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                  />
                  <span className="text-sm font-medium">24-hour (13:00)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Clock Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clockType"
                    value="digital"
                    checked={clockType === "digital"}
                    onChange={(e) => setClockType(e.target.value as "analog" | "digital")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                  />
                  <span className="text-sm font-medium">Digital</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clockType"
                    value="analog"
                    checked={clockType === "analog"}
                    onChange={(e) => setClockType(e.target.value as "analog" | "digital")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                  />
                  <span className="text-sm font-medium">Analog</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isUpdating ||
                (timeFormat === user?.timeFormat && clockType === user?.clockType)
              }
            >
              {isUpdating ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderNotificationsContent = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          Notifications
        </h2>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Push Notifications
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Receive alerts for upcoming sessions and tasks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission === "granted" ? (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={async () => {
                      try {
                        if (user?.fcmToken) {
                          const { sendNotification } = await import('../lib/notifications');
                          await sendNotification(user.fcmToken, 'Test Notification', 'This is a test notification from OJT Ledger.');
                          showToast('Test notification sent', 'success');
                        } else {
                          showToast('FCM token not found. Try refreshing the page.', 'error');
                        }
                      } catch (e: any) {
                        showToast(e.message || 'Failed to send notification', 'error');
                      }
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    Test
                  </Button>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    Enabled
                  </span>
                </div>
              ) : (
                <Button onClick={requestPermission} variant="outline" size="sm">
                  Enable
                </Button>
              )}
            </div>
          </div>

          {permission === "granted" && (
            <form onSubmit={handleUpdateNotifications} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Notification Preferences
              </h3>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-medium text-sm">Log Approvals</p>
                  <p className="text-xs text-zinc-500">
                    When your DTR logs are approved or rejected
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifyApprovals}
                    onChange={(e) => setNotifyApprovals(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-medium text-sm">Shared Resources</p>
                  <p className="text-xs text-zinc-500">
                    When team members share new links
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifyResources}
                    onChange={(e) => setNotifyResources(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-medium text-sm">Clock-out Reminders</p>
                  <p className="text-xs text-zinc-500">
                    Daily reminders to clock out at the end of the day
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifyReminders}
                    onChange={(e) => setNotifyReminders(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-medium text-sm">Goal Alarms</p>
                  <p className="text-xs text-zinc-500">
                    Play an alarm sound when you reach your daily time goal
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={alarmEnabled}
                    onChange={(e) => setAlarmEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );

  const renderSecurityContent = () => {
    const isGoogleSignIn = auth?.currentUser?.providerData.some(
      (provider) => provider.providerId === "google.com",
    );

    return (
      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Security
          </h2>
          {isGoogleSignIn ? (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You are signed in with Google. Password and email changes are
                managed through your Google account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-zinc-500">
                    Change your account password
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasswordSheetOpen(true)}
                >
                  Update
                </Button>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Address</h3>
                  <p className="text-sm text-zinc-500">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEmailSheetOpen(true)}
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderAutomationContent = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Automation
        </h2>
        <form onSubmit={handleUpdateAutomation} className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Enable Auto Clock-In/Out
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Automatically log your time based on schedule.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoClockEnabled}
                onChange={(e) => setAutoClockEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div
            className={`space-y-4 transition-opacity ${!autoClockEnabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Auto Clock-In Time
              </label>
              <input
                type="time"
                value={autoClockIn}
                onChange={(e) => setAutoClockIn(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Auto Clock-Out Time
              </label>
              <input
                type="time"
                value={autoClockOut}
                onChange={(e) => setAutoClockOut(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Automation Settings"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderGoalsContent = () => (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          Goals & Preferences
        </h2>
        <form onSubmit={handleUpdateGoals} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Daily Goal (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Weekly Goal (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-md font-semibold mb-4">Partners & Companies</h3>
            <div className="space-y-3 mb-4">
              {partners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{partner.name}</p>
                    <p className="text-xs text-zinc-500">{partner.allocatedHours} hours allocated</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePartner(partner.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Partner Name"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="number"
                placeholder="Hours"
                value={newPartnerHours}
                onChange={(e) => setNewPartnerHours(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-zinc-100"
              />
              <Button type="button" onClick={addPartner} variant="secondary" size="sm">Add</Button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-md font-semibold mb-4">Activity Tags</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {customTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-800 dark:hover:text-indigo-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-zinc-100"
              />
              <Button type="button" onClick={addTag} variant="secondary" size="sm">Add</Button>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Goals & Preferences"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8 hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your preferences and account.
        </p>
      </header>

      <div className="md:hidden">
        {mobileActiveView === "menu" ? (
          <div className="space-y-6">
            <header className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Settings
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Manage your preferences and account.
              </p>
            </header>
            <div className="space-y-2">
              {[
                {
                  id: "profile",
                  icon: User,
                  label: "Profile",
                  desc: "Manage your personal information",
                },
                {
                  id: "appearance",
                  icon: Monitor,
                  label: "Appearance",
                  desc: "Theme and display settings",
                },
                {
                  id: "notifications",
                  icon: Bell,
                  label: "Notifications",
                  desc: "Alerts and push notifications",
                },
                {
                  id: "security",
                  icon: Shield,
                  label: "Security",
                  desc: "Password and account security",
                },
                {
                  id: "automation",
                  icon: Clock,
                  label: "Automation",
                  desc: "Auto clock-in/out settings",
                },
                {
                  id: "goals",
                  icon: CheckCircle2,
                  label: "Goals & Preferences",
                  desc: "Time goals, partners, and tags",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => openMobileView(item.id as any)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto pb-safe"
          >
            <div className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 flex items-center gap-3">
              <button
                onClick={closeMobileView}
                className="p-2 -ml-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold capitalize">
                {mobileActiveView}
              </h1>
            </div>
            <div className="p-4 pb-24">
              {mobileActiveView === "profile" && renderProfileContent()}
              {mobileActiveView === "appearance" && renderAppearanceContent()}
              {mobileActiveView === "notifications" &&
                renderNotificationsContent()}
              {mobileActiveView === "security" && renderSecurityContent()}
              {mobileActiveView === "automation" && renderAutomationContent()}
              {mobileActiveView === "goals" && renderGoalsContent()}
            </div>
          </motion.div>
        )}
      </div>

      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <nav className="flex flex-col gap-1 sticky top-8">
            {[
              { id: "profile", icon: User, label: "Profile" },
              { id: "appearance", icon: Monitor, label: "Appearance" },
              { id: "notifications", icon: Bell, label: "Notifications" },
              { id: "security", icon: Shield, label: "Security" },
              { id: "automation", icon: Clock, label: "Automation" },
              { id: "goals", icon: CheckCircle2, label: "Goals & Prefs" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderProfileContent()}
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderAppearanceContent()}
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderNotificationsContent()}
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderSecurityContent()}
            </motion.div>
          )}

          {activeTab === "automation" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderAutomationContent()}
            </motion.div>
          )}

          {activeTab === "goals" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderGoalsContent()}
            </motion.div>
          )}
        </div>
      </div>

      {/* Change Password Sheet */}
      <BottomSheet
        isOpen={isPasswordSheetOpen}
        onClose={() => setIsPasswordSheetOpen(false)}
        title="Change Password"
      >
        <form className="space-y-4" onSubmit={handleUpdatePassword}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Change Email Sheet */}
      <BottomSheet
        isOpen={isEmailSheetOpen}
        onClose={() => setIsEmailSheetOpen(false)}
        title="Change Email"
      >
        <form className="space-y-4" onSubmit={handleUpdateEmail}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Email"}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
