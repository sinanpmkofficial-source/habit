"use client";

import React, { useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit, calculateStreaks, isFixedSkipDay, isBeforeDate, getLocalDateString, addDays } from "@/lib/habit-utils";
import { Flame, Check, HelpCircle } from "lucide-react";

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyView() {
  const { habits, selectedDate, toggleHabitCompletion } = useHabitStore();

  const todayStr = getLocalDateString();

  // Calculate the Monday-to-Sunday week dates containing selectedDate
  const weekDaysInfo = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    // Calculate offset to get to Monday
    // If Sunday (0), offset is -6. Otherwise, 1 - dayIndex
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const mondayStr = addDays(selectedDate, mondayOffset);

    return Array.from({ length: 7 }).map((_, i) => {
      const dateStr = addDays(mondayStr, i);
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      
      // Map JS day index (0-6 Sun-Sat) to Mon-Sun array (0-6 Mon-Sun)
      // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      // Mon-Sun array: index 0 corresponds to JS 1, 1 to 2, ... 5 to 6, 6 to 0
      const jsDayIndex = date.getDay();
      
      const label = WEEKDAYS_SHORT[i];
      const dayNum = date.getDate();
      
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      return {
        dateStr,
        label,
        dayNum,
        jsDayIndex,
        isToday,
        isFuture,
      };
    });
  }, [selectedDate, todayStr]);

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

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
          Weekly Consistency
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">{formattedWeekRange}</p>
      </div>

      {/* Habit Cards */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg">
          <HelpCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-black dark:text-white">No habits created</h3>
          <p className="text-xs text-muted-text mt-1 max-w-[240px]">
            Go to the Daily tab or Settings tab to create your first habit.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map((habit) => {
            const { currentStreak, longestStreak } = calculateStreaks(habit, todayStr);

            return (
              <div
                key={habit._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-2xl border border-border bg-card-bg hover:border-zinc-400 dark:hover:border-zinc-700 transition-all gap-4"
              >
                {/* Info & Stats Section */}
                <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 min-w-0 md:w-1/3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm md:text-base font-bold text-black dark:text-white truncate">
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[10px] md:text-xs text-muted-text truncate mt-0.5 max-w-[220px] md:max-w-xs">
                        {habit.description}
                      </span>
                    )}
                  </div>

                  {/* Streaks */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none md:mt-1.5">
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border bg-muted-bg text-[9px] md:text-xs font-bold text-black dark:text-white">
                        <Flame className="w-2.5 h-2.5 fill-black dark:fill-white text-black dark:text-white" />
                        <span>{currentStreak}d</span>
                      </div>
                    )}
                    <span className="text-[9px] md:text-xs font-medium text-muted-text border border-border px-1.5 py-0.5 rounded-full bg-muted-bg">
                      Best: {longestStreak}d
                    </span>
                    {habit.skipMode === "flexible" && (
                      <span className="text-[9px] md:text-xs font-medium text-muted-text border border-dashed border-border px-1.5 py-0.5 rounded-full bg-muted-bg">
                        Flex 1/wk
                      </span>
                    )}
                  </div>
                </div>

                {/* 7 days horizontal reel */}
                <div className="flex justify-between items-center bg-muted-bg/40 dark:bg-muted-bg/10 rounded-xl p-2 border border-border/50 md:flex-1 md:max-w-xl">
                  {weekDaysInfo.map((day) => {
                    const isCompleted = habit.completedDates.includes(day.dateStr);
                    const isSkipDay = isFixedSkipDay(habit, day.dateStr);

                    // A habit is inactive if the check date is before its creation date
                    const isInactive = isBeforeDate(day.dateStr, habit.createdAt);
                    const canToggle = !day.isFuture && !isInactive;

                    return (
                      <button
                        key={day.dateStr}
                        disabled={!canToggle}
                        onClick={() => toggleHabitCompletion(habit._id!, day.dateStr)}
                        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all ${
                          canToggle 
                            ? "hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer select-none" 
                            : "opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-[9px] md:text-xs font-semibold uppercase tracking-wider text-muted-text">
                          {day.label[0]}
                        </span>
                        
                        {/* Day indicator circle */}
                        <div
                          className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold mt-1.5 border transition-all ${
                            isCompleted
                              ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                              : isSkipDay
                              ? "border-dashed border-zinc-400 dark:border-zinc-600 text-muted-text"
                              : "border-zinc-200 dark:border-zinc-800 text-muted-text"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.5]" />
                          ) : (
                            <span>{day.dayNum}</span>
                          )}
                        </div>

                        {/* Today dot indicator */}
                        {day.isToday && (
                          <div className="w-1 h-1 rounded-full bg-black dark:bg-white mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
