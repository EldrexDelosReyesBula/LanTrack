import React, { useState, useEffect } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  Views,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
} from "lucide-react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  type: "admin" | "personal" | "task";
  status?: string;
}

export function Calendar() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  useEffect(() => {
    if (!user || !db) return;

    const fetchEvents = async () => {
      try {
        // Fetch tasks
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        const tasksQuery = query(tasksRef);
        const tasksSnap = await getDocs(tasksQuery);

        const taskEvents = tasksSnap.docs.map((doc) => {
          const data = doc.data() as any;
          const dueDate = new Date(data.dueDate);
          return {
            id: doc.id,
            title: `Task: ${data.title}`,
            start: dueDate,
            end: dueDate,
            allDay: true,
            type: "task" as const,
            status: data.status,
            resource: data,
          };
        });

        // Fetch schedules
        const schedulesRef = collection(db, `users/${user.uid}/schedules`);
        const schedulesQuery = query(schedulesRef);
        const schedulesSnap = await getDocs(schedulesQuery);

        const scheduleEvents = schedulesSnap.docs
          .map((doc) => {
            const data = doc.data() as any;
            const startDate = new Date(data.start);
            const endDate = new Date(data.end);
            return {
              id: doc.id,
              title: data.title,
              start: startDate,
              end: endDate,
              type: data.type as "admin" | "personal",
              resource: data,
            };
          });

        setEvents([...taskEvents, ...scheduleEvents]);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [user]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6"; // Blue for admin

    if (event.type === "personal") {
      backgroundColor = "#10b981"; // Green for personal
    } else if (event.type === "task") {
      if (event.status === "completed") {
        backgroundColor = "#9ca3af"; // Gray for completed tasks
      } else {
        backgroundColor = "#f59e0b"; // Orange for pending tasks
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        padding: "2px 6px",
        fontSize: "0.85rem",
        fontWeight: 500,
      },
    };
  };

  const onEventDrop = async ({ event, start, end }: any) => {
    if (!user || !db) return;

    try {
      if (event.type === "task") {
        const taskRef = doc(db, `users/${user.uid}/tasks`, event.id);
        await updateDoc(taskRef, { dueDate: format(start, "yyyy-MM-dd") });
      } else {
        const scheduleRef = doc(db, `users/${user.uid}/schedules`, event.id);
        await updateDoc(scheduleRef, {
          start: start.toISOString(),
          end: end.toISOString(),
        });
      }

      setEvents(
        events.map((e) => (e.id === event.id ? { ...e, start, end } : e)),
      );
      showToast("Event rescheduled", "success");
    } catch (error: any) {
      console.error("Error updating event:", error);
      showToast("Failed to reschedule event", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
            Calendar
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your schedule and upcoming tasks.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Admin
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 ml-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Personal
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 ml-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div> Task
          </div>
        </div>
      </header>

      <Card className="p-4 md:p-6 min-h-[600px] bg-white dark:bg-zinc-900">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
          onEventDrop={onEventDrop}
          resizable={false}
          className="font-sans dark:text-zinc-300"
        />
      </Card>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
            >
              <div
                className={`p-6 text-white ${
                  selectedEvent.type === "admin"
                    ? "bg-blue-500"
                    : selectedEvent.type === "personal"
                      ? "bg-emerald-500"
                      : selectedEvent.status === "completed"
                        ? "bg-zinc-500"
                        : "bg-amber-500"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="uppercase tracking-wider text-xs font-bold opacity-80">
                    {selectedEvent.type} Event
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                  <CalendarIcon className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm">
                      {format(selectedEvent.start, "PPP")}
                    </p>
                  </div>
                </div>

                {!selectedEvent.allDay && (
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <Clock className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm">
                        {format(selectedEvent.start, "p")} -{" "}
                        {format(selectedEvent.end, "p")}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.resource?.description && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      Description
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedEvent.resource.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
