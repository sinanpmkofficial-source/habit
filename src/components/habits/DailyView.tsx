"use client";

import React, { useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit, Task, calculateStreaks, getWeekdayIndex, isBeforeDate, getLocalDateString } from "@/lib/habit-utils";
import { Flame, Check, PenLine, Plus, AlertCircle, ListTodo, SquareCheck } from "lucide-react";

type SectionTab = "all" | "habits" | "tasks";

interface DailyViewProps {
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function DailyView({ onAddHabit, onEditHabit, onAddTask, onEditTask }: DailyViewProps) {
  const { habits, selectedDate, toggleHabitCompletion } = useHabitStore();
  const { tasks, toggleTaskCompletion } = useTaskStore();
  const [sectionTab, setSectionTab] = useState<SectionTab>("all");

  // Filter habits: must be created on or before the selected date
  const activeHabits = habits.filter((habit) => {
    return habit.createdAt === selectedDate || isBeforeDate(habit.createdAt, selectedDate);
  });

  // Filter tasks for selected date
  const dayTasks = tasks.filter((task) => task.date === selectedDate);
  const completedTasks = dayTasks.filter((t) => t.completed).length;

  const completedHabits = activeHabits.filter((h) => h.completedDates.includes(selectedDate)).length;
  const totalHabits = activeHabits.length;
  const progressPercent =
    totalHabits + dayTasks.length > 0
      ? Math.round(((completedHabits + completedTasks) / (totalHabits + dayTasks.length)) * 100)
      : 0;

  const weekdayIndex = getWeekdayIndex(selectedDate);

  const SECTION_TABS: { id: SectionTab; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "habits", label: "Habits", count: activeHabits.length },
    { id: "tasks", label: "Tasks", count: dayTasks.length },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">

      {/* Section pill nav — visible on mobile only */}
      <div className="flex md:hidden items-center gap-1 p-1 rounded-2xl bg-muted-bg/60 dark:bg-zinc-900/60 border border-border w-fit">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSectionTab(tab.id)}
            className={`btn-interactive flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sectionTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-border"
                : "text-muted-text hover:text-black dark:hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none ${
                  sectionTab === tab.id
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-border text-muted-text"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Main Column */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* ── Habits Section ── */}
          {(sectionTab === "all" || sectionTab === "habits") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-text">Habits</h2>
              <button
                onClick={onAddHabit}
                className="btn-interactive shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Habit</span>
              </button>
            </div>

            {activeHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg">
                <AlertCircle className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="text-sm font-semibold text-black dark:text-white">No habits active</h3>
                <p className="text-xs text-muted-text mt-1 max-w-[240px]">
                  {habits.length === 0
                    ? "Start tracking your consistency by creating your first habit."
                    : "No habits were active on this date."}
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
                  const isFuture = selectedDate > getLocalDateString();
                  const isInactive = isBeforeDate(selectedDate, habit.createdAt);
                  const canToggle = !isFuture && !isInactive;

                  return (
                    <div
                      key={habit._id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all bg-card-bg ${
                        isCompleted
                          ? "border-black dark:border-white/40 shadow-sm bg-neutral-50/50 dark:bg-zinc-900/10"
                          : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          disabled={!canToggle}
                          onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                          className={`btn-interactive flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border transition-all ${
                            !canToggle
                              ? "opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800"
                              : "cursor-pointer select-none"
                          } ${
                            isCompleted
                              ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                              : isSkipDay
                              ? "border-dashed border-zinc-400 dark:border-zinc-600 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                              : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                          }`}
                        >
                          <Check className={`w-4 h-4 transition-transform duration-200 ${isCompleted ? "scale-100" : "scale-0"}`} />
                        </button>

                        <div className="flex flex-col min-w-0">
                          <span
                            onClick={() => canToggle && toggleHabitCompletion(habit._id!, selectedDate)}
                            className={`text-sm md:text-base font-semibold truncate ${
                              canToggle ? "cursor-pointer select-none" : "cursor-default"
                            } ${isCompleted ? "line-through text-muted-text" : "text-black dark:text-white"}`}
                          >
                            {habit.name}
                          </span>
                          {habit.description && (
                            <span className="text-[11px] md:text-xs text-muted-text truncate mt-0.5 max-w-[200px] md:max-w-xs">
                              {habit.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-2 shrink-0">
                        <div className="flex flex-col items-end gap-1 select-none">
                          {currentStreak > 0 && (
                            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border bg-muted-bg text-[10px] md:text-xs font-bold text-black dark:text-white">
                              <Flame className="w-3 h-3 text-black dark:text-white fill-black dark:fill-white" />
                              <span>{currentStreak}d</span>
                            </div>
                          )}
                          {isSkipDay && !isCompleted && (
                            <span className="text-[9px] md:text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded border border-dashed border-zinc-300 dark:border-zinc-800 text-muted-text">
                              Skip Day
                            </span>
                          )}
                        </div>
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
          )}

          {/* ── Tasks Section ── */}
          {(sectionTab === "all" || sectionTab === "tasks") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-text">Tasks</h2>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted-bg text-muted-text border border-border">
                    {completedTasks}/{dayTasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={onAddTask}
                className="btn-interactive shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-black dark:text-white hover:border-black dark:hover:border-white hover:bg-muted-bg/50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {dayTasks.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 border border-dashed border-border rounded-2xl bg-card-bg">
                <ListTodo className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                <p className="text-xs text-muted-text">
                  No tasks for this day.{" "}
                  <button
                    onClick={onAddTask}
                    className="underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Add one
                  </button>{" "}
                  — or plan ahead for any date.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all bg-card-bg ${
                      task.completed
                        ? "border-black/20 dark:border-white/20 bg-neutral-50/50 dark:bg-zinc-900/10"
                        : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Square checkbox */}
                      <button
                        onClick={() => toggleTaskCompletion(task._id!)}
                        className={`btn-interactive flex items-center justify-center w-8 h-8 rounded-lg border transition-all cursor-pointer select-none ${
                          task.completed
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                            : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                        }`}
                      >
                        <SquareCheck className={`w-3.5 h-3.5 transition-transform duration-200 ${task.completed ? "scale-100" : "scale-0"}`} />
                      </button>

                      <span
                        onClick={() => toggleTaskCompletion(task._id!)}
                        className={`text-sm font-semibold cursor-pointer select-none truncate transition-all ${
                          task.completed ? "line-through text-muted-text" : "text-black dark:text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => onEditTask(task)}
                      className="btn-interactive ml-2 p-1.5 rounded-lg border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white shrink-0"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Sidebar */}
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

            {/* Circular Progress */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="var(--border)" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="currentColor" strokeWidth="8" fill="transparent"
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
                {completedHabits + completedTasks} of {totalHabits + dayTasks.length} items done
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Habits</span>
                <span className="font-bold text-black dark:text-white">
                  {completedHabits}/{totalHabits}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Tasks</span>
                <span className="font-bold text-black dark:text-white">
                  {completedTasks}/{dayTasks.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-muted-text">Remaining</span>
                <span className="font-bold text-black dark:text-white">
                  {(totalHabits - completedHabits) + (dayTasks.length - completedTasks)}
                </span>
              </div>
            </div>
          </div>

          {/* Tip */}
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
