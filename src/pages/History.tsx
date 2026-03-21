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
  Printer,
  Trash2,
  AlertTriangle
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
  deleteDoc,
  writeBatch,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

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

  const handleDeleteRecord = async (id: string) => {
    if (!user || !db) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/logs`, id));
      setRecords(records.filter((r) => r.id !== id));
      showToast("Record deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("Failed to delete record", "error");
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  const handleClearAllHistory = async () => {
    if (!user || !db) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      records.forEach((record) => {
        const ref = doc(db, `users/${user.uid}/logs`, record.id);
        batch.delete(ref);
      });
      await batch.commit();
      setRecords([]);
      showToast("All history cleared", "success");
    } catch (error) {
      console.error("Error clearing history:", error);
      showToast("Failed to clear history", "error");
    } finally {
      setIsDeleting(false);
      setShowClearAllConfirm(false);
    }
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
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                    <button
                      onClick={() => setShowClearAllConfirm(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All History
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {recordToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Record?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                This action cannot be undone. This record will be permanently removed from your history.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setRecordToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
                  onClick={() => handleDeleteRecord(recordToDelete)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {showClearAllConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clear All History?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                Are you sure you want to delete ALL your attendance records? This action is permanent and cannot be reversed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
                  onClick={handleClearAllHistory}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Clearing..." : "Clear All"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                        <button
                          onClick={() => setRecordToDelete(record.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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
