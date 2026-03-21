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
import { BottomSheet } from "../components/ui/BottomSheet";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Plus,
  Type,
  AlignLeft,
  Link as LinkIcon,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: "personal" as "admin" | "personal",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    if (!user || !db) return;
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

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setIsSubmitting(true);
    try {
      const schedulesRef = collection(db, `users/${user.uid}/schedules`);
      await addDoc(schedulesRef, {
        ...newEvent,
        createdAt: new Date().toISOString(),
      });

      showToast("Event added successfully", "success");
      setIsAddModalOpen(false);
      setNewEvent({
        title: "",
        description: "",
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        type: "personal",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error adding event:", error);
      showToast("Failed to add event", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full shadow-lg shadow-indigo-500/20 gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </Button>
          <div className="hidden md:flex gap-2">
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
        </div>
      </header>

      <Card className="p-4 md:p-6 min-h-[600px] bg-white dark:bg-zinc-900 rounded-3xl border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none">
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

      {/* Event Details Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || "Event Details"}
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-3xl text-white shadow-lg ${
                selectedEvent.type === "admin"
                  ? "bg-blue-500 shadow-blue-500/20"
                  : selectedEvent.type === "personal"
                    ? "bg-emerald-500 shadow-emerald-500/20"
                    : selectedEvent.status === "completed"
                      ? "bg-zinc-500 shadow-zinc-500/20"
                      : "bg-amber-500 shadow-amber-500/20"
              }`}
            >
              <div className="uppercase tracking-widest text-[10px] font-black opacity-80 mb-2">
                {selectedEvent.type} Event
              </div>
              <h2 className="text-2xl font-black tracking-tight">{selectedEvent.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Date</p>
                    <p className="text-sm font-bold">{format(selectedEvent.start, "PPP")}</p>
                  </div>
                </div>

                {!selectedEvent.allDay && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Time</p>
                      <p className="text-sm font-bold">
                        {format(selectedEvent.start, "p")} - {format(selectedEvent.end, "p")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedEvent.resource?.assignedTo && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                      <UserIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Assigned To</p>
                      <p className="text-sm font-bold">{selectedEvent.resource.assignedTo}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.resource?.links && selectedEvent.resource.links.length > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                      <LinkIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Resources</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEvent.resource.links.map((link: string, i: number) => (
                          <a 
                            key={i} 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            Link {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.resource?.description && (
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-4">Description</p>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      a: ({ node, ...props }) => <a className="text-indigo-600 hover:underline" {...props} />,
                    }}
                  >
                    {selectedEvent.resource.description}
                  </Markdown>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="w-full h-14 rounded-2xl font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Add Event Bottom Sheet */}
      <BottomSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Event"
      >
        <form onSubmit={handleAddEvent} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Event Title</label>
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold"
                  placeholder="Meeting with Supervisor"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Start Date & Time</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">End Date & Time</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="w-full h-14 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Event Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, type: "personal" })}
                  className={`h-14 rounded-2xl font-bold border-2 transition-all ${
                    newEvent.type === "personal"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20"
                      : "bg-zinc-50 border-transparent text-zinc-500 dark:bg-zinc-900"
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, type: "admin" })}
                  className={`h-14 rounded-2xl font-bold border-2 transition-all ${
                    newEvent.type === "admin"
                      ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20"
                      : "bg-zinc-50 border-transparent text-zinc-500 dark:bg-zinc-900"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-1">Description</label>
              <div className="relative group">
                <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full min-h-[120px] pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all font-medium resize-none"
                  placeholder="Add some details..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 h-14 rounded-2xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-indigo-500/20"
            >
              Create Event
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
