import { create } from "zustand";
import { Habit, getLocalDateString } from "@/lib/habit-utils";

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  isSyncing: boolean;
  dbConnected: boolean;
  selectedDate: string;
  viewMode: "daily" | "weekly" | "monthly";
  activeTab: "daily" | "weekly" | "monthly" | "settings" | "insights";
  
  // Actions
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, description: string, skipDays: number[]) => Promise<void>;
  updateHabit: (id: string, name: string, description: string, skipDays: number[]) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: "daily" | "weekly" | "monthly") => void;
  setActiveTab: (tab: "daily" | "weekly" | "monthly" | "settings" | "insights") => void;
  reorderHabit: (id: string, direction: "up" | "down") => void;
  
  // Storage actions
  clearAllData: () => Promise<void>;
  seedLocalMockData: () => void;
}

const LOCAL_STORAGE_KEY = "habit_tracker_offline_habits";

const DEFAULT_HABITS = [
  {
    name: "Drink 3L Water",
    description: "Stay hydrated throughout the day",
    skipDays: [], // Track every day
  },
  {
    name: "Morning Exercise",
    description: "30-minute workout or active stretching",
    skipDays: [0, 6], // Skip Sunday (0) and Saturday (6)
  },
  {
    name: "Read 15 Pages",
    description: "Read a non-fiction or fiction book",
    skipDays: [], // Track every day
  },
];

