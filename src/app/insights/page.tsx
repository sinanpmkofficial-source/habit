"use client";

import React, { useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import InsightsView from "@/components/habits/InsightsView";

export default function InsightsPage() {
  const { fetchHabits } = useHabitStore();
  const { fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchHabits();
    fetchTasks();
  }, [fetchHabits, fetchTasks]);

  return <InsightsView />;

}