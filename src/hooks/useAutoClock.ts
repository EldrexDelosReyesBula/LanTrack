import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { format, subDays, isBefore, startOfWeek, endOfWeek, parseISO } from "date-fns";

export function useAutoClock() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !db || !user.autoClockEnabled) return;

    const runAutoClock = async () => {
      try {
        const lastRunRef = doc(db, `users/${user.uid}/settings`, "autoClock");
        const lastRunSnap = await getDoc(lastRunRef);
        const lastRunDate = lastRunSnap.exists() ? lastRunSnap.data().lastRun : null;
        
        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");
        
        if (lastRunDate === todayStr) return; // Already ran today

        const logsRef = collection(db, `users/${user.uid}/logs`);
        
        // Fetch all logs for the past 14 days to check weekly goals
        const fourteenDaysAgo = format(subDays(today, 14), "yyyy-MM-dd");
        const qAll = query(logsRef, where("date", ">=", fourteenDaysAgo));
        const snapAll = await getDocs(qAll);
        const recentLogs = snapAll.docs.map(d => d.data());

        // Check past 7 days for missing logs
        for (let i = 7; i >= 0; i--) {
          const checkDate = subDays(today, i);
          const checkDateStr = format(checkDate, "yyyy-MM-dd");
          const dayOfWeek = checkDate.getDay();

          // Check if auto clock is enabled for this day
          const activeDays = user.autoClockDays || [1, 2, 3, 4, 5]; // Default Mon-Fri
          if (!activeDays.includes(dayOfWeek)) continue;

          // Check if this day is a holiday
          const holidays = user.holidays || [];
          if (holidays.includes(checkDateStr)) continue;

          // Check if log already exists for this day
          const existingLogDoc = snapAll.docs.find(d => d.data().date === checkDateStr);
          const existingLog = existingLogDoc?.data();

          const clockInTime = user.autoClockIn || "09:00";
          const clockOutTime = user.autoClockOut || "17:00";
          const clockInDateTime = new Date(`${checkDateStr}T${clockInTime}`);
          const clockOutDateTime = new Date(`${checkDateStr}T${clockOutTime}`);

          if (!existingLog) {
            // Check if weekly goal is met for the week of checkDate
            const weekStart = startOfWeek(checkDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(checkDate, { weekStartsOn: 1 });
            
            const weekLogs = recentLogs.filter(log => {
              const logDate = parseISO(log.date);
              return logDate >= weekStart && logDate <= weekEnd;
            });
            
            let weekHours = 0;
            weekLogs.forEach(log => {
              if (log.clockIn && log.clockOut) {
                const inTime = new Date(`${log.date}T${log.clockIn}`);
                const outTime = new Date(`${log.date}T${log.clockOut}`);
                weekHours += (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
              }
            });

            if (user.weeklyGoalHours && weekHours >= user.weeklyGoalHours) {
              continue; // Weekly goal met, skip auto clock
            }

            // Create auto log if clock in time has passed
            if (isBefore(clockInDateTime, new Date())) {
              const hasClockedOut = isBefore(clockOutDateTime, new Date());
              
              await addDoc(logsRef, {
                userId: user.uid,
                date: checkDateStr,
                clockIn: clockInTime,
                clockOut: hasClockedOut ? clockOutTime : null,
                notes: "Auto-generated log",
                tags: ["Auto"],
                visibility: "private",
                createdAt: new Date().toISOString(),
                isAuto: true
              });
              
              // Add to recentLogs so subsequent days in the loop know about it
              recentLogs.push({
                userId: user.uid,
                date: checkDateStr,
                clockIn: clockInTime,
                clockOut: hasClockedOut ? clockOutTime : null
              });
            }
          } else if (!existingLog.clockOut && isBefore(clockOutDateTime, new Date())) {
            // Update existing log to clock out
            await setDoc(doc(db, `users/${user.uid}/logs`, existingLogDoc!.id), {
              clockOut: clockOutTime,
              isAutoOut: true
            }, { merge: true });
            
            // Update recentLogs
            const logToUpdate = recentLogs.find(l => l.date === checkDateStr);
            if (logToUpdate) {
              logToUpdate.clockOut = clockOutTime;
            }
          }
        }

        await setDoc(lastRunRef, { lastRun: todayStr }, { merge: true });
      } catch (error) {
        console.error("Error running auto clock:", error);
      }
    };

    runAutoClock();
  }, [user]);
}
