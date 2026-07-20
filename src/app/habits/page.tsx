"use client";

import React, { useState, useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit } from "@/lib/habit-utils";
import DailyView from "@/components/habits/DailyView";
import WeeklyView from "@/components/habits/WeeklyView";
import MonthlyView from "@/components/habits/MonthlyView";
import HabitModal from "@/components/habits/HabitModal";
import ViewFilter from "@/components/layout/ViewFilter";

export default function HabitsPage() {
  const { fetchHabits, isLoading, viewMode, setViewMode } = useHabitStore();
  const { fetchTasks } = useTaskStore();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    fetchHabits();
    fetchTasks();
  }, [fetchHabits, fetchTasks]);

  const handleAddHabit = () => { setEditingHabit(null); setIsHabitModalOpen(true); };
  const handleEditHabit = (h: Habit) => { setEditingHabit(h); setIsHabitModalOpen(true); };
  const handleCloseModal = () => { setIsHabitModalOpen(false); setEditingHabit(null); };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 px-4 md:px-6 xl:px-10 py-6">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted-bg/60 border border-border w-fit animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-16 border border-border bg-card-bg rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-0">
        {/* Desktop View filter */}
        <div className="hidden md:block px-4 md:px-6 xl:px-10 pt-5 pb-1">
          <ViewFilter value={viewMode} onChange={setViewMode} />
        </div>

        {/* Content */}
        {viewMode === "daily" && (
          <DailyView
            mode="habits-only"
            onAddHabit={handleAddHabit}
            onEditHabit={handleEditHabit}
            onAddTask={() => {}}
            onEditTask={() => {}}
          />
        )}
        {viewMode === "weekly" && (
          <WeeklyView onGoToDaily={() => setViewMode("daily")} />
        )}
        {viewMode === "monthly" && (
          <MonthlyView onGoToDaily={() => setViewMode("daily")} />
        )}
      </div>

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseModal}
        habit={editingHabit}
      />
    </>
  );
}
