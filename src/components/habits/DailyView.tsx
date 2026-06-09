"use client";

import React from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit, calculateStreaks, getWeekdayIndex, isBeforeDate, getLocalDateString } from "@/lib/habit-utils";
import { Flame, Check, PenLine, Plus, AlertCircle } from "lucide-react";

interface DailyViewProps {
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

export default function DailyView({ onAddHabit, onEditHabit }: DailyViewProps) {
  const { habits, selectedDate, toggleHabitCompletion } = useHabitStore();

  // Filter habits: must be created on or before the selected date
  const activeHabits = habits.filter((habit) => {
    // habit.createdAt is YYYY-MM-DD
    return habit.createdAt === selectedDate || isBeforeDate(habit.createdAt, selectedDate);
  });

  const weekdayIndex = getWeekdayIndex(selectedDate);

  const formattedHeaderDate = React.useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    const isToday = selectedDate === getLocalDateString();
    const isYesterday = selectedDate === getLocalDateString(new Date(Date.now() - 86400000));
    const isTomorrow = selectedDate === getLocalDateString(new Date(Date.now() + 86400000));

    let relativeDay = "";
    if (isToday) relativeDay = "Today, ";
    else if (isYesterday) relativeDay = "Yesterday, ";
    else if (isTomorrow) relativeDay = "Tomorrow, ";

    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    return relativeDay + date.toLocaleDateString("en-US", options);
  }, [selectedDate]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">
            Daily View
          </h2>
          <p className="text-xs text-muted-text mt-0.5">{formattedHeaderDate}</p>
        </div>
        <button
          onClick={onAddHabit}
          className="btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits List */}
      {activeHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg">
          <AlertCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-black dark:text-white">No habits active</h3>
          <p className="text-xs text-muted-text mt-1 max-w-[240px]">
            {habits.length === 0 
              ? "Start tracking your consistency by creating your first habit."
              : "No habits were active on this date. Try switching to Today or check your settings."}
          </p>
          {habits.length === 0 && (
            <button
              onClick={onAddHabit}
              className="btn-interactive mt-4 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold shadow-sm"
            >
              Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(selectedDate);
            const isSkipDay = habit.skipDays.includes(weekdayIndex);
            const { currentStreak } = calculateStreaks(habit, selectedDate);

            return (
              <div
                key={habit._id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all bg-card-bg ${
                  isCompleted
                    ? "border-black dark:border-white/40 shadow-sm bg-neutral-50/50 dark:bg-zinc-900/10"
                    : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                {/* Habit details and completion checkbox */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Tactical Checkbox */}
                  <button
                    onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                    className={`btn-interactive flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer select-none transition-all ${
                      isCompleted
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                        : isSkipDay
                        ? "border-dashed border-zinc-400 dark:border-zinc-600 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                    }`}
                  >
                    <Check className={`w-4 h-4 transition-transform duration-200 ${isCompleted ? "scale-100" : "scale-0"}`} />
                  </button>

                  {/* Habit info */}
                  <div className="flex flex-col min-w-0">
                    <span
                      onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                      className={`text-sm font-semibold truncate cursor-pointer select-none ${
                        isCompleted ? "line-through text-muted-text" : "text-black dark:text-white"
                      }`}
                    >
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[11px] text-muted-text truncate mt-0.5 max-w-[200px]">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right actions: streaks & edit */}
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  {/* Streak & Skip indicators */}
                  <div className="flex flex-col items-end gap-1 select-none">
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border bg-muted-bg text-[10px] font-bold text-black dark:text-white">
                        <Flame className="w-3 h-3 text-black dark:text-white fill-black dark:fill-white" />
                        <span>{currentStreak}d</span>
                      </div>
                    )}
                    {isSkipDay && !isCompleted && (
                      <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border border-dashed border-zinc-300 dark:border-zinc-800 text-muted-text">
                        Skip Day
                      </span>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditHabit(habit)}
                    className="btn-interactive p-1.5 rounded-lg border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
