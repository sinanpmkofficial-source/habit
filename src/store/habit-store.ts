import { create } from "zustand";
import { Habit, getLocalDateString } from "@/lib/habit-utils";

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  dbConnected: boolean;
  selectedDate: string;
  activeTab: "daily" | "weekly" | "monthly" | "settings";
  
  // Actions
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, description: string, skipDays: number[]) => Promise<void>;
  updateHabit: (id: string, name: string, description: string, skipDays: number[]) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setActiveTab: (tab: "daily" | "weekly" | "monthly" | "settings") => void;
  
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

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  isLoading: true,
  dbConnected: false,
  selectedDate: getLocalDateString(),
  activeTab: "daily",

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/habits");
      if (!response.ok) {
        throw new Error("Failed to fetch habits from API");
      }
      const data = await response.json();
      
      if (data.dbConnected) {
        set({ habits: data.habits, dbConnected: true, isLoading: false });
      } else {
        // MongoDB is not connected, fallback to localStorage
        throw new Error("MongoDB not connected on server");
      }
    } catch (error) {
      console.warn("API unavailable or DB not connected. Falling back to localStorage:", error);
      
      // Load from localStorage
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localHabits: Habit[] = [];
      
      if (localData) {
        try {
          localHabits = JSON.parse(localData);
        } catch (e) {
          console.error("Failed to parse local habits:", e);
        }
      }
      
      // If local habits are empty, seed default habits locally
      if (localHabits.length === 0) {
        const today = getLocalDateString();
        localHabits = DEFAULT_HABITS.map((item, idx) => ({
          _id: `local_${Date.now()}_${idx}`,
          name: item.name,
          description: item.description,
          skipDays: item.skipDays,
          createdAt: today,
          completedDates: [],
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localHabits));
      }

      set({
        habits: localHabits,
        dbConnected: false,
        isLoading: false,
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
      try {
        // Optimistic UI update
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

        const response = await fetch(`/api/habits/${id}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
        
        if (!response.ok) throw new Error("Failed to toggle completion");
        const data = await response.json();
        
        // Update state with server response just in case
        set((state) => ({
          habits: state.habits.map((h) => (h._id === id ? data.habit : h)),
        }));
      } catch (error) {
        console.error("Error toggling completion:", error);
        // Revert store state on error
        get().fetchHabits();
      }
    } else {
      // Local storage fallback
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
