"use client";

import React, { useEffect, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit, Task } from "@/lib/habit-utils";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import DailyView from "@/components/habits/DailyView";
import WeeklyView from "@/components/habits/WeeklyView";
import MonthlyView from "@/components/habits/MonthlyView";
import SettingsView from "@/components/settings/SettingsView";
import InsightsView from "@/components/habits/InsightsView";
import HabitModal from "@/components/habits/HabitModal";
import TaskModal from "@/components/habits/TaskModal";

export default function Home() {
  const { activeTab, fetchHabits, isLoading, selectedDate } = useHabitStore();
  const { fetchTasks } = useTaskStore();

  // Habit modal state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchHabits();
    fetchTasks();
  }, [fetchHabits, fetchTasks]);

  // Habit handlers
  const handleAddHabitTrigger = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };
  const handleEditHabitTrigger = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };
  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  };

  // Task handlers
  const handleAddTaskTrigger = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };
  const handleEditTaskTrigger = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Render active view
  const renderActiveView = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto">
          <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2 animate-pulse">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full w-1/4" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-16 border border-border bg-card-bg rounded-2xl p-4 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "daily":
        return (
          <DailyView
            onAddHabit={handleAddHabitTrigger}
            onEditHabit={handleEditHabitTrigger}
            onAddTask={handleAddTaskTrigger}
            onEditTask={handleEditTaskTrigger}
          />
        );
      case "weekly":
        return <WeeklyView />;
      case "monthly":
        return <MonthlyView />;
      case "settings":
        return (
          <SettingsView
            onAddHabit={handleAddHabitTrigger}
            onEditHabit={handleEditHabitTrigger}
          />
        );
      case "insights":
        return <InsightsView />;
      default:
        return (
          <DailyView
            onAddHabit={handleAddHabitTrigger}
            onEditHabit={handleEditHabitTrigger}
            onAddTask={handleAddTaskTrigger}
            onEditTask={handleEditTaskTrigger}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30 dark:bg-black text-black dark:text-zinc-100 pb-20 md:pb-6">
      <Header />

      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col justify-start">
        {renderActiveView()}
      </main>

      <BottomNav />

      {/* Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseHabitModal}
        habit={editingHabit}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  );
}
