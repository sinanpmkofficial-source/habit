"use client";

import React, { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { usePrayerStore } from "@/store/prayer-store";
import { PRAYERS, PrayerKey } from "@/lib/prayer-utils";
import { getLocalDateString, addDays } from "@/lib/habit-utils";
import { Check, Sparkles } from "lucide-react";
import PrayerConfirmBar, { PendingPrayerToggle } from "./PrayerConfirmBar";

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PrayerWeeklyView() {
  const { selectedDate, setSelectedDate } = useHabitStore();
  const { prayers, togglePrayerCompletion } = usePrayerStore();

  const [pendingToggle, setPendingToggle] = useState<PendingPrayerToggle | null>(null);

  const todayStr = getLocalDateString();

  // Calculate Monday to Sunday week dates
  const weekDaysInfo = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIndex = dateObj.getDay();

    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const mondayStr = addDays(selectedDate, mondayOffset);

    return Array.from({ length: 7 }).map((_, i) => {
      const dateStr = addDays(mondayStr, i);
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);

      const label = WEEKDAYS_SHORT[i];
      const dayNum = date.getDate();
      const isToday = dateStr === todayStr;

      const dayCompletedList = prayers[dateStr] || [];

      return {
        dateStr,
        label,
        dayNum,
        isToday,
        dayCompletedList,
        completedCount: dayCompletedList.length,
      };
    });
  }, [selectedDate, todayStr, prayers]);

  const formattedWeekRange = useMemo(() => {
    if (weekDaysInfo.length === 0) return "";
    const start = weekDaysInfo[0];
    const end = weekDaysInfo[6];

    const [startYear, startM, startD] = start.dateStr.split("-").map(Number);
    const [endYear, endM, endD] = end.dateStr.split("-").map(Number);

    const startDate = new Date(startYear, startM - 1, startD);
    const endDate = new Date(endYear, endM - 1, endD);

    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });

    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${startDate.getFullYear()}`;
    } else {
      return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
  }, [weekDaysInfo]);

  // Overall week completion total (out of 35 max: 5 prayers * 7 days)
  const totalWeekCompleted = weekDaysInfo.reduce((acc, d) => acc + d.completedCount, 0);
  const weekPercent = Math.round((totalWeekCompleted / 35) * 100);

  const requestPrayerToggle = (
    dateStr: string,
    prayerKey: PrayerKey,
    prayerName: string,
    isCurrentlyCompleted: boolean
  ) => {
    setPendingToggle({
      dateStr,
      prayerKey,
      prayerName,
      isCurrentlyCompleted,
    });
  };

  const handleConfirmToggle = () => {
    if (!pendingToggle) return;
    togglePrayerCompletion(pendingToggle.dateStr, pendingToggle.prayerKey);
    setPendingToggle(null);
  };

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6 px-3 md:px-6 xl:px-10 py-3 md:py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
            Weekly Prayer Log
          </h2>
          <p className="text-xs md:text-sm text-muted-text mt-0.5">{formattedWeekRange}</p>
        </div>

        {/* Weekly Stats Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card-bg w-fit">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black dark:text-white" />
            <span className="text-xs font-bold text-black dark:text-white">
              {totalWeekCompleted} / 35 Prayers Done
            </span>
          </div>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-muted-bg text-black dark:text-white border border-border">
            {weekPercent}%
          </span>
        </div>
      </div>

      {/* Grid of 7 days */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 md:gap-3">
        {weekDaysInfo.map((day) => {
          const isSelected = day.dateStr === selectedDate;

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col rounded-xl md:rounded-2xl border transition-all p-2.5 md:p-3.5 bg-card-bg ${
                isSelected
                  ? "border-black dark:border-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : day.isToday
                  ? "border-zinc-400 dark:border-zinc-600"
                  : "border-border"
              }`}
            >
              {/* Day Header */}
              <div
                onClick={() => setSelectedDate(day.dateStr)}
                className="flex items-center justify-between cursor-pointer select-none pb-1.5 md:pb-2 border-b border-border mb-2 md:mb-3"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text">
                    {day.label}
                  </span>
                  {day.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                  )}
                </div>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                    isSelected
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {day.dayNum}
                </span>
              </div>

              {/* 5 Prayers List */}
              <div className="flex flex-col gap-1.5 md:gap-2 flex-1">
                {PRAYERS.map((prayer) => {
                  const isDone = day.dayCompletedList.includes(prayer.key);

                  return (
                    <button
                      key={prayer.key}
                      onClick={() =>
                        requestPrayerToggle(
                          day.dateStr,
                          prayer.key,
                          prayer.name,
                          isDone
                        )
                      }
                      className={`btn-interactive flex items-center justify-between py-1.5 px-2 md:p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isDone
                          ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                          : "bg-muted-bg/30 border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-black dark:text-white"
                      }`}
                    >
                      <span className="font-semibold text-[11px]">{prayer.name}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isDone
                            ? "bg-white text-black dark:bg-black dark:text-white border-white dark:border-black"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        <Check
                          className={`w-2.5 h-2.5 stroke-[3] transition-transform ${
                            isDone ? "scale-100" : "scale-0"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Day count indicator */}
              <div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted-text">
                <span>Progress</span>
                <span className="text-black dark:text-white">{day.completedCount}/5</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Bar */}
      <PrayerConfirmBar
        pending={pendingToggle}
        onConfirm={handleConfirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
