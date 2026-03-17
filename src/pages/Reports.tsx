import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileBarChart, Download, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";

export function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("this-week");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    daysPresent: 0,
    lateLogs: 0,
    resourcesShared: 0
  });

  useEffect(() => {
    if (!user || !db) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const dtrRef = collection(db, `users/${user.uid}/logs`);
        const q = query(
          dtrRef,
          orderBy("date", "desc")
        );

        const snap = await getDocs(q);
        const records = snap.docs.map(doc => doc.data());

        // Process data for charts (last 7 days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), i);
          return format(d, 'yyyy-MM-dd');
        }).reverse();

        const newChartData = last7Days.map(dateStr => {
          const dayRecords = records.filter(r => r.date === dateStr);
          let hours = 0;
          dayRecords.forEach(r => {
            if (r.clockIn && r.clockOut) {
              const inTime = parseISO(`2000-01-01T${r.clockIn}`);
              const outTime = parseISO(`2000-01-01T${r.clockOut}`);
              hours += (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
            }
          });
          return {
            name: format(parseISO(dateStr), 'EEE'),
            hours: Math.round(hours * 10) / 10
          };
        });

        setChartData(newChartData);

        // Calculate stats
        let tHours = 0;
        let dPresent = new Set();
        let lLogs = 0;
        let rShared = 0;

        records.forEach(r => {
          dPresent.add(r.date);
          if (r.clockIn && r.clockOut) {
            const inTime = parseISO(`2000-01-01T${r.clockIn}`);
            const outTime = parseISO(`2000-01-01T${r.clockOut}`);
            tHours += (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
          }
          if (r.clockIn && r.clockIn > "09:00:00") {
            lLogs++;
          }
          if (r.sharedLinks) {
            rShared += r.sharedLinks.length;
          }
        });

        setStats({
          totalHours: Math.round(tHours * 10) / 10,
          daysPresent: dPresent.size,
          lateLogs: lLogs,
          resourcesShared: rShared
        });

      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user, dateRange]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Analytics & Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View your performance and export data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium outline-none"
          >
            <option value="this-week">Last 7 Days</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="all-time">All Time</option>
          </select>
          <Button variant="primary" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Hours", value: `${stats.totalHours}h`, trend: "+12% vs last period" },
          { label: "Days Present", value: stats.daysPresent.toString(), trend: "Consistent" },
          { label: "Late Logs", value: stats.lateLogs.toString(), trend: "-1 vs last period" },
          { label: "Resources Shared", value: stats.resourcesShared.toString(), trend: "Active contributor" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold mb-2">{loading ? "-" : stat.value}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {stat.trend}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Hours Logged (Last 7 Days)</h3>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Productivity Trend</h3>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
