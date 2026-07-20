"use client";

import React, { useState, useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit } from "@/lib/habit-utils";
import SettingsView from "@/components/settings/SettingsView";
import HabitModal from "@/components/habits/HabitModal";

export default function SettingsPage() {
  const { fetchHabits } = useHabitStore();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  return (
    <>
      <SettingsView
        onAddHabit={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
        onEditHabit={(h: Habit) => { setEditingHabit(h); setIsHabitModalOpen(true); }}
      />
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => { setIsHabitModalOpen(false); setEditingHabit(null); }}
        habit={editingHabit}
      />
    </>
  );
}
