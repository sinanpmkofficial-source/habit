"use client";

import React from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Habit, Task, calculateStreaks, getWeekdayIndex, isBeforeDate } from "@/lib/habit-utils";
import { Flame, Check, PenLine, Plus, AlertCircle, ListTodo, SquareCheck } from "lucide-react";

interface DailyViewProps {
  mode?: "habits-only" | "tasks-only" | "both";
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function DailyView({
  mode = "both",
  onAddHabit,
  onEditHabit,
  onAddTask,
  onEditTask,
}: DailyViewProps) {
  const { habits, selectedDate, toggleHabitCompletion } = useHabitStore();
  const { tasks, toggleTaskCompletion } = useTaskStore();

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

  const habitsSection = (
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
              className="btn-interactive mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Habit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activeHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(selectedDate);
            const isSkipDay = habit.skipDays.includes(weekdayIndex);
            const { currentStreak } = calculateStreaks(habit, selectedDate);

            return (
              <div
                key={habit._id}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all bg-card-bg ${
                  isCompleted
                    ? "border-black/20 dark:border-white/20 bg-neutral-50/50 dark:bg-zinc-900/10"
                    : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                    className={`btn-interactive flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer select-none ${
                      isCompleted
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                        : isSkipDay
                        ? "border-dashed border-zinc-400 dark:border-zinc-700 text-muted-text hover:border-black dark:hover:border-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[2.5] transition-transform duration-200 ${isCompleted ? "scale-100" : "scale-0"}`} />
                  </button>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      onClick={() => toggleHabitCompletion(habit._id!, selectedDate)}
                      className={`text-sm font-semibold cursor-pointer select-none truncate transition-all ${
                        isCompleted ? "line-through text-muted-text" : "text-black dark:text-white"
                      }`}
                    >
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[11px] text-muted-text truncate">
                        {habit.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
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
  );

  const tasksSection = (
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
  );

  return (
    <div className="w-full flex flex-col gap-5 px-4 md:px-6 xl:px-10 py-6 md:py-8">
      {/* Desktop overview strip — shown in both mode */}
      {mode === "both" && (
        <div className="hidden md:flex items-center gap-4 px-5 py-3 rounded-2xl border border-border bg-card-bg">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="19" stroke="var(--border)" strokeWidth="5" fill="transparent" />
              <circle
                cx="24" cy="24" r="19"
                stroke="currentColor" strokeWidth="5" fill="transparent"
                strokeDasharray={2 * Math.PI * 19}
                strokeDashoffset={2 * Math.PI * 19 * (1 - progressPercent / 100)}
                className="text-black dark:text-white transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-black dark:text-white leading-none">{progressPercent}%</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-text font-medium">Overall</span>
              <span className="font-bold text-black dark:text-white">{completedHabits + completedTasks} / {totalHabits + dayTasks.length} done</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-muted-text font-medium">Habits</span>
              <span className="font-bold text-black dark:text-white">{completedHabits}/{totalHabits}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-muted-text font-medium">Tasks</span>
              <span className="font-bold text-black dark:text-white">{completedTasks}/{dayTasks.length}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-muted-text font-medium">Remaining</span>
              <span className="font-bold text-black dark:text-white">{(totalHabits - completedHabits) + (dayTasks.length - completedTasks)}</span>
            </div>
          </div>
          <div className="ml-auto hidden lg:block text-[11px] text-muted-text italic max-w-xs text-right leading-relaxed">
            "Consistency is better than perfection."
          </div>
        </div>
      )}

      {/* Render layout based on mode */}
      {mode === "habits-only" && <div className="w-full max-w-3xl">{habitsSection}</div>}
      {mode === "tasks-only" && <div className="w-full max-w-3xl">{tasksSection}</div>}
      {mode === "both" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
          <div className="flex flex-col gap-6">
            {habitsSection}
            <div className="md:hidden">{tasksSection}</div>
          </div>
          <div className="hidden md:flex flex-col gap-6">{tasksSection}</div>
        </div>
      )}
    </div>
  );
}
