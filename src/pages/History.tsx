import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Filter,
  Download,
  Clock,
  Link as LinkIcon,
  Search,
  X,
  Users,
  MoreVertical,
  FileText,
  Table,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { format, parseISO, isWithinInterval } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { db } from "../lib/firebase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface DTRRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  notes: string;
  sharedLinks: string[];
  visibility?: "private" | "shared";
  userId: string;
}

export function History() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<DTRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchNotes, setSearchNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Export menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const fetchData = async () => {
      try {
        const dtrRef = collection(db, `users/${user.uid}/logs`);
        const q = query(
          dtrRef,
          where("userId", "==", user.uid),
          orderBy("date", "desc"),
        );

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => {
          const recordData = doc.data() as any;
          return {
            id: doc.id,
            ...recordData,
          };
        }) as DTRRecord[];

        setRecords(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredRecords = records.filter((record) => {
    // Notes search
    if (
      searchNotes &&
      !record.notes?.toLowerCase().includes(searchNotes.toLowerCase())
    )
      return false;

    // Date range
    if (startDate && endDate) {
      const recordDate = parseISO(record.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      if (!isWithinInterval(recordDate, { start, end })) return false;
    } else if (startDate) {
      if (record.date < startDate) return false;
    } else if (endDate) {
      if (record.date > endDate) return false;
    }

    return true;
  });

  const calculateHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return "Ongoing";
    const inTime = parseISO(`2000-01-01T${clockIn}`);
    const outTime = parseISO(`2000-01-01T${clockOut}`);
    const diff = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
    return `${Math.round(diff * 10) / 10}h`;
  };

  const clearFilters = () => {
    setSearchNotes("");
    setStartDate("");
    setEndDate("");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("DTR Logs", 14, 15);

    const tableColumn = [
      "Date",
      "Clock In",
      "Clock Out",
      "Total Hours",
      "Notes",
    ];
    const tableRows = filteredRecords.map((record) => [
      record.date,
      record.clockIn,
      record.clockOut || "Ongoing",
      calculateHours(record.clockIn, record.clockOut),
      record.notes || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("dtr_logs.pdf");
    setShowExportMenu(false);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRecords.map((record) => ({
        Date: record.date,
        "Clock In": record.clockIn,
        "Clock Out": record.clockOut || "Ongoing",
        "Total Hours": calculateHours(record.clockIn, record.clockOut),
        Notes: record.notes || "",
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DTR Logs");
    XLSX.writeFile(workbook, "dtr_logs.xlsx");
    setShowExportMenu(false);
  };

  const exportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredRecords.map((record) => ({
        Date: record.date,
        "Clock In": record.clockIn,
        "Clock Out": record.clockOut || "Ongoing",
        "Total Hours": calculateHours(record.clockIn, record.clockOut),
        Notes: record.notes || "",
      })),
    );
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dtr_logs.csv";
    link.click();
    setShowExportMenu(false);
  };

  const printLogs = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Attendance History
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Review your past records and activities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Button
            variant={showFilters ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          
          <div className="relative" ref={exportMenuRef}>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="rounded-full"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    <button
                      onClick={exportPDF}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      Export as PDF
                    </button>
                    <button
                      onClick={exportExcel}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                    >
                      <Table className="w-4 h-4 text-emerald-500" />
                      Export as Excel
                    </button>
                    <button
                      onClick={exportCSV}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                      Export as CSV
                    </button>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                    <button
                      onClick={printLogs}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 text-zinc-500" />
                      Print
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-6 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Search Notes
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchNotes}
                      onChange={(e) => setSearchNotes(e.target.value)}
                      placeholder="e.g., React project"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-32" />
            ))}
          </div>
        ) : filteredRecords.length > 0 ? (
          filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-0 overflow-hidden group">
                <div className="flex flex-col md:flex-row">
                  {/* Date Column */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 md:w-48 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">
                        {format(parseISO(record.date), "MMM")}
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {format(parseISO(record.date), "dd")}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {format(parseISO(record.date), "EEEE")}
                    </span>
                  </div>

                  {/* Details Column */}
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                            Clock In
                          </p>
                          <p className="text-lg font-mono font-medium">
                            {record.clockIn}
                          </p>
                        </div>
                        <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-700" />
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                            Clock Out
                          </p>
                          <p className="text-lg font-mono font-medium">
                            {record.clockOut || "--:--"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                            Total
                          </p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {calculateHours(record.clockIn, record.clockOut)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {record.notes && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
                        {record.notes}
                      </p>
                    )}

                    {record.sharedLinks && record.sharedLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {record.sharedLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {new URL(link).hostname}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
