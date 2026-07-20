"use client";

import React, { useState, useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Task, getLocalDateString, isBeforeDate } from "@/lib/habit-utils";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Percent,
  Plus,
  PenLine,
  SquareCheck,
  Calendar as CalendarIcon,
  ListTodo,
} from "lucide-react";

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

interface TaskMonthlyViewProps {
  onAddTaskForDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
}

export default function TaskMonthlyView({
  onAddTaskForDate,
  onEditTask,
}: TaskMonthlyViewProps) {
  const { selectedDate, setSelectedDate } = useHabitStore();
  const { tasks, toggleTaskCompletion } = useTaskStore();

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

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
      const dayTasks = tasks.filter((t) => t.date === dateStr);
      const dayTasksDone = dayTasks.filter((t) => t.completed).length;

      days.push({
        day,
        dateStr,
        isToday,
        dayTasks,
        dayTasksDone,
      });
    }

    return days;
  }, [viewMonth, viewYear, tasks]);

  // Monthly stats calculation
  const monthStats = useMemo(() => {
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const monthTasks = tasks.filter((t) => t.date.startsWith(monthPrefix));
    const completedMonthTasks = monthTasks.filter((t) => t.completed).length;
    const totalMonthTasks = monthTasks.length;
    const completionRate =
      totalMonthTasks > 0
        ? Math.round((completedMonthTasks / totalMonthTasks) * 100)
        : 0;

    return {
      totalMonthTasks,
      completedMonthTasks,
      completionRate,
    };
  }, [viewMonth, viewYear, tasks]);

  // Tasks for the currently selected date
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* Header Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
          Monthly Tasks Overview
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Track and schedule tasks across the month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Month Navigator & Stats */}
        <div className="flex flex-col gap-6">
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
            {/* Total Tasks */}
            <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-muted-text">
                <ListTodo className="w-3.5 h-3.5" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  Total Tasks
                </span>
              </div>
              <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                {monthStats.totalMonthTasks}
              </span>
              <span className="text-[9px] md:text-xs text-muted-text mt-0.5">
                In {MONTHS[viewMonth].slice(0, 3)}
              </span>
            </div>

            {/* Completion Rate */}
            <div className="flex flex-col p-3 rounded-2xl border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-muted-text">
                <Percent className="w-3.5 h-3.5" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                  Done Rate
                </span>
              </div>
              <span className="text-xl md:text-2xl font-extrabold text-black dark:text-white mt-1.5">
                {monthStats.completionRate}%
              </span>
              <span className="text-[9px] md:text-xs text-muted-text mt-0.5">
                {monthStats.completedMonthTasks}/{monthStats.totalMonthTasks} completed
              </span>
            </div>
          </div>

          {/* Selected Day Details Panel */}
          <div className="flex flex-col p-4 rounded-2xl border border-border bg-card-bg gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black dark:text-white">
                  {selectedDate}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted-bg border border-border text-muted-text">
                  {selectedDayTasks.filter((t) => t.completed).length}/
                  {selectedDayTasks.length} Done
                </span>
              </div>
              <button
                onClick={() => onAddTaskForDate(selectedDate)}
                className="btn-interactive flex items-center gap-1 px-2.5 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-muted-text py-3 text-center italic">
                No tasks scheduled for this date.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                      task.completed
                        ? "bg-muted-bg/50 border-border opacity-70"
                        : "bg-card-bg border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTaskCompletion(task._id!)}
                        className={`btn-interactive shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-all ${
                          task.completed
                            ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white"
                        }`}
                      >
                        <SquareCheck
                          className={`w-3 h-3 transition-transform ${
                            task.completed ? "scale-100" : "scale-0"
                          }`}
                        />
                      </button>
                      <span
                        onClick={() => toggleTaskCompletion(task._id!)}
                        className={`font-semibold cursor-pointer select-none truncate ${
                          task.completed
                            ? "line-through text-muted-text"
                            : "text-black dark:text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditTask(task)}
                      className="btn-interactive p-1 text-muted-text hover:text-black dark:hover:text-white shrink-0 ml-1"
                    >
                      <PenLine className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Calendar Grid */}
        <div className="md:col-span-2 flex flex-col justify-start">
          <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg">
            {/* Weekday header */}
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

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {calendarDays.map((cell, idx) => {
                if (cell === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isSelected = cell.dateStr === selectedDate;
                const hasTasks = cell.dayTasks.length > 0;
                const allDone =
                  hasTasks && cell.dayTasksDone === cell.dayTasks.length;

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

                    {/* Task count pill or indicator */}
                    {hasTasks && (
                      <div
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 leading-none ${
                          isSelected
                            ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                            : allDone
                            ? "bg-black dark:bg-white text-white dark:text-black"
                            : "bg-muted-bg text-muted-text border border-border"
                        }`}
                      >
                        {cell.dayTasksDone}/{cell.dayTasks.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
