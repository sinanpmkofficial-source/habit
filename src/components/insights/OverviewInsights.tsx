"use client";

import React, { useMemo } from "react";
import { Habit, Task, getLocalDateString, addDays, calculateStreaks, getCompletionRate } from "@/lib/habit-utils";
import { PrayerKey, PRAYERS } from "@/lib/prayer-utils";
import { Flame, CheckSquare, Sparkles, TrendingUp, ArrowRight, Award, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { InsightsTab } from "./InsightsNav";

interface OverviewInsightsProps {
  habits: Habit[];
  tasks: Task[];
  prayers: Record<string, PrayerKey[]>;
  onNavigateTab: (tab: InsightsTab) => void;
}

export default function OverviewInsights({ habits, tasks, prayers, onNavigateTab }: OverviewInsightsProps) {
  const todayStr = getLocalDateString();

  // Habit metrics
  const habitStats = useMemo(() => {
    if (habits.length === 0) return { overallRate: 0, currentStreak: 0, longestStreak: 0, totalCompletions: 0 };

    let totalRateSum = 0;
    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    let totalCompletions = 0;

    habits.forEach((h) => {
      totalCompletions += h.completedDates.length;
      totalRateSum += getCompletionRate(h, todayStr);
      const { currentStreak, longestStreak } = calculateStreaks(h, todayStr);
      if (currentStreak > maxCurrentStreak) maxCurrentStreak = currentStreak;
      if (longestStreak > maxLongestStreak) maxLongestStreak = longestStreak;
    });

    return {
      overallRate: Math.round(totalRateSum / habits.length),
      currentStreak: maxCurrentStreak,
      longestStreak: maxLongestStreak,
      totalCompletions,
    };
  }, [habits, todayStr]);

  // Task metrics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [tasks]);

  // Prayer metrics
  const prayerStats = useMemo(() => {
    const dates = Object.keys(prayers);
    let totalOffered = 0;
    let fullDaysCount = 0;
    const totalDaysRecorded = Math.max(dates.length, 1);

    dates.forEach((d) => {
      const list = prayers[d] || [];
      totalOffered += list.length;
      if (list.length === 5) fullDaysCount++;
    });

    const todayList = prayers[todayStr] || [];
    const todayCount = todayList.length;

    const overallRate = dates.length > 0 ? Math.round((totalOffered / (dates.length * 5)) * 100) : 0;

    return { totalOffered, fullDaysCount, todayCount, overallRate, totalDaysRecorded };
  }, [prayers, todayStr]);

  // Combined 14-day timeline dataset
  const combinedTrendData = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const dStr = addDays(todayStr, -i);
      const [y, m, d] = dStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // Habit completions on date
      let habitDone = 0;
      habits.forEach((h) => {
        if (h.completedDates.includes(dStr)) habitDone++;
      });

      // Tasks completed on date
      const tasksDone = tasks.filter((t) => t.date === dStr && t.completed).length;

      // Prayers completed on date
      const prayersDone = (prayers[dStr] || []).length;

      list.push({
        dateStr: dStr,
        label,
        Habits: habitDone,
        Tasks: tasksDone,
        Prayers: prayersDone,
        TotalScore: habitDone * 2 + tasksDone * 2 + prayersDone * 3,
      });
    }
    return list;
  }, [habits, tasks, prayers, todayStr]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs md:text-sm text-muted-text mt-0.5">
            Holistic insights across your daily habits, task productivity, and prayer routines.
          </p>
        </div>
      </div>

      {/* Top 3 Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Habits Overview */}
        <div
          onClick={() => onNavigateTab("habits")}
          className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs uppercase font-extrabold tracking-wider text-orange-600 dark:text-orange-400">
              Habits Summary
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-black dark:text-white">
              {habitStats.overallRate}%
            </span>
            <span className="text-xs text-muted-text font-bold">consistency</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-text mt-4 pt-3 border-t border-border/60">
            <span className="flex items-center gap-1 font-semibold">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
              {habitStats.currentStreak}d current streak
            </span>
            <ArrowRight className="w-4 h-4 text-muted-text group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Tasks Overview */}
        <div
          onClick={() => onNavigateTab("tasks")}
          className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
              Tasks Summary
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-black dark:text-white">
              {taskStats.rate}%
            </span>
            <span className="text-xs text-muted-text font-bold">completion rate</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-text mt-4 pt-3 border-t border-border/60">
            <span className="font-semibold">
              {taskStats.completed} of {taskStats.total} done
            </span>
            <ArrowRight className="w-4 h-4 text-muted-text group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Prayer Overview */}
        <div
          onClick={() => onNavigateTab("prayers")}
          className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
              Prayer Summary
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-black dark:text-white">
              {prayerStats.todayCount}/5
            </span>
            <span className="text-xs text-muted-text font-bold">today</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-text mt-4 pt-3 border-t border-border/60">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {prayerStats.overallRate}% overall consistency
            </span>
            <ArrowRight className="w-4 h-4 text-muted-text group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Recharts Area Chart: 14-Day Integrated Activity */}
      <div className="flex flex-col p-6 rounded-2xl border border-border bg-card-bg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              14-Day Activity Flow
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Daily completions across Habits, Tasks, and Prayers
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-muted-text">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>Habits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Prayers</span>
            </div>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrayers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-zinc-400 dark:text-zinc-500"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-zinc-400 dark:text-zinc-500"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.5)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                }}
              />
              <Area type="monotone" dataKey="Habits" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHabits)" />
              <Area type="monotone" dataKey="Tasks" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTasks)" />
              <Area type="monotone" dataKey="Prayers" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrayers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Navigation Action Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab("habits")}
          className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted-bg/50 hover:bg-muted-bg transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black dark:text-white">Habits Analytics</span>
              <span className="text-[10px] text-muted-text">Streaks & Habit breakdown</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-text" />
        </button>

        <button
          onClick={() => onNavigateTab("tasks")}
          className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted-bg/50 hover:bg-muted-bg transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black dark:text-white">Tasks Productivity</span>
              <span className="text-[10px] text-muted-text">Daily bar charts & status</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-text" />
        </button>

        <button
          onClick={() => onNavigateTab("prayers")}
          className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted-bg/50 hover:bg-muted-bg transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black dark:text-white">Prayer Consistency</span>
              <span className="text-[10px] text-muted-text">5 daily prayers breakdown</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-text" />
        </button>
      </div>
    </div>
  );
}
