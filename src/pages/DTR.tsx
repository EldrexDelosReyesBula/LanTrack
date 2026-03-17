import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Play,
  Square,
  FileText,
  Link as LinkIcon,
  Plus,
  X,
  Pause,
  AlertTriangle,
  Tag as TagIcon,
  Globe,
  Lock,
} from "lucide-react";

const PREDEFINED_TAGS = ['Development', 'Meetings', 'Training', 'Documentation', 'Research', 'Design'];

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { db } from "../lib/firebase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function DTR() {
  const { user } = useAuth();
  const availableTags = user?.customTags || PREDEFINED_TAGS;
  const { showToast } = useToast();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [totalTodayHours, setTotalTodayHours] = useState(0);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [alarmPlayed, setAlarmPlayed] = useState(false);
  
  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [partnerId, setPartnerId] = useState<string>("");
  
  // Clock out modal state
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [clockOutCountdown, setClockOutCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (showClockOutModal && clockOutCountdown > 0) {
      countdownTimer = setInterval(() => {
        setClockOutCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [showClockOutModal, clockOutCountdown]);

  useEffect(() => {
    if (!user || !db) return;

    const fetchTodayData = async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const dtrRef = collection(db, `users/${user.uid}/logs`);
        
        // Fetch all logs for today
        const qAll = query(
          dtrRef,
          where("userId", "==", user.uid),
          where("date", "==", today)
        );
        const snapAll = await getDocs(qAll);
        
        let hours = 0;
        let activeRecord = null;
        
        snapAll.forEach((doc) => {
          const data = doc.data();
          if (data.clockOut) {
            const inTime = new Date(`${data.date}T${data.clockIn}`);
            const outTime = new Date(`${data.date}T${data.clockOut}`);
            hours += (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
          } else if (!data.clockOut) {
            activeRecord = { id: doc.id, ...data };
          }
        });

        setTotalTodayHours(hours);

        if (activeRecord) {
          setIsClockedIn(true);
          setCurrentRecordId(activeRecord.id);
          setClockInTime(new Date(`${activeRecord.date}T${activeRecord.clockIn}`));
          setNotes(activeRecord.notes || "");
          setLinks(activeRecord.sharedLinks || []);
          setVisibility(activeRecord.visibility || "private");
          setTags(activeRecord.tags || []);
          setPartnerId(activeRecord.partnerId || "");
        }
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, [user]);

  useEffect(() => {
    if (user?.alarmEnabled && user?.dailyGoalHours && !alarmPlayed) {
      let currentSessionHours = 0;
      if (isClockedIn && clockInTime) {
        currentSessionHours = (currentTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      }
      
      const total = totalTodayHours + currentSessionHours;
      if (total >= user.dailyGoalHours) {
        // Play alarm
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(e => console.error("Error playing alarm:", e));
        setAlarmPlayed(true);
        showToast("Daily time goal reached!", "success");
      }
    }
  }, [currentTime, isClockedIn, clockInTime, totalTodayHours, user, alarmPlayed, showToast]);

  const handleClockIn = async () => {
    if (!user || !db) return;
    try {
      setLoading(true);
      const now = new Date();
      const newRecord = {
        userId: user.uid,
        date: format(now, "yyyy-MM-dd"),
        clockIn: format(now, "HH:mm:ss"),
        clockOut: null,
        notes: "",
        sharedLinks: [],
        visibility: "private",
        tags: [],
        partnerId: partnerId || null,
      };

      const dtrRef = collection(db, `users/${user.uid}/logs`);
      const docRef = await addDoc(dtrRef, newRecord);
      setCurrentRecordId(docRef.id);
      setIsClockedIn(true);
      setClockInTime(now);
      setTags([]);
      showToast("Successfully clocked in", "success");
    } catch (error: any) {
      console.error("Error clocking in:", error);
      showToast(error.message || "Failed to clock in", "error");
    } finally {
      setLoading(false);
    }
  };

  const initiateClockOut = () => {
    setClockOutCountdown(5);
    setShowClockOutModal(true);
  };

  const handleClockOutAction = async (action: "pause" | "stop") => {
    if (!user || !db || !currentRecordId) return;
    try {
      setLoading(true);
      const now = new Date();
      const recordRef = doc(db, `users/${user.uid}/logs`, currentRecordId);

      await updateDoc(recordRef, {
        clockOut: format(now, "HH:mm:ss"),
        notes,
        sharedLinks: links,
        visibility,
        tags,
        partnerId: partnerId || null,
      });

      if (clockInTime) {
        const sessionHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        setTotalTodayHours(prev => prev + sessionHours);
      }

      setIsClockedIn(false);
      setCurrentRecordId(null);
      setClockInTime(null);
      setNotes("");
      setLinks([]);
      setTags([]);
      setShowClockOutModal(false);
      showToast(`Successfully ${action === "pause" ? "paused" : "clocked out"}`, "success");
    } catch (error: any) {
      console.error("Error clocking out:", error);
      showToast(error.message || "Failed to clock out", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !db || !currentRecordId) return;

    if (notes.length > 0 && (notes.length < 15 || notes.length > 500)) {
      showToast("Notes must be between 15 and 500 characters.", "error");
      return;
    }

    try {
      const recordRef = doc(db, `users/${user.uid}/logs`, currentRecordId);
      await updateDoc(recordRef, { notes, sharedLinks: links, visibility, tags, partnerId: partnerId || null });
      showToast("Details saved successfully", "success");

      if (links.length > 0 && visibility === "shared") {
        // Notifications for shared resources can be implemented here if needed
      }
    } catch (error: any) {
      console.error("Error saving notes:", error);
      showToast(error.message || "Failed to save details", "error");
    }
  };

  const addLink = () => {
    if (!newLink) return;
    try {
      new URL(newLink); // Validate URL
      setLinks([...links, newLink]);
      setNewLink("");
      showToast("Link added", "success");
    } catch {
      showToast("Please enter a valid URL (e.g., https://example.com)", "error");
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim() !== '') {
      e.preventDefault();
      const newTag = customTag.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCustomTag("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
          Daily Time Record
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
          Track your attendance and activities.
        </p>
      </header>

      {user?.scheduleStart && user?.scheduleEnd && (
        <Card className="p-4 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Today's Schedule</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{user.scheduleStart} - {user.scheduleEnd}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Daily Goal</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{user.dailyGoalHours} hours</p>
          </div>
        </Card>
      )}

      <Card className="text-center p-8 md:p-12 relative overflow-hidden border-white/40 dark:border-white/10">
        {/* Animated background pulse when clocked in */}
        <AnimatePresence>
          {isClockedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center">
          {user?.clockType === "analog" ? (
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-8 bg-white dark:bg-zinc-900 shadow-inner mx-auto">
              {/* Clock face markers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full h-full flex justify-center"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                >
                  <div className="w-1 h-3 mt-2 bg-zinc-300 dark:bg-zinc-700" />
                </div>
              ))}
              {/* Hour hand */}
              <div
                className="absolute w-1.5 h-16 md:h-20 bg-zinc-900 dark:bg-zinc-100 rounded-full origin-bottom"
                style={{
                  bottom: "50%",
                  left: "calc(50% - 3px)",
                  transform: `rotate(${
                    (currentTime.getHours() % 12) * 30 +
                    currentTime.getMinutes() * 0.5
                  }deg)`,
                }}
              />
              {/* Minute hand */}
              <div
                className="absolute w-1 h-20 md:h-28 bg-zinc-600 dark:bg-zinc-400 rounded-full origin-bottom"
                style={{
                  bottom: "50%",
                  left: "calc(50% - 2px)",
                  transform: `rotate(${
                    currentTime.getMinutes() * 6 + currentTime.getSeconds() * 0.1
                  }deg)`,
                }}
              />
              {/* Second hand */}
              <div
                className="absolute w-0.5 h-24 md:h-32 bg-red-500 rounded-full origin-bottom"
                style={{
                  bottom: "50%",
                  left: "calc(50% - 1px)",
                  transform: `rotate(${
                    currentTime.getSeconds() * 6
                  }deg)`,
                }}
              />
              {/* Center dot */}
              <div className="absolute w-3 h-3 bg-red-500 rounded-full z-10" style={{ top: "calc(50% - 6px)", left: "calc(50% - 6px)" }} />
            </div>
          ) : (
            <div className="text-6xl md:text-8xl font-mono font-light tracking-tighter mb-2 text-zinc-900 dark:text-zinc-100">
              {format(
                currentTime,
                user?.timeFormat === "12h" ? "hh:mm" : "HH:mm",
              )}
              <span className="text-2xl md:text-4xl text-zinc-400 ml-2">
                {format(
                  currentTime,
                  user?.timeFormat === "12h" ? "ss a" : "ss",
                )}
              </span>
            </div>
          )}
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 font-medium tracking-wide">
            {format(currentTime, "EEEE, MMMM do, yyyy")}
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button
              onClick={isClockedIn ? initiateClockOut : handleClockIn}
              disabled={loading}
              className={`
                relative group flex items-center justify-center w-48 h-48 rounded-full shadow-lg transition-all duration-300
                ${
                  isClockedIn
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30"
                }
                disabled:opacity-50 disabled:pointer-events-none
              `}
            >
              <div className="absolute inset-2 rounded-full border-2 border-white/20" />
              <div className="flex flex-col items-center gap-3">
                {isClockedIn ? (
                  <>
                    <Square className="w-10 h-10 fill-current" />
                    <span className="text-xl font-bold tracking-wider uppercase">
                      Clock Out
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-10 h-10 fill-current ml-2" />
                    <span className="text-xl font-bold tracking-wider uppercase">
                      Clock In
                    </span>
                  </>
                )}
              </div>
            </button>
          </motion.div>
        </div>
      </Card>

      <AnimatePresence>
        {isClockedIn && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold">Activity Notes & Resources</h3>
              </div>
              
              <div className="space-y-6">
                {user?.partners && user.partners.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      Partner / Company
                    </label>
                    <select
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select a partner (Optional)</option>
                      {user.partners.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-zinc-400" />
                    Activity Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          tags.includes(tag) 
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-transparent'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {tags.filter(t => !availableTags.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        {tag} <X className="w-3 h-3 inline ml-1" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={addCustomTag}
                    placeholder="Add custom tag and press Enter..."
                    className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                    What are you working on today? (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your tasks and accomplishments..."
                    className="w-full h-32 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1 text-right">{notes.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700 dark:text-zinc-300">
                    Resource Links
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Paste URL (Canva, Docs, etc.)"
                      className="flex-1 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addLink()}
                    />
                    <Button onClick={addLink} variant="secondary" size="icon">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm truncate text-indigo-600 dark:text-indigo-400 hover:underline">
                            {link}
                          </a>
                        </div>
                        <button
                          onClick={() => removeLink(index)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveNotes} variant="primary">
                    Save Updates
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clock Out Confirmation Modal */}
      <AnimatePresence>
        {showClockOutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Clocking Out?
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you taking a break or finishing your day? You can pause your session to resume later, or stop completely.
                </p>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleClockOutAction("pause")}
                    variant="secondary"
                    className="w-full py-4 text-lg rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    Pause (Taking a break)
                  </Button>
                  
                  <Button
                    onClick={() => handleClockOutAction("stop")}
                    variant="primary"
                    disabled={clockOutCountdown > 0}
                    className="w-full py-4 text-lg rounded-2xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none disabled:opacity-50"
                  >
                    <Square className="w-5 h-5" />
                    {clockOutCountdown > 0 
                      ? `Stop for the day (${clockOutCountdown}s)` 
                      : "Stop for the day"}
                  </Button>
                  
                  <Button
                    onClick={() => setShowClockOutModal(false)}
                    variant="ghost"
                    className="w-full mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
