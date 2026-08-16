"use client";

import React from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit, calculateStreaks, isFixedSkipDay, getFlexibleSkipStatus, isBeforeDate, getLocalDateString } from "@/lib/habit-utils";
import { Flame, Check, PenLine, AlertCircle } from "lucide-react";

interface DailyViewProps {
  onEditHabit: (habit: Habit) => void;
}

export default function DailyView({ onEditHabit }: DailyViewProps) {
  const { habits, selectedDate, setSelectedDate, toggleHabitCompletion } = useHabitStore();

  // Filter habits: must be created on or before the selected date
  const activeHabits = habits.filter((habit) => {
    // habit.createdAt is YYYY-MM-DD
    return habit.createdAt === selectedDate || isBeforeDate(habit.createdAt, selectedDate);
  });

  const completedCount = activeHabits.filter((h) => h.completedDates.includes(selectedDate)).length;
  const totalCount = activeHabits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todayStr = getLocalDateString();

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* 2-column layout: 1 col on mobile, grid on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Column: Header and Checklist */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Habits List */}
          {activeHabits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg">
              <AlertCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-semibold text-black dark:text-white">No habits active</h3>
              <p className="text-xs text-muted-text mt-1 max-w-[240px]">
                {habits.length === 0 
                  ? "Manage and add your habits in Settings."
                  : "No habits were active on this date. Try switching to Today or check your settings."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {activeHabits.map((habit) => {
                const isCompleted = habit.completedDates.includes(selectedDate);
                const isFlexible = habit.skipMode === "flexible";
                const isSkipDay = isFlexible ? false : isFixedSkipDay(habit, selectedDate);
                const flexStatus =
                  isFlexible && selectedDate === todayStr ? getFlexibleSkipStatus(habit, todayStr) : null;
                const { currentStreak } = calculateStreaks(habit, selectedDate);
                const isFuture = selectedDate > todayStr;
                const isInactive = isBeforeDate(selectedDate, habit.createdAt);
                const canToggle = !isFuture && !isInactive;

                return (
                  <div
                    key={habit._id}
                    className={`flex items-center justify-between p-3 md:p-3.5 rounded-xl border transition-all bg-card-bg ${
                      isCompleted
                        ? "border-black dark:border-white/40 shadow-sm bg-neutral-50/50 dark:bg-zinc-900/10"
                        : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Habit details and completion checkbox */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Tactical Checkbox */}
                      <button
                        disabled={!canToggle}
                        onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                        className={`btn-interactive flex items-center justify-center w-6.5 h-6.5 md:w-7 md:h-7 rounded-full border transition-all ${
                          !canToggle
                            ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                            : "cursor-pointer select-none"
                        } ${
                          isCompleted
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                            : isSkipDay || (flexStatus && flexStatus.remaining > 0)
                            ? "border-dashed border-zinc-400 dark:border-zinc-600 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                            : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 md:w-3.5 md:h-3.5 transition-transform duration-200 ${isCompleted ? "scale-100" : "scale-0"}`} />
                      </button>

                      {/* Habit info */}
                      <div className="flex flex-col min-w-0">
                        <span
                          onClick={() => canToggle && toggleHabitCompletion(habit._id!, selectedDate)}
                          className={`text-xs md:text-sm font-semibold truncate ${
                            canToggle ? "cursor-pointer select-none" : "cursor-default"
                          } ${
                            isCompleted ? "line-through text-muted-text" : "text-black dark:text-white"
                          }`}
                        >
                          {habit.name}
                        </span>
                        {habit.description && (
                          <span className="text-[10px] md:text-[11px] text-muted-text truncate mt-0.5 max-w-[200px] md:max-w-xs">
                            {habit.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right actions: streaks & edit */}
                    <div className="flex items-center gap-2.5 ml-2 shrink-0">
                      {/* Streak & Skip indicators */}
                      <div className="flex flex-col items-end gap-0.5 select-none">
                        {currentStreak > 0 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-border bg-muted-bg text-[9px] md:text-[10px] font-bold text-black dark:text-white">
                            <Flame className="w-2.5 h-2.5 text-black dark:text-white fill-black dark:fill-white" />
                            <span>{currentStreak}d</span>
                          </div>
                        )}
                        {isSkipDay && !isCompleted && (
                          <span className="text-[8px] md:text-[9px] font-semibold tracking-wide uppercase px-1 py-0.5 rounded border border-dashed border-zinc-300 dark:border-zinc-800 text-muted-text">
                            Skip Day
                          </span>
                        )}
                        {flexStatus && !isCompleted && (
                          <span className="text-[8px] md:text-[9px] font-semibold tracking-wide uppercase px-1 py-0.5 rounded border border-dashed border-zinc-300 dark:border-zinc-800 text-muted-text">
                            {flexStatus.remaining > 0 ? "Flex Skip Available" : "Flex Skip Used"}
                          </span>
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="btn-interactive p-1 rounded-md border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
                      >
                        <PenLine className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column: Metrics */}
        <div className="hidden md:flex flex-col gap-6">
          <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm md:text-base font-bold text-black dark:text-white">
                Today's Overview
              </h3>
              <p className="text-[11px] md:text-xs text-muted-text mt-0.5">
                Your consistency summary
              </p>
            </div>

            {/* Circular Progress Bar */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="var(--border)"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-zinc-200 dark:text-zinc-850"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercent / 100)}
                    className="text-black dark:text-white transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg md:text-xl font-black text-black dark:text-white">
                    {progressPercent}%
                  </span>
                  <span className="text-[9px] md:text-xs text-muted-text font-bold uppercase tracking-wider">
                    Done
                  </span>
                </div>
              </div>

              <span className="text-xs md:text-sm font-semibold text-black dark:text-white mt-4 text-center">
                {completedCount} of {totalCount} habits completed
              </span>
            </div>

            {/* Micro Stats List */}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Active Habits</span>
                <span className="font-bold text-black dark:text-white">{totalCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Completed</span>
                <span className="font-bold text-black dark:text-white">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Remaining</span>
                <span className="font-bold text-black dark:text-white">{totalCount - completedCount}</span>
              </div>
            </div>
          </div>

          {/* Productivity Quote */}
          <div className="flex flex-col p-5 rounded-2xl border border-border bg-muted-bg/40 dark:bg-muted-bg/10 gap-2">
            <span className="text-[10px] md:text-[11px] font-bold tracking-wider uppercase text-muted-text">
              Consistency Tip
            </span>
            <p className="text-xs md:text-sm text-muted-text leading-relaxed">
              "Consistency is better than perfection. Missing one day is an accident. Missing two days is the start of a new habit."
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
