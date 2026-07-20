"use client";

import React, { useState, useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Task } from "@/lib/habit-utils";
import DailyView from "@/components/habits/DailyView";
import TaskWeeklyView from "@/components/tasks/TaskWeeklyView";
import TaskMonthlyView from "@/components/tasks/TaskMonthlyView";
import TaskModal from "@/components/habits/TaskModal";
import ViewFilter from "@/components/layout/ViewFilter";

export default function TasksPage() {
  const { fetchHabits, selectedDate, viewMode, setViewMode } = useHabitStore();
  const { fetchTasks } = useTaskStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(selectedDate);

  useEffect(() => {
    fetchHabits();
    fetchTasks();
  }, [fetchHabits, fetchTasks]);

  const handleAddTask = (targetDate: string = selectedDate) => {
    setEditingTask(null);
    setModalDefaultDate(targetDate);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (t: Task) => {
    setEditingTask(t);
    setModalDefaultDate(t.date);
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <>
      <div className="flex flex-col gap-0">
        {/* Desktop View filter */}
        <div className="hidden md:block px-4 md:px-6 xl:px-10 pt-5 pb-1">
          <ViewFilter value={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === "daily" && (
          <DailyView
            mode="tasks-only"
            onAddHabit={() => {}}
            onEditHabit={() => {}}
            onAddTask={() => handleAddTask(selectedDate)}
            onEditTask={handleEditTask}
          />
        )}

        {viewMode === "weekly" && (
          <TaskWeeklyView
            onAddTaskForDate={(dateStr) => handleAddTask(dateStr)}
            onEditTask={handleEditTask}
            onGoToDaily={() => setViewMode("daily")}
          />
        )}

        {viewMode === "monthly" && (
          <TaskMonthlyView
            onAddTaskForDate={(dateStr) => handleAddTask(dateStr)}
            onEditTask={handleEditTask}
          />
        )}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        defaultDate={modalDefaultDate}
      />
    </>
  );
}
