"use client";

import React, { useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { usePrayerStore } from "@/store/prayer-store";
import PrayerDailyView from "@/components/prayers/PrayerDailyView";
import PrayerWeeklyView from "@/components/prayers/PrayerWeeklyView";
import PrayerMonthlyView from "@/components/prayers/PrayerMonthlyView";
import ViewFilter from "@/components/layout/ViewFilter";

export default function PrayersPage() {
  const { fetchHabits, viewMode, setViewMode } = useHabitStore();
  const { fetchPrayers } = usePrayerStore();

  useEffect(() => {
    fetchHabits();
    fetchPrayers();
  }, [fetchHabits, fetchPrayers]);

  return (
    <div className="flex flex-col gap-0">
      {/* Desktop View Filter Pill */}
      <div className="hidden md:block px-4 md:px-6 xl:px-10 pt-5 pb-1">
        <ViewFilter value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "daily" && <PrayerDailyView />}
      {viewMode === "weekly" && <PrayerWeeklyView />}
      {viewMode === "monthly" && <PrayerMonthlyView />}
    </div>
  );
}
