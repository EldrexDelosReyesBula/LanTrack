import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Calendar,
  CheckCircle,
  Link as LinkIcon,
  ArrowRight,
  CheckSquare,
  Calendar as CalendarIcon,
  Flame,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, differenceInDays } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { db } from "../lib/firebase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { MobileStackedCards } from "../components/MobileStackedCards";
import { Link } from "react-router-dom";

interface DashboardStats {
  todayHours: number;
  weekHours: number;
  pendingApprovals: number;
  upcomingTasks: any[];
  upcomingSchedules: any[];
  dailyGoal: number;
  weeklyGoal: number;
  streak: number;
  lastActive: Date | null;
}

export function Dashboard() {
  const { user } = useAuth();
  const { permission, requestPermission } = useNotification();
  const [stats, setStats] = useState<DashboardStats>({
    todayHours: 0,
    weekHours: 0,
    pendingApprovals: 0,
    upcomingTasks: [],
    upcomingSchedules: [],
    dailyGoal: 8,
    weeklyGoal: 40,
    streak: 0,
    lastActive: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const fetchStats = async () => {
      try {
        const now = new Date();
        const startOfToday = startOfDay(now);
        const endOfToday = endOfDay(now);
        const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
        const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 });

        const dtrRef = collection(db, `users/${user.uid}/logs`);

        // Fetch today's records
        const todayQuery = query(
          dtrRef,
          where("userId", "==", user.uid),
          where("date", ">=", format(startOfToday, "yyyy-MM-dd")),
          where("date", "<=", format(endOfToday, "yyyy-MM-dd")),
        );
        const todaySnap = await getDocs(todayQuery);

        let todayHours = 0;
        todaySnap.forEach((doc) => {
          const data = doc.data();
          if (data.clockIn && data.clockOut) {
            const inTime = new Date(`${data.date}T${data.clockIn}`);
            const outTime = new Date(`${data.date}T${data.clockOut}`);
            todayHours +=
              (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
          }
        });

        // Fetch week's records
        const weekQuery = query(
          dtrRef,
          where("userId", "==", user.uid),
          where("date", ">=", format(startOfWeekDate, "yyyy-MM-dd")),
          where("date", "<=", format(endOfWeekDate, "yyyy-MM-dd")),
        );
        const weekSnap = await getDocs(weekQuery);

        let weekHours = 0;
        let pending = 0;

        weekSnap.forEach((doc) => {
          const data = doc.data();
          if (data.clockIn && data.clockOut) {
            const inTime = new Date(`${data.date}T${data.clockIn}`);
            const outTime = new Date(`${data.date}T${data.clockOut}`);
            weekHours +=
              (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
          }
          if (data.status === "pending" && data.clockOut !== null) {
             pending++;
          }
        });

        // Calculate Streak
        const recentLogsQuery = query(
          dtrRef,
          where("userId", "==", user.uid),
          orderBy("date", "desc"),
          limit(30)
        );
        const recentLogsSnap = await getDocs(recentLogsQuery);
        
        let currentStreak = 0;
        let lastActiveDate: Date | null = null;
        
        if (!recentLogsSnap.empty) {
          const dates = recentLogsSnap.docs.map(doc => new Date(doc.data().date));
          // Sort descending
          dates.sort((a, b) => b.getTime() - a.getTime());
          
          lastActiveDate = dates[0];
          
          // Check if active today or yesterday to maintain streak
          const daysSinceLastActive = differenceInDays(startOfDay(now), startOfDay(lastActiveDate));
          
          if (daysSinceLastActive <= 1) {
            currentStreak = 1;
            let checkDate = startOfDay(lastActiveDate);
            
            for (let i = 1; i < dates.length; i++) {
              const prevDate = startOfDay(dates[i]);
              const diff = differenceInDays(checkDate, prevDate);
              
              if (diff === 1) {
                currentStreak++;
                checkDate = prevDate;
              } else if (diff === 0) {
                // Same day, ignore
              } else {
                // Streak broken
                break;
              }
            }
          }
        }

        // Fetch upcoming tasks
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        
        const tasksQuery = query(
          tasksRef,
          where("status", "in", ["todo", "in_progress"])
        );
        const tasksSnap = await getDocs(tasksQuery);
        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch upcoming schedules
        const schedulesRef = collection(db, `users/${user.uid}/schedules`);
        
        const schedulesQuery = query(
          schedulesRef,
          where("date", ">=", format(startOfToday, "yyyy-MM-dd"))
        );
        const schedulesSnap = await getDocs(schedulesQuery);
        const schedules = schedulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setStats({
          todayHours: Math.round(todayHours * 10) / 10,
          weekHours: Math.round(weekHours * 10) / 10,
          pendingApprovals: pending,
          upcomingTasks: tasks.slice(0, 3),
          upcomingSchedules: schedules.slice(0, 3),
          dailyGoal: user.dailyGoalHours || 8,
          weeklyGoal: user.weeklyGoalHours || 40,
          streak: currentStreak,
          lastActive: lastActiveDate,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: "Today's Hours",
      value: `${stats.todayHours}h`,
      subValue: `of ${stats.dailyGoal}h goal`,
      progress: Math.min((stats.todayHours / stats.dailyGoal) * 100, 100),
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      progressColor: "bg-blue-500",
    },
    {
      title: "This Week",
      value: `${stats.weekHours}h`,
      subValue: `of ${stats.weeklyGoal}h goal`,
      progress: Math.min((stats.weekHours / stats.weeklyGoal) * 100, 100),
      icon: Calendar,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      progressColor: "bg-indigo-500",
    },
    {
      title: "Activity Streak",
      value: `${stats.streak} Days`,
      subValue: stats.streak > 0 ? "Keep the momentum going!" : "Start your streak today!",
      progress: Math.min((stats.streak / 7) * 100, 100), // Visual progress towards a 7-day streak
      icon: Flame,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-500/10 dark:bg-orange-500/20",
      progressColor: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {permission === "default" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Enable Notifications</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">Get alerts for upcoming sessions, tasks, and announcements.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={requestPermission}>Enable</Button>
          </div>
        </motion.div>
      )}

      <header className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400"
          >
            Welcome back, {user?.displayName?.split(" ")[0] || "User"}
          </motion.h1>
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium capitalize">
            Personal
          </span>
        </div>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-zinc-500 dark:text-zinc-400 font-medium"
        >
          Personal Workspace
        </motion.p>
      </header>

      {/* Duolingo-style Streak Visualization */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center relative z-10">
            <Flame className={`w-12 h-12 ${stats.streak > 0 ? 'text-orange-500' : 'text-zinc-400'} ${stats.streak > 0 ? 'animate-pulse' : ''}`} />
          </div>
          {stats.streak > 0 && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl z-0"
            />
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center md:justify-start gap-2">
                {stats.streak} Day Streak
                {stats.streak > 0 && <span className="text-xl">🔥</span>}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                {stats.streak === 0 
                  ? "Start your streak today by clocking in!" 
                  : stats.streak < 3 
                    ? "Great start! Keep it up!" 
                    : stats.streak < 7 
                      ? "You're on fire! Don't stop now!" 
                      : "Unstoppable! You're a productivity machine!"}
              </p>
            </div>
            <div className="text-sm font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full inline-block self-center md:self-end">
              Goal: 7 Days
            </div>
          </div>
          
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.streak / 7) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/30 rounded-full" />
            </motion.div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-zinc-400">
            <span>0</span>
            <span>7 Days</span>
          </div>
        </div>
      </motion.div>

      {/* Gamified Insight Banner */}
      {!loading && stats.lastActive && differenceInDays(startOfDay(new Date()), startOfDay(stats.lastActive)) > 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 p-4 rounded-2xl flex items-start gap-4 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0 z-10">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="z-10">
            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-1">
              We missed you!
            </h3>
            <p className="text-orange-800 dark:text-orange-200 text-sm leading-relaxed">
              It looks like you haven't checked in for a few days. Don't worry, every day is a new opportunity to build your streak. Let's get back on track!
            </p>
          </div>
        </motion.div>
      )}

      {/* Mobile Stacked Cards */}
      <div className="md:hidden mb-12">
        <MobileStackedCards
          cards={statCards.map((stat, index) => (
            <Card key={stat.title} className="flex flex-col p-6 h-48 border-white/40 dark:border-white/10 shadow-xl relative overflow-hidden bg-white dark:bg-zinc-900">
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 ${stat.bg} ${stat.color} shadow-inner`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {loading ? "-" : stat.value}
                  </h3>
                </div>
              </div>
              
              {stat.progress > 0 && (
                <div className="mt-auto pt-2">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium">
                    <span>Progress</span>
                    <span>{Math.round(stat.progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.progressColor}`} style={{ width: `${stat.progress}%` }} />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                    {stat.subValue}
                  </p>
                </div>
              )}
            </Card>
          ))}
        />
        <p className="text-center text-xs text-zinc-400 mt-4 animate-pulse">Tap to cycle cards</p>
      </div>

      {/* Desktop Grid Cards */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ y: -5 }}
          >
            <Card className="flex flex-col p-6 h-full border-white/40 dark:border-white/10 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 ${stat.bg} ${stat.color} shadow-inner`}
                >
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {loading ? "-" : stat.value}
                  </h3>
                </div>
              </div>
              
              {stat.progress > 0 && (
                <div className="mt-auto pt-2">
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium">
                    <span>Progress</span>
                    <span>{Math.round(stat.progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.5, type: "spring" }}
                      className={`h-full rounded-full ${stat.progressColor}`}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                    {stat.subValue}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full flex flex-col border-white/40 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Quick Actions</h3>
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <Link to="/dtr" className="block">
                <Button
                  className="w-full justify-between group py-8 text-lg rounded-3xl"
                  variant="primary"
                >
                  <span className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Clock className="w-6 h-6" />
                    </div>
                    Clock In / Out
                  </span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link to="/history" className="block">
                <Button
                  className="w-full justify-between group py-8 text-lg rounded-3xl"
                  variant="secondary"
                >
                  <span className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-600/10 dark:bg-indigo-400/20 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    View History
                  </span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full border-white/40 dark:border-white/10 flex flex-col p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold tracking-tight">Tasks & Agenda</h3>
              <Link
                to="/tasks"
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl"
                  />
                ))}
              </div>
            ) : stats.upcomingTasks.length > 0 || stats.upcomingSchedules.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stats.upcomingTasks.map((task, i) => (
                  <motion.div
                    key={`task-${i}`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {task.title}
                      </p>
                      <p className="text-sm text-zinc-500 truncate font-medium capitalize">{task.status.replace('_', ' ')}</p>
                    </div>
                  </motion.div>
                ))}
                {stats.upcomingSchedules.map((schedule, i) => (
                  <motion.div
                    key={`schedule-${i}`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/50 shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {schedule.title}
                      </p>
                      <p className="text-sm text-zinc-500 truncate font-medium">{schedule.date} {schedule.startTime && `- ${schedule.startTime}`}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-medium">No upcoming tasks or agenda.</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
