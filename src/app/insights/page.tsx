"use client";

import React, { useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { usePrayerStore } from "@/store/prayer-store";
import InsightsView from "@/components/habits/InsightsView";

export default function InsightsPage() {
  const { fetchHabits } = useHabitStore();
  const { fetchTasks } = useTaskStore();
  const { fetchPrayers } = usePrayerStore();

  useEffect(() => {
    fetchHabits();
    fetchTasks();
    fetchPrayers();
  }, [fetchHabits, fetchTasks, fetchPrayers]);

  return <InsightsView />;
}