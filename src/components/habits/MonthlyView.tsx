"use client";

import React, { useState, useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit, calculateStreaks, getWeekdayIndex, isBeforeDate, getLocalDateString, addDays } from "@/lib/habit-utils";
import { ChevronLeft, ChevronRight, BarChart2, Flame, Percent, CheckCircle, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import ConfirmToggleBar, { PendingToggle } from "@/components/habits/ConfirmToggleBar";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyView() {
  const { habits, toggleHabitCompletion } = useHabitStore();
  const { tasks } = useTaskStore();
  
  // Local state for the navigated calendar month & year (defaulting to current date)
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [viewYear, setViewYear] = useState(today.getFullYear());
  
  // Local state for selected habit ID (default to first habit if available)
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  const requestToggle = (dateStr: string) => {
    if (!activeHabit) return;
    setPendingToggle({
      habitId: activeHabit._id!,
      dateStr,
      habitName: activeHabit.name,
      isCurrentlyCompleted: activeHabit.completedDates.includes(dateStr),
    });
  };

  const handleConfirmToggle = () => {
    if (!pendingToggle) return;
    toggleHabitCompletion(pendingToggle.habitId, pendingToggle.dateStr);
    setPendingToggle(null);
  };

  // Sync selectedHabitId with habits list if empty or invalid
  const activeHabit = useMemo(() => {
    if (habits.length === 0) return null;
    const found = habits.find((h) => h._id === selectedHabitId);
    if (found) return found;
    // Default to the first habit
    return habits[0];
  }, [habits, selectedHabitId]);

  // Handle month navigation
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

  // Generate calendar days for the grid
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    // Day of the week for the 1st of the month (JS: 0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayIndexJs = new Date(viewYear, viewMonth, 1).getDay();
    
    // Shift index so Monday is 0, Sunday is 6
    // JS: 0 -> 6, 1 -> 0, 2 -> 1, 3 -> 2, 4 -> 3, 5 -> 4, 6 -> 5
    const prefixBlanks = firstDayIndexJs === 0 ? 6 : firstDayIndexJs - 1;
    
    const days = [];
    
    // 1. Fill leading blank cells
    for (let i = 0; i < prefixBlanks; i++) {
      days.push(null);
    }
    
    // 2. Fill active days
    const todayStr = getLocalDateString();
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(viewMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
      
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      
      // Determine weekday index (Mon-Sun: 0 = Monday, ..., 6 = Sunday)
      // JS date.getDay() returns 0 for Sunday
      const jsDay = new Date(viewYear, viewMonth, day).getDay();
      // Map JS day to Mon-Sun (0=Mon, 6=Sun)
      const jsDayIndex = jsDay === 0 ? 6 : jsDay - 1;

      days.push({
        day,
        dateStr,
        isToday,
        isFuture,
        jsDayIndex,
        taskTotal: tasks.filter((t) => t.date === dateStr).length,
        taskDone: tasks.filter((t) => t.date === dateStr && t.completed).length,
      });
    }
    
    return days;
  }, [viewMonth, viewYear]);

  // Compute stats for selected habit in view month
  const stats = useMemo(() => {
    if (!activeHabit) return { completionsCount: 0, completionRate: 0, currentStreak: 0, longestStreak: 0 };
    
    const todayStr = getLocalDateString();
    
    // 1. Standard streaks
    const { currentStreak, longestStreak } = calculateStreaks(activeHabit, todayStr);
    
    // 2. Total completions in viewed month
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const completionsInMonth = activeHabit.completedDates.filter((dateStr) =>
      dateStr.startsWith(monthPrefix)
    ).length;
    
    // 3. Completion rate for this month (active days in this month)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let activeDaysCount = 0;
    let completionsCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${dayStr}`;
      
      // Don't count days in future or before habit creation
      if (dateStr > todayStr || isBeforeDate(dateStr, activeHabit.createdAt)) {
        continue;
      }
      
      const jsDay = new Date(viewYear, viewMonth, day).getDay();
      const isSkipDay = activeHabit.skipDays.includes(jsDay === 0 ? 6 : jsDay - 1);
      const isCompleted = activeHabit.completedDates.includes(dateStr);
      
      if (isCompleted) {
        completionsCount++;
        activeDaysCount++;
      } else if (!isSkipDay) {
        activeDaysCount++;
      }
    }
    
    const completionRate = activeDaysCount === 0 ? 0 : Math.round((completionsCount / activeDaysCount) * 100);
    
    return {
      completionsCount,
      completionRate,
      currentStreak,
      longestStreak,
    };
  }, [activeHabit, viewMonth, viewYear]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* View Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
          Monthly Analytics
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">Visualize your habits calendar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Selector, month navigator & stats cards */}
        <div className="flex flex-col gap-6">
          {/* Habit Selector & Month Swapper */}
          <div className="flex flex-col gap-3">
            {/* Habit Selector Dropdown */}
            {habits.length > 0 && (
              <div className="flex flex-col">
                <label className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-muted-text mb-1.5">
                  Select Habit
                </label>
                <select
                  value={activeHabit?._id || ""}
                  onChange={(e) => setSelectedHabitId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card-bg text-sm md:text-base font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
                >
                  {habits.map((habit) => (
                    <option key={habit._id} value={habit._id}>
                      {habit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Selector */}
            <div className="flex items-center justify-between border border-border bg-card-bg rounded-xl px-2 py-1.5 mt-1">
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
          </div>

          {/* Stats Cards */}
          {activeHabit ? (
            <div className="grid grid-cols-2 gap-2 select-none">
              {/* Consistency Rate */}
              <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
                <div className="flex items-center gap-1.5 text-muted-text">
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Consistency</span>
                </div>
                <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                  {stats.completionRate}%
                </span>
                <span className="text-[9px] md:text-xs text-muted-text mt-0.5">For this month</span>
              </div>

              {/* Month Completions */}
              <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
                <div className="flex items-center gap-1.5 text-muted-text">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Completed</span>
                </div>
                <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                  {stats.completionsCount} <span className="text-xs font-normal text-muted-text">days</span>
                </span>
                <span className="text-[9px] md:text-xs text-muted-text mt-0.5">In {MONTHS[viewMonth].slice(0, 3)}</span>
              </div>

              {/* Current Streak */}
              <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
                <div className="flex items-center gap-1.5 text-muted-text">
                  <Flame className="w-3.5 h-3.5 text-black dark:text-white fill-black dark:fill-white" />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-black dark:text-white">Streak</span>
                </div>
                <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                  {stats.currentStreak} <span className="text-xs font-normal text-muted-text">days</span>
                </span>
                <span className="text-[9px] md:text-xs text-muted-text mt-0.5">Current streak</span>
              </div>

              {/* Best Streak */}
              <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
                <div className="flex items-center gap-1.5 text-muted-text">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Best Streak</span>
                </div>
                <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                  {stats.longestStreak} <span className="text-xs font-normal text-muted-text">days</span>
                </span>
                <span className="text-[9px] md:text-xs text-muted-text mt-0.5">All-time record</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Calendar Grid */}
        <div className="md:col-span-2 flex flex-col justify-start">
          {!activeHabit ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg h-full min-h-[300px]">
              <CalendarIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-black dark:text-white">No habits created</h3>
              <p className="text-xs text-muted-text mt-1 max-w-[240px]">
                Please create a habit first to view its calendar heatmap.
              </p>
            </div>
          ) : (
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg">
              {/* Weekday labels */}
              <div className="grid grid-cols-7 text-center mb-3">
                {WEEKDAYS.map((day, idx) => (
                  <span key={idx} className="text-xs md:text-sm font-bold text-muted-text">
                    {day}
                  </span>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-2 gap-x-2 text-center">
                {calendarDays.map((cell, idx) => {
                  if (cell === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const isCompleted = activeHabit.completedDates.includes(cell.dateStr);
                  const isSkipDay = activeHabit.skipDays.includes(cell.jsDayIndex);
                  const isInactive = isBeforeDate(cell.dateStr, activeHabit.createdAt);
                  
                  const canToggle = !cell.isFuture && !isInactive;

                  return (
                    <div key={cell.dateStr} className="aspect-square flex flex-col items-center justify-center gap-0.5">
                      <button
                        disabled={!canToggle}
                        onClick={() => requestToggle(cell.dateStr)}
                        className={`btn-interactive w-full max-w-[44px] md:max-w-[48px] aspect-square rounded-full flex flex-col items-center justify-center text-xs md:text-sm font-bold border relative ${
                          isCompleted
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-sm"
                            : isSkipDay
                            ? "border-dashed border-zinc-400 dark:border-zinc-700 text-muted-text"
                            : "border-transparent text-black dark:text-zinc-100 hover:border-zinc-350 dark:hover:border-zinc-700"
                        } ${
                          !canToggle
                            ? "opacity-30 cursor-not-allowed"
                            : "cursor-pointer select-none"
                        }`}
                      >
                        <span>{cell.day}</span>
                        
                        {/* Today marker dot inside cell */}
                        {cell.isToday && (
                          <span
                            className={`absolute bottom-1.5 w-1 h-1 rounded-full ${
                              isCompleted ? "bg-white dark:bg-black" : "bg-black dark:bg-white"
                            }`}
                          />
                        )}
                      </button>

                      {/* Task indicator dots below the habit circle */}
                      {cell.taskTotal > 0 && (
                        <div className="flex items-center justify-center gap-0.5 h-2">
                          {cell.taskDone === cell.taskTotal ? (
                            // All tasks done — solid filled indicator
                            <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                          ) : (
                            // Partial — show up to 3 hollow dots, filled for done
                            Array.from({ length: Math.min(cell.taskTotal, 3) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full border ${
                                  i < cell.taskDone
                                    ? "bg-black dark:bg-white border-black dark:border-white"
                                    : "border-zinc-400 dark:border-zinc-600 bg-transparent"
                                }`}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation bar */}
      <ConfirmToggleBar
        pending={pendingToggle}
        onConfirm={handleConfirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
