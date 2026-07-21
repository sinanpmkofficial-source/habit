"use client";

import React, { useState, useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { usePrayerStore } from "@/store/prayer-store";
import { PRAYERS, PrayerKey } from "@/lib/prayer-utils";
import { getLocalDateString } from "@/lib/habit-utils";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Percent,
  Sparkles,
  Moon,
} from "lucide-react";
import PrayerConfirmBar, { PendingPrayerToggle } from "./PrayerConfirmBar";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PrayerMonthlyView() {
  const { selectedDate, setSelectedDate } = useHabitStore();
  const { prayers, togglePrayerCompletion } = usePrayerStore();

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [pendingToggle, setPendingToggle] = useState<PendingPrayerToggle | null>(null);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayIndexJs = new Date(viewYear, viewMonth, 1).getDay();
    const prefixBlanks = firstDayIndexJs === 0 ? 6 : firstDayIndexJs - 1;

    const days = [];
    for (let i = 0; i < prefixBlanks; i++) {
      days.push(null);
    }

    const todayStr = getLocalDateString();
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(viewMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${viewYear}-${monthStr}-${dayStr}`;

      const isToday = dateStr === todayStr;
      const dayCompletedList = prayers[dateStr] || [];

      days.push({
        day,
        dateStr,
        isToday,
        completedCount: dayCompletedList.length,
      });
    }

    return days;
  }, [viewMonth, viewYear, prayers]);

  // Monthly statistics calculation
  const monthStats = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let totalCompleted = 0;
    let fullDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(viewMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
      const completedList = prayers[dateStr] || [];

      totalCompleted += completedList.length;
      if (completedList.length === 5) {
        fullDays++;
      }
    }

    const totalPossible = daysInMonth * 5;
    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      totalCompleted,
      fullDays,
      rate,
    };
  }, [viewMonth, viewYear, prayers]);

  const selectedDayCompletedList = prayers[selectedDate] || [];

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
      {/* View Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
          Monthly Prayer Calendar
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Track prayer consistency across the month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {/* Left Column: Month Navigator & Stats & Selected Day Panel */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Month Selector */}
          <div className="flex items-center justify-between border border-border bg-card-bg rounded-xl px-2 py-1.5">
            <button
              onClick={handlePrevMonth}
              className="btn-interactive p-2 rounded-lg hover:bg-muted-bg text-black dark:text-white"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <span className="text-sm md:text-base font-bold text-black dark:text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="btn-interactive p-2 rounded-lg hover:bg-muted-bg text-black dark:text-white"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 select-none">
            <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-muted-text">
                <Percent className="w-3.5 h-3.5" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  Consistency
                </span>
              </div>
              <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                {monthStats.rate}%
              </span>
              <span className="text-[9px] md:text-xs text-muted-text mt-0.5">
                {monthStats.totalCompleted} prayers logged
              </span>
            </div>

            <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-muted-text">
                <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  Perfect Days
                </span>
              </div>
              <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                {monthStats.fullDays} <span className="text-xs font-normal text-muted-text">days</span>
              </span>
              <span className="text-[9px] md:text-xs text-muted-text mt-0.5">5/5 prayers done</span>
            </div>
          </div>

          {/* Selected Day Prayers Inspection */}
          <div className="flex flex-col p-3.5 md:p-4 rounded-2xl border border-border bg-card-bg gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-black dark:text-white">
                {selectedDate}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-muted-bg border border-border text-black dark:text-white">
                {selectedDayCompletedList.length}/5 Done
              </span>
            </div>

            <div className="flex flex-col gap-1.5 md:gap-2">
              {PRAYERS.map((prayer) => {
                const isDone = selectedDayCompletedList.includes(prayer.key);

                return (
                  <button
                    key={prayer.key}
                    onClick={() =>
                      requestPrayerToggle(
                        selectedDate,
                        prayer.key,
                        prayer.name,
                        isDone
                      )
                    }
                    className={`btn-interactive flex items-center justify-between py-1.5 px-2.5 md:p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isDone
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                        : "bg-muted-bg/30 border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-black dark:text-white"
                    }`}
                  >
                    <span className="font-bold">{prayer.name}</span>
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
          </div>
        </div>

        {/* Right Column: Calendar Grid */}
        <div className="md:col-span-2 flex flex-col justify-start">
          <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 text-center mb-3">
              {WEEKDAYS.map((day, idx) => (
                <span
                  key={idx}
                  className="text-xs md:text-sm font-bold text-muted-text"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Matrix day cells */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {calendarDays.map((cell, idx) => {
                if (cell === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isSelected = cell.dateStr === selectedDate;
                const isPerfect = cell.completedCount === 5;
                const isPartial = cell.completedCount > 0 && !isPerfect;

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`btn-interactive aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-md"
                        : cell.isToday
                        ? "border-black dark:border-white text-black dark:text-white"
                        : "border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-black dark:text-zinc-100"
                    }`}
                  >
                    <span className="text-xs md:text-sm font-bold">
                      {cell.day}
                    </span>

                    {/* Prayer badge indicator */}
                    {cell.completedCount > 0 && (
                      <div
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 leading-none ${
                          isSelected
                            ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                            : isPerfect
                            ? "bg-black dark:bg-white text-white dark:text-black"
                            : "bg-muted-bg text-muted-text border border-border"
                        }`}
                      >
                        {cell.completedCount}/5
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
