import { create } from "zustand";
import { PrayerKey } from "@/lib/prayer-utils";

interface PrayerState {
  prayers: Record<string, PrayerKey[]>; // date -> array of completed prayer keys
  isSyncing: boolean;
  dbConnected: boolean;

  // Actions
  fetchPrayers: () => Promise<void>;
  togglePrayerCompletion: (date: string, prayer: PrayerKey) => Promise<void>;
}

const LOCAL_STORAGE_KEY = "habit_tracker_prayers";

const toggleTimeouts: Record<string, NodeJS.Timeout> = {};

export const usePrayerStore = create<PrayerState>((set, get) => ({
  prayers: {},
  isSyncing: false,
  dbConnected: false,

  fetchPrayers: async () => {
    // 1. Load from localStorage
    let localMap: Record<string, PrayerKey[]> = {};
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          localMap = JSON.parse(localData);
        } catch (e) {
          console.error("Failed to parse local prayers:", e);
        }
      }
    }

    set({ prayers: localMap, isSyncing: true });

    // 2. Fetch from DB
    try {
      const response = await fetch("/api/prayers");
      if (!response.ok) throw new Error("Failed to fetch prayers");
      const data = await response.json();

      if (data.dbConnected) {
        const dbMap: Record<string, PrayerKey[]> = {};
        (data.prayers || []).forEach((item: { date: string; completed: PrayerKey[] }) => {
          dbMap[item.date] = item.completed || [];
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbMap));
        }

        set({ prayers: dbMap, dbConnected: true, isSyncing: false });
      } else {
        throw new Error("DB not connected");
      }
    } catch (error) {
      console.warn("Prayers API sync failed, using cached data:", error);
      set({ dbConnected: false, isSyncing: false });
    }
  },

  togglePrayerCompletion: async (date: string, prayer: PrayerKey) => {
    const currentList = get().prayers[date] || [];
    const isCompleted = currentList.includes(prayer);
    const updatedList = isCompleted
      ? currentList.filter((p) => p !== prayer)
      : [...currentList, prayer];

    // Optimistic update
    set((state) => {
      const newMap = { ...state.prayers, [date]: updatedList };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMap));
      }
      return { prayers: newMap };
    });

    const { dbConnected } = get();
    if (dbConnected) {
      const timeoutKey = `${date}-${prayer}`;
      if (toggleTimeouts[timeoutKey]) {
        clearTimeout(toggleTimeouts[timeoutKey]);
      }

      toggleTimeouts[timeoutKey] = setTimeout(async () => {
        delete toggleTimeouts[timeoutKey];
        try {
          const response = await fetch("/api/prayers/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, prayer }),
          });
          if (!response.ok) throw new Error("Failed to toggle prayer");
        } catch (error) {
          console.error("Error toggling prayer:", error);
        }
      }, 300);
    }
  },
}));
