"use client";

import React, { useMemo } from "react";
import { Task, getLocalDateString, addDays, getWeekdayIndex } from "@/lib/habit-utils";
import { CheckSquare, ListTodo, ClipboardList, Target, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TasksInsightsProps {
  tasks: Task[];
}

export default function TasksInsights({ tasks }: TasksInsightsProps) {
  const todayStr = getLocalDateString();

  // High-level Task stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // This week tasks (Mon-Sun)
    const todayDate = new Date();
    const dayIndex = todayDate.getDay();
    const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
    const mondayStr = addDays(todayStr, mondayOffset);
    const sundayStr = addDays(mondayStr, 6);

    const thisWeek = tasks.filter((t) => t.date >= mondayStr && t.date <= sundayStr);
    const thisWeekCompleted = thisWeek.filter((t) => t.completed).length;

    return { total, completed, pending, rate, thisWeekTotal: thisWeek.length, thisWeekCompleted };
  }, [tasks, todayStr]);

  // 14-day bar chart dataset (Completed vs Total Scheduled per day)
  const dailyTaskTrend = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dStr) => {
      const dayTasks = tasks.filter((t) => t.date === dStr);
      const done = dayTasks.filter((t) => t.completed).length;
      const total = dayTasks.length;

      const [y, m, d] = dStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = `${WEEKDAYS_SHORT[dateObj.getDay()]} ${d}`;

      return {
        dateStr: dStr,
        label,
        Completed: done,
        Pending: Math.max(0, total - done),
        Total: total,
      };
    });
  }, [tasks, todayStr]);

  // Status breakdown for Pie Chart
  const pieData = useMemo(() => {
    return [
      { name: "Completed", value: stats.completed, color: "#3b82f6" },
      { name: "Pending", value: stats.pending, color: "#94a3b8" },
    ];
  }, [stats]);

  // Day of week productivity distribution
  const weekdayProductivity = useMemo(() => {
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);

    tasks.forEach((t) => {
      const idx = getWeekdayIndex(t.date);
      totals[idx]++;
      if (t.completed) counts[idx]++;
    });

    return WEEKDAYS_SHORT.map((day, idx) => ({
      day,
      Completed: counts[idx],
      Total: totals[idx],
    }));
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-border rounded-3xl text-center bg-card-bg">
        <CheckSquare className="w-10 h-10 text-blue-400 mb-3" />
        <h3 className="text-base font-bold text-black dark:text-white">No Task Data</h3>
        <p className="text-xs text-muted-text mt-1 max-w-[280px]">
          Create and complete tasks in the Daily view to see task productivity charts here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-blue-500" />
          Task Productivity & Activity
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Visualize task completion rates, weekly velocity, and daily breakdown
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Total Completed */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Total Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.completed}
            </span>
            <span className="text-xs font-bold text-muted-text">/ {stats.total}</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            All-time completed tasks
          </div>
        </div>

        {/* Card: Completion Rate */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Completion Rate</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.rate}%
            </span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Task execution efficiency
          </div>
        </div>

        {/* Card: This Week Velocity */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">This Week</span>
            <ClipboardList className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.thisWeekCompleted}
            </span>
            <span className="text-xs font-bold text-muted-text">/ {stats.thisWeekTotal}</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Completed during current week
          </div>
        </div>

        {/* Card: Pending Tasks */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.pending}
            </span>
            <span className="text-xs font-bold text-muted-text">tasks</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Tasks awaiting completion
          </div>
        </div>

      </div>

      {/* Main Bar Chart & Donut Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart: 14-Day Activity (2 cols) */}
        <div className="lg:col-span-2 flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">14-Day Task Activity</span>
              <span className="text-[10px] text-muted-text">Tasks completed vs scheduled</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Daily Output</span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTaskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="Completed" fill="#3b82f6" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="Pending" fill="#e2e8f0" radius={[6, 6, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts Donut/Pie Chart: Status Ratio (1 col) */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">Status Breakdown</span>
              <span className="text-[10px] text-muted-text">Completion ratio</span>
            </div>
            <ListTodo className="w-4 h-4 text-muted-text" />
          </div>

          <div className="w-full h-48 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full flex items-center justify-center gap-6 text-xs font-bold pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-black dark:text-white">Completed ({stats.completed})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700" />
              <span className="text-muted-text">Pending ({stats.pending})</span>
            </div>
          </div>
        </div>

      </div>

      {/* Weekday Productivity Distribution */}
      <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
        <div className="flex flex-col mb-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">
            Productivity by Day of Week
          </span>
          <span className="text-[10px] text-muted-text">
            See which days you complete the most tasks
          </span>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayProductivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
