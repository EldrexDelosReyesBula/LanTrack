import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Circle, Plus, Calendar, User as UserIcon, Clock, Edit2, MessageSquare, AlertTriangle, Filter } from "lucide-react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { db } from "../lib/firebase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  visibility: "private" | "shared";
  createdAt: string;
}

export function Tasks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "in_progress" | "completed">("all");
  
  // Confirmation modal state
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: "medium" as "low" | "medium" | "high",
    visibility: "private" as "private" | "shared",
  });

  useEffect(() => {
    if (!user || !db) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const tasksRef = collection(db, `users/${user.uid}/tasks`);
        const q = query(tasksRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Task, 'id'>) } as Task));
        setTasks(fetchedTasks);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
        showToast(error.message || "Failed to load tasks", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (newTask.title.length < 3 || newTask.title.length > 50) {
      showToast("Title must be between 3 and 50 characters.", "error");
      return;
    }
    if (newTask.description.length < 15 || newTask.description.length > 2000) {
      showToast("Description must be between 15 and 2000 characters.", "error");
      return;
    }

    try {
      const tasksRef = collection(db, `users/${user.uid}/tasks`);

      if (editingTaskId) {
        const taskRef = doc(tasksRef, editingTaskId);
        await updateDoc(taskRef, {
          title: newTask.title,
          description: newTask.description,
          assignedTo: newTask.assignedTo,
          dueDate: newTask.dueDate,
          priority: newTask.priority,
          visibility: newTask.visibility,
        });
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...newTask } : t));
        showToast("Task updated successfully", "success");
      } else {
        const taskData = {
          ...newTask,
          assignedTo: user.uid,
          assignedBy: user.uid,
          status: "todo",
          createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(tasksRef, taskData);
        setTasks([{ id: docRef.id, ...taskData } as Task, ...tasks]);
        showToast("Task created successfully", "success");
      }
      
      setShowNewTask(false);
      setEditingTaskId(null);
      setNewTask({ title: "", description: "", assignedTo: "", dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), priority: "medium", visibility: "private" });
    } catch (error: any) {
      console.error("Error saving task:", error);
      showToast(error.message || "Failed to save task", "error");
    }
  };

  const handleEditClick = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      priority: task.priority,
      visibility: task.visibility,
    });
    setEditingTaskId(task.id);
    setShowNewTask(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!user || !db) return;
    
    if (newStatus === "completed") {
      setTaskToComplete(taskId);
      return;
    }

    await confirmUpdateStatus(taskId, newStatus);
  };

  const confirmUpdateStatus = async (taskId: string, newStatus: string) => {
    if (!user || !db) return;
    try {
      const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
      await updateDoc(taskRef, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
      showToast(`Task marked as ${newStatus.replace('_', ' ')}`, "success");
      setTaskToComplete(null);
    } catch (error: any) {
      console.error("Error updating task:", error);
      showToast(error.message || "Failed to update task", "error");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === "all") return true;
    return task.status === filterStatus;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400">
            Tasks & Schedules
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your assignments and daily goals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Button onClick={() => {
            setEditingTaskId(null);
            setNewTask({ title: "", description: "", assignedTo: "", dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), priority: "medium", visibility: "private" });
            setShowNewTask(true);
          }} className="gap-2">
            <Plus className="w-5 h-5" />
            New Task
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {showNewTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mb-8 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
              <h3 className="text-xl font-bold mb-4">{editingTaskId ? "Edit Task" : "Assign New Task"}</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                      required
                      type="text"
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5">Description (Markdown Supported)</label>
                    <textarea
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Use markdown for rich text (e.g., **bold**, *italic*, - list)"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 resize-none h-32 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Due Date & Time</label>
                    <input
                      required
                      type="datetime-local"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="ghost" onClick={() => {
                    setShowNewTask(false);
                    setEditingTaskId(null);
                  }}>Cancel</Button>
                  <Button type="submit">{editingTaskId ? "Save Changes" : "Create Task"}</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />)}
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`p-5 transition-all ${task.status === 'completed' ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/50' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className={`mt-1 text-sm font-medium rounded-lg px-2 py-1 border ${
                      task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                      task.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                      'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`text-lg font-bold ${task.status === 'completed' ? 'line-through text-zinc-500' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <div className="prose prose-sm dark:prose-invert mt-2 text-zinc-600 dark:text-zinc-400 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {task.description}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Due: {format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full capitalize ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No tasks found.</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Completion Confirmation Modal */}
      <AnimatePresence>
        {taskToComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Complete Task?</h3>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Are you sure you want to mark this task as completed?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setTaskToComplete(null)}>
                  Cancel
                </Button>
                <Button onClick={() => confirmUpdateStatus(taskToComplete, "completed")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
