import { create } from "zustand";

export interface BrainIdea {
  _id?: string;
  title: string;
  content?: string;
  completed: boolean;
  createdAt: string;
}

interface BrainDumpState {
  ideas: BrainIdea[];
  isLoading: boolean;
  dbConnected: boolean;

  // Actions
  fetchIdeas: () => Promise<void>;
  addIdea: (title: string, content?: string) => Promise<void>;
  updateIdea: (id: string, title: string, content?: string) => Promise<void>;
  toggleIdeaCompletion: (id: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = "habit_tracker_braindump";

export const useBrainDumpStore = create<BrainDumpState>((set, get) => ({
  ideas: [],
  isLoading: false,
  dbConnected: false,

  fetchIdeas: async () => {
    let localIdeas: BrainIdea[] = [];
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        try {
          localIdeas = JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse local braindump ideas:", e);
        }
      }
    }

    set({ ideas: localIdeas, isLoading: true });

    try {
      const response = await fetch("/api/braindump");
      if (!response.ok) throw new Error("Failed to fetch braindump ideas");
      const data = await response.json();

      if (data.dbConnected) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.ideas));
        }
        set({ ideas: data.ideas, dbConnected: true, isLoading: false });
      } else {
        throw new Error("MongoDB not connected");
      }
    } catch (error) {
      console.warn("Braindump API sync failed, using offline cache:", error);
      set({ dbConnected: false, isLoading: false });
    }
  },

  addIdea: async (title: string, content?: string) => {
    const { dbConnected } = get();

    if (dbConnected) {
      try {
        const response = await fetch("/api/braindump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!response.ok) throw new Error("Failed to create idea");
        const data = await response.json();
        set((state) => ({ ideas: [data.idea, ...state.ideas] }));
      } catch (error) {
        console.error("Error creating idea, falling back to local:", error);
        const newIdea: BrainIdea = {
          _id: `local_${Date.now()}`,
          title: title || (content ? content.slice(0, 50) : "Untitled Idea"),
          content: content || "",
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const updated = [newIdea, ...state.ideas];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          return { ideas: updated };
        });
      }
    } else {
      const newIdea: BrainIdea = {
        _id: `local_${Date.now()}`,
        title: title || (content ? content.slice(0, 50) : "Untitled Idea"),
        content: content || "",
        completed: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const updated = [newIdea, ...state.ideas];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { ideas: updated };
      });
    }
  },

  updateIdea: async (id: string, title: string, content?: string) => {
    const { dbConnected } = get();

    set((state) => ({
      ideas: state.ideas.map((item) =>
        item._id === id ? { ...item, title, content: content || "" } : item
      ),
    }));

    if (dbConnected && !id.startsWith("local_")) {
      try {
        await fetch(`/api/braindump/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
      } catch (error) {
        console.error("Error updating idea:", error);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get().ideas));
    }
  },

  toggleIdeaCompletion: async (id: string) => {
    const { dbConnected, ideas } = get();
    const target = ideas.find((i) => i._id === id);
    if (!target) return;

    const newCompleted = !target.completed;

    set((state) => ({
      ideas: state.ideas.map((item) =>
        item._id === id ? { ...item, completed: newCompleted } : item
      ),
    }));

    if (dbConnected && !id.startsWith("local_")) {
      try {
        await fetch(`/api/braindump/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: newCompleted }),
        });
      } catch (error) {
        console.error("Error toggling idea completion:", error);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get().ideas));
    }
  },

  deleteIdea: async (id: string) => {
    const { dbConnected } = get();

    set((state) => ({
      ideas: state.ideas.filter((item) => item._id !== id),
    }));

    if (dbConnected && !id.startsWith("local_")) {
      try {
        await fetch(`/api/braindump/${id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error deleting idea:", error);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get().ideas));
    }
  },
}));
