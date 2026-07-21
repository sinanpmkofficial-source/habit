"use client";

import React, { useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { Task, getLocalDateString, addDays } from "@/lib/habit-utils";
import { CheckSquare, SquareCheck, Check, Plus, PenLine, CalendarDays, ListTodo, ChevronUp, ChevronDown } from "lucide-react";

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TaskWeeklyViewProps {
  onAddTaskForDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onGoToDaily?: () => void;
}

export default function TaskWeeklyView({
  onAddTaskForDate,
  onEditTask,
  onGoToDaily,
}: TaskWeeklyViewProps) {
  const { selectedDate, setSelectedDate } = useHabitStore();
  const { tasks, toggleTaskCompletion, reorderTask } = useTaskStore();

  const todayStr = getLocalDateString();

  // Calculate Monday to Sunday week dates containing selectedDate
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

      const label = WEEKDAYS_SHORT[i];
      const dayNum = date.getDate();
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      // Filter tasks for this day
      const dayTasks = tasks.filter((t) => t.date === dateStr);
      const dayTasksDone = dayTasks.filter((t) => t.completed).length;

      return {
        dateStr,
        label,
        dayNum,
        isToday,
        isSelected,
        dayTasks,
        dayTasksDone,
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

  // Overall week task stats
  const totalTasksThisWeek = weekDaysInfo.reduce((acc, d) => acc + d.dayTasks.length, 0);
  const completedTasksThisWeek = weekDaysInfo.reduce((acc, d) => acc + d.dayTasksDone, 0);
  const progressPercent =
    totalTasksThisWeek > 0 ? Math.round((completedTasksThisWeek / totalTasksThisWeek) * 100) : 0;

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6 px-3 md:px-6 xl:px-10 py-3 md:py-6">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
            Weekly Tasks Overview
          </h2>
          <p className="text-xs md:text-sm text-muted-text mt-0.5">{formattedWeekRange}</p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-border bg-card-bg w-fit whitespace-nowrap shrink-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-black dark:text-white" />
            <span className="text-xs font-bold text-black dark:text-white">
              {completedTasksThisWeek} / {totalTasksThisWeek} Done
            </span>
          </div>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-muted-bg text-black dark:text-white border border-border">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Grid of 7 days */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 md:gap-3">
        {weekDaysInfo.map((day) => {
          const isCurrentSelected = day.dateStr === selectedDate;

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col rounded-xl md:rounded-2xl border transition-all p-2.5 md:p-3.5 bg-card-bg ${
                isCurrentSelected
                  ? "border-black dark:border-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : day.isToday
                  ? "border-zinc-400 dark:border-zinc-600"
                  : "border-border"
              }`}
            >
              {/* Day Header */}
              <div
                onClick={() => handleSelectDay(day.dateStr)}
                className="flex items-center justify-between cursor-pointer select-none pb-1.5 md:pb-2 border-b border-border mb-2"
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
                  className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${
                    isCurrentSelected
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-black dark:text-white"
                  }`}
                >
                  {day.dayNum}
                </span>
              </div>

              {/* Tasks List for Day */}
              <div className="flex flex-col gap-1.5 md:gap-2 flex-1 min-h-[60px] md:min-h-[80px]">
                {day.dayTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-3 text-center">
                    <span className="text-[11px] text-muted-text italic">No tasks</span>
                  </div>
                ) : (
                  day.dayTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`flex items-start justify-between p-1.5 md:p-2 rounded-xl border text-xs transition-all ${
                        task.completed
                          ? "bg-muted-bg/40 border-border opacity-60"
                          : "bg-muted-bg/20 border-border hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => toggleTaskCompletion(task._id!)}
                          className={`btn-interactive shrink-0 flex items-center justify-center w-5 h-5 rounded-md border mt-0.5 transition-all cursor-pointer select-none ${
                            task.completed
                              ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-xs"
                              : "border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent hover:border-black dark:hover:border-white"
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 stroke-[3] transition-transform duration-200 ${
                              task.completed ? "scale-100" : "scale-0"
                            }`}
                          />
                        </button>
                        <span
                          onClick={() => toggleTaskCompletion(task._id!)}
                          className={`font-semibold cursor-pointer select-none leading-snug break-words ${
                            task.completed ? "line-through text-muted-text" : "text-black dark:text-white"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <button
                          onClick={() => reorderTask(task._id!, "up")}
                          className="btn-interactive p-1 text-muted-text hover:text-black dark:hover:text-white"
                          title="Move task up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => reorderTask(task._id!, "down")}
                          className="btn-interactive p-1 text-muted-text hover:text-black dark:hover:text-white"
                          title="Move task down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="btn-interactive p-1 text-muted-text hover:text-black dark:hover:text-white"
                          title="Edit task"
                        >
                          <PenLine className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add task button for this specific day */}
              <button
                onClick={() => onAddTaskForDate(day.dateStr)}
                className="btn-interactive mt-2 pt-2 border-t border-dashed border-border flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-text hover:text-black dark:hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
