import { create } from "zustand";
import { Task, getLocalDateString } from "@/lib/habit-utils";

interface TaskState {
  tasks: Task[];
  isSyncing: boolean;
  dbConnected: boolean;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (title: string, date: string) => Promise<void>;
  updateTask: (id: string, title: string, date: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = "habit_tracker_tasks";

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isSyncing: false,
  dbConnected: false,

  fetchTasks: async () => {
    // 1. Instantly load from localStorage
    let localTasks: Task[] = [];
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          localTasks = JSON.parse(localData);
        } catch (e) {
          console.error("Failed to parse local tasks:", e);
        }
      }
    }

    set({ tasks: localTasks, isSyncing: true });

    // 2. Sync from DB in background
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks from API");
      const data = await response.json();

      if (data.dbConnected) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.tasks));
        }
        set({ tasks: data.tasks, dbConnected: true, isSyncing: false });
      } else {
        throw new Error("MongoDB not connected on server");
      }
    } catch (error) {
      console.warn("Tasks API sync failed. Using offline cached data:", error);
      set({ dbConnected: false, isSyncing: false });
    }
  },

  addTask: async (title, date) => {
    const { dbConnected } = get();

    if (dbConnected) {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, date }),
        });
        if (!response.ok) throw new Error("Failed to create task");
        const data = await response.json();
        set((state) => ({ tasks: [...state.tasks, data.task] }));
      } catch (error) {
        console.error("Error creating task, falling back to local:", error);
        // Fallthrough to local
        set((state) => {
          const newTask: Task = {
            _id: `local_${Date.now()}`,
            title,
            date,
            completed: false,
            createdAt: getLocalDateString(),
          };
          const updated = [...state.tasks, newTask];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          return { tasks: updated };
        });
      }
    } else {
      set((state) => {
        const newTask: Task = {
          _id: `local_${Date.now()}`,
          title,
          date,
          completed: false,
          createdAt: getLocalDateString(),
        };
        const updated = [...state.tasks, newTask];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { tasks: updated };
      });
    }
  },

  updateTask: async (id, title, date) => {
    const { dbConnected } = get();

    if (dbConnected && !id.startsWith("local_")) {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, date }),
        });
        if (!response.ok) throw new Error("Failed to update task");
        const data = await response.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t._id === id ? data.task : t)),
        }));
      } catch (error) {
        console.error("Error updating task:", error);
      }
    } else {
      set((state) => {
        const updated = state.tasks.map((t) =>
          t._id === id ? { ...t, title, date } : t
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { tasks: updated };
      });
    }
  },

  deleteTask: async (id) => {
    const { dbConnected } = get();

    if (dbConnected && !id.startsWith("local_")) {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete task");
        set((state) => ({
          tasks: state.tasks.filter((t) => t._id !== id),
        }));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    } else {
      set((state) => {
        const updated = state.tasks.filter((t) => t._id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { tasks: updated };
      });
    }
  },

  toggleTaskCompletion: async (id) => {
    const { dbConnected } = get();
    const task = get().tasks.find((t) => t._id === id);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === id ? { ...t, completed: newCompleted } : t
      ),
    }));

    if (dbConnected && !id.startsWith("local_")) {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: newCompleted }),
        });
        if (!response.ok) throw new Error("Failed to toggle task");
        const data = await response.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t._id === id ? data.task : t)),
        }));
      } catch (error) {
        console.error("Error toggling task, reverting:", error);
        // Revert on error
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t._id === id ? { ...t, completed: !newCompleted } : t
          ),
        }));
      }
    } else {
      // Persist local change
      const updated = get().tasks;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  },

  clearAllTasks: async () => {
    const { dbConnected } = get();
    if (dbConnected) {
      try {
        const response = await fetch("/api/tasks", { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to clear tasks");
      } catch (error) {
        console.error("Error clearing tasks from database:", error);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    set({ tasks: [] });
  },
}));