const sortHabitsByCustomOrder = (habitsList: Habit[]) => {
  if (typeof window === "undefined") return habitsList;
  const customOrderStr = localStorage.getItem("habit_tracker_custom_order");
  if (!customOrderStr) return habitsList;
  try {
    const customOrder: string[] = JSON.parse(customOrderStr);
    return [...habitsList].sort((a, b) => {
      const idxA = customOrder.indexOf(a._id || "");
      const idxB = customOrder.indexOf(b._id || "");
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  } catch (e) {
    console.error("Failed to parse custom order:", e);
    return habitsList;
  }
};

// Keep track of pending database save timeouts for debouncing habit completion toggles
const toggleTimeouts: Record<string, NodeJS.Timeout> = {};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: false,
  isSyncing: false,
  dbConnected: false,
  selectedDate: getLocalDateString(),
  viewMode: "daily",
  activeTab: "daily",

  setViewMode: (mode) => set({ viewMode: mode }),

  fetchHabits: async () => {
    // 1. Instantly load from localStorage if available
    let localHabits: Habit[] = [];
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          localHabits = JSON.parse(localData);
        } catch (e) {
          console.error("Failed to parse local habits:", e);
        }
      }

      // If empty, keep localHabits as empty array
    }

    localHabits = sortHabitsByCustomOrder(localHabits);

    // Set local habits immediately and start syncing indicator
    set({
      habits: localHabits,
      isSyncing: true,
      isLoading: false,
    });

    // 2. Fetch and sync from DB in parallel
    try {
      const response = await fetch("/api/habits");
      if (!response.ok) {
        throw new Error("Failed to fetch habits from API");
      }
      const data = await response.json();
      
      if (data.dbConnected) {
        const sortedHabits = sortHabitsByCustomOrder(data.habits);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedHabits));
        }
        set({
          habits: sortedHabits,
          dbConnected: true,
          isSyncing: false,
        });
      } else {
        throw new Error("MongoDB not connected on server");
      }
    } catch (error) {
      console.warn("API sync failed. Using offline cached data:", error);
      set({
        dbConnected: false,
        isSyncing: false,
      });
    }
  },

  addHabit: async (name, description, skipDays) => {
    const { dbConnected } = get();
    
    if (dbConnected) {
      try {
        const response = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, skipDays }),
        });
        
        if (!response.ok) throw new Error("Failed to create habit");
        const data = await response.json();
        
        set((state) => ({ habits: [...state.habits, data.habit] }));
      } catch (error) {
        console.error("Error creating habit, falling back to local:", error);
      }
    } else {
      // Local storage fallback
      set((state) => {
        const newHabit: Habit = {
          _id: `local_${Date.now()}`,
          name,
          description,
          skipDays,
          createdAt: getLocalDateString(),
          completedDates: [],
        };
        
        const updatedHabits = [...state.habits, newHabit];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHabits));
        return { habits: updatedHabits };
      });
    }
  },

  updateHabit: async (id, name, description, skipDays) => {
    const { dbConnected } = get();
    
    if (dbConnected && !id.startsWith("local_")) {
      try {
        const response = await fetch(`/api/habits/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, skipDays }),
        });
        
        if (!response.ok) throw new Error("Failed to update habit");
        const data = await response.json();
        
        set((state) => ({
          habits: state.habits.map((h) => (h._id === id ? data.habit : h)),
        }));
      } catch (error) {
        console.error("Error updating habit:", error);
      }
    } else {
      // Local storage fallback
      set((state) => {
        const updatedHabits = state.habits.map((h) =>
          h._id === id ? { ...h, name, description, skipDays } : h
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHabits));
        return { habits: updatedHabits };
      });
    }
  },

  deleteHabit: async (id) => {
    const { dbConnected } = get();
    
    if (dbConnected && !id.startsWith("local_")) {
      try {
        const response = await fetch(`/api/habits/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) throw new Error("Failed to delete habit");
        
        set((state) => ({
          habits: state.habits.filter((h) => h._id !== id),
        }));
      } catch (error) {
        console.error("Error deleting habit:", error);
      }
    } else {
      // Local storage fallback
      set((state) => {
        const updatedHabits = state.habits.filter((h) => h._id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHabits));
        return { habits: updatedHabits };
      });
    }
  },

  toggleHabitCompletion: async (id, date) => {
    const today = getLocalDateString();
    if (date > today) {
      console.warn("Cannot toggle completion for a future date.");
      return;
    }

    const { dbConnected } = get();
    
    if (dbConnected && !id.startsWith("local_")) {
      // 1. Optimistic UI update - happens instantly
      set((state) => {
        const targetHabit = state.habits.find((h) => h._id === id);
        if (!targetHabit) return {};
        
        const isCompleted = targetHabit.completedDates.includes(date);
        const updatedDates = isCompleted
          ? targetHabit.completedDates.filter((d) => d !== date)
          : [...targetHabit.completedDates, date];
          
        return {
          habits: state.habits.map((h) =>
            h._id === id ? { ...h, completedDates: updatedDates } : h
          ),
        };
      });

      // 2. Debounce the API call
      const timeoutKey = `${id}-${date}`;
      if (toggleTimeouts[timeoutKey]) {
        clearTimeout(toggleTimeouts[timeoutKey]);
      }

      toggleTimeouts[timeoutKey] = setTimeout(async () => {
        delete toggleTimeouts[timeoutKey];
        try {
          // Get the current (optimistic) state of completion for this habit
          const targetHabit = get().habits.find((h) => h._id === id);
          if (!targetHabit) return;
          const isCompleted = targetHabit.completedDates.includes(date);

          const response = await fetch(`/api/habits/${id}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, completed: isCompleted }),
          });
          
          if (!response.ok) throw new Error("Failed to toggle completion");
          const data = await response.json();
          
          // Update state with server response just in case (e.g. to get server-sanitized state)
          set((state) => ({
            habits: state.habits.map((h) => (h._id === id ? data.habit : h)),
          }));
        } catch (error) {
          console.error("Error toggling completion:", error);
          // Revert store state on error
          get().fetchHabits();
        }
      }, 500); // 500ms debounce delay
    } else {
      // Local storage fallback (runs instantly, no debounce needed)
      set((state) => {
        const updatedHabits = state.habits.map((h) => {
          if (h._id !== id) return h;
          
          const isCompleted = h.completedDates.includes(date);
          const updatedDates = isCompleted
            ? h.completedDates.filter((d) => d !== date)
            : [...h.completedDates, date];
            
          return {
            ...h,
            completedDates: updatedDates,
          };
        });
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHabits));
        return { habits: updatedHabits };
      });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),

  reorderHabit: (id, direction) => {
    const { habits } = get();
    const index = habits.findIndex((h) => h._id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= habits.length) return;

    const updatedHabits = [...habits];
    const temp = updatedHabits[index];
    updatedHabits[index] = updatedHabits[newIndex];
    updatedHabits[newIndex] = temp;

    if (typeof window !== "undefined") {
      const idOrder = updatedHabits.map((h) => h._id!);
      localStorage.setItem("habit_tracker_custom_order", JSON.stringify(idOrder));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHabits));
    }

    set({ habits: updatedHabits });
  },

  clearAllData: async () => {
    const { dbConnected } = get();
    
    if (dbConnected) {
      try {
        const response = await fetch("/api/habits", {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to clear habits from database");
      } catch (error) {
        console.error("Error clearing habits from database:", error);
        // Continue to clear local state anyway
      }
    }
    
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ habits: [] });
  },

  seedLocalMockData: () => {
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    const twoDaysAgo = getLocalDateString(new Date(Date.now() - 86400000 * 2));
    const threeDaysAgo = getLocalDateString(new Date(Date.now() - 86400000 * 3));
    const fourDaysAgo = getLocalDateString(new Date(Date.now() - 86400000 * 4));

    const seededHabits: Habit[] = [
      {
        _id: `local_${Date.now()}_1`,
        name: "Drink 3L Water",
        description: "Stay hydrated throughout the day",
        createdAt: fourDaysAgo,
        skipDays: [],
        completedDates: [today, yesterday, twoDaysAgo, threeDaysAgo, fourDaysAgo], // 5-day streak
      },
      {
        _id: `local_${Date.now()}_2`,
        name: "Morning Exercise",
        description: "30-minute workout or active stretching",
        createdAt: fourDaysAgo,
        skipDays: [0, 6], // Skip Sunday, Saturday
        // completed on Friday, Thursday, Wednesday (suppose today is Tuesday)
        completedDates: [yesterday, twoDaysAgo, threeDaysAgo],
      },
      {
        _id: `local_${Date.now()}_3`,
        name: "Read 15 Pages",
        description: "Read a non-fiction or fiction book",
        createdAt: fourDaysAgo,
        skipDays: [],
        completedDates: [today, twoDaysAgo, fourDaysAgo], // inconsistent, streak broken
      },
    ];

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seededHabits));
    set({ habits: seededHabits, dbConnected: false });
  },
}));
