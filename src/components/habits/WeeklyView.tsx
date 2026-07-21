"use client";

import React, { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit, calculateStreaks, getWeekdayIndex, isBeforeDate, getLocalDateString, addDays } from "@/lib/habit-utils";
import { Flame, Check, HelpCircle, ListTodo, CheckSquare } from "lucide-react";
import ConfirmToggleBar, { PendingToggle } from "@/components/habits/ConfirmToggleBar";

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeeklyViewProps {
  onGoToDaily?: () => void;
}

export default function WeeklyView({ onGoToDaily }: WeeklyViewProps = {}) {
  const { habits, selectedDate, toggleHabitCompletion, setSelectedDate } = useHabitStore();
  const { tasks } = useTaskStore();
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  const todayStr = getLocalDateString();

  // Calculate the Monday-to-Sunday week dates containing selectedDate
  const weekDaysInfo = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayIndex = dateObj.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const mondayStr = addDays(selectedDate, mondayOffset);

    return Array.from({ length: 7 }).map((_, i) => {
      const dateStr = addDays(mondayStr, i);
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);

      const jsDayIndex = date.getDay();
      const label = WEEKDAYS_SHORT[i];
      const dayNum = date.getDate();

      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      // Task counts for this day
      const dayTasks = tasks.filter((t) => t.date === dateStr);
      const dayTasksDone = dayTasks.filter((t) => t.completed).length;

      return {
        dateStr,
        label,
        dayNum,
        jsDayIndex,
        isToday,
        isFuture,
        taskTotal: dayTasks.length,
        taskDone: dayTasksDone,
      };
    });
  }, [selectedDate, todayStr, tasks]);

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

  // Total tasks this week
  const weekTaskTotal = weekDaysInfo.reduce((s, d) => s + d.taskTotal, 0);
  const weekTaskDone = weekDaysInfo.reduce((s, d) => s + d.taskDone, 0);

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (onGoToDaily) {
      onGoToDaily();
    }
  };

  const requestToggle = (habit: Habit, dateStr: string) => {
    setPendingToggle({
      habitId: habit._id!,
      dateStr,
      habitName: habit.name,
      isCurrentlyCompleted: habit.completedDates.includes(dateStr),
    });
  };

  const handleConfirmToggle = () => {
    if (!pendingToggle) return;
    toggleHabitCompletion(pendingToggle.habitId, pendingToggle.dateStr);
    setPendingToggle(null);
  };

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6 px-3 md:px-6 xl:px-10 py-3 md:py-6">
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
        <div className="flex flex-col gap-2.5 md:gap-4">
          {habits.map((habit) => {
            const { currentStreak, longestStreak } = calculateStreaks(habit, todayStr);

            return (
              <div
                key={habit._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-border bg-card-bg hover:border-zinc-400 dark:hover:border-zinc-700 transition-all gap-3 md:gap-4"
              >
                {/* Info & Stats Section */}
                <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 min-w-0 md:w-1/3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs md:text-base font-bold text-black dark:text-white break-words whitespace-normal leading-snug">
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[10px] md:text-xs text-muted-text break-words whitespace-normal leading-tight mt-0.5">
                        {habit.description}
                      </span>
                    )}
                  </div>

                  {/* Streaks */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none md:mt-1.5 ml-2 md:ml-0">
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border bg-muted-bg text-[9px] md:text-xs font-bold text-black dark:text-white">
                        <Flame className="w-2.5 h-2.5 fill-black dark:fill-white text-black dark:text-white" />
                        <span>{currentStreak}d</span>
                      </div>
                    )}
                    <span className="text-[9px] md:text-xs font-medium text-muted-text border border-border px-1.5 py-0.5 rounded-full bg-muted-bg">
                      Best: {longestStreak}d
                    </span>
                  </div>
                </div>

                {/* 7 days horizontal reel */}
                <div className="flex justify-between items-center bg-muted-bg/40 dark:bg-muted-bg/10 rounded-xl p-1.5 md:p-2 border border-border/50 md:flex-1 md:max-w-xl">
                  {weekDaysInfo.map((day) => {
                    const isCompleted = habit.completedDates.includes(day.dateStr);
                    const isSkipDay = habit.skipDays.includes(day.jsDayIndex);

                    const isInactive = isBeforeDate(day.dateStr, habit.createdAt);
                    const canToggle = !day.isFuture && !isInactive;

                    return (
                      <button
                        key={day.dateStr}
                        disabled={!canToggle}
                        onClick={() => requestToggle(habit, day.dateStr)}
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

      {/* ── Tasks This Week ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-text">
              Tasks This Week
            </span>
            {weekTaskTotal > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted-bg text-muted-text border border-border">
                {weekTaskDone}/{weekTaskTotal}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-text">Tap a day to open it</span>
        </div>

        <div className="flex flex-col p-4 rounded-2xl border border-border bg-card-bg gap-3">
          {/* 7-column day row */}
          <div className="grid grid-cols-7 gap-2">
            {weekDaysInfo.map((day) => {
              const allDone = day.taskTotal > 0 && day.taskDone === day.taskTotal;
              const partial = day.taskTotal > 0 && day.taskDone > 0 && !allDone;
              const hasNone = day.taskTotal === 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`btn-interactive flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                    day.isToday
                      ? "border-black dark:border-white bg-muted-bg/50"
                      : "border-border hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  {/* Day label */}
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-muted-text">
                    {day.label[0]}
                  </span>
                  <span className={`text-xs font-bold ${day.isToday ? "text-black dark:text-white" : "text-black dark:text-white"}`}>
                    {day.dayNum}
                  </span>

                  {/* Task status indicator */}
                  {hasNone ? (
                    <div className="w-5 h-5 rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                      <span className="text-[8px] text-zinc-300 dark:text-zinc-700">—</span>
                    </div>
                  ) : allDone ? (
                    <div className="w-5 h-5 rounded-md bg-black dark:bg-white flex items-center justify-center">
                      <CheckSquare className="w-3 h-3 text-white dark:text-black" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-5 h-5 rounded-md bg-muted-bg dark:bg-zinc-800 border border-border flex items-center justify-center">
                        <span className="text-[9px] font-black text-black dark:text-white leading-none">
                          {day.taskDone}/{day.taskTotal}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {weekTaskTotal === 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <ListTodo className="w-4 h-4 text-zinc-300 dark:text-zinc-700 shrink-0" />
              <p className="text-xs text-muted-text">
                No tasks planned this week. Go to Daily view to add tasks.
              </p>
            </div>
          )}
          {/* Task section end marker */}
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
