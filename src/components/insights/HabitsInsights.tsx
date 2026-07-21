"use client";

import React, { useMemo } from "react";
import { Habit, getLocalDateString, addDays, calculateStreaks, getCompletionRate, getWeekdayIndex, isBeforeDate } from "@/lib/habit-utils";
import { Flame, Award, Target, CheckCircle2, TrendingUp, CalendarDays, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitsInsightsProps {
  habits: Habit[];
}

export default function HabitsInsights({ habits }: HabitsInsightsProps) {
  const todayStr = getLocalDateString();

  // High-level stats
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return { totalHabits: 0, overallRate: 0, currentStreak: 0, longestStreak: 0, totalCompletions: 0, bestHabitName: "None" };
    }

    let totalCompletions = 0;
    let totalRateSum = 0;
    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    let bestHabitName = "None";
    let bestHabitRate = -1;

    habits.forEach((habit) => {
      totalCompletions += habit.completedDates.length;
      const rate = getCompletionRate(habit, todayStr);
      totalRateSum += rate;

      const { currentStreak, longestStreak } = calculateStreaks(habit, todayStr);
      if (currentStreak > maxCurrentStreak) maxCurrentStreak = currentStreak;
      if (longestStreak > maxLongestStreak) maxLongestStreak = longestStreak;

      if (rate > bestHabitRate) {
        bestHabitRate = rate;
        bestHabitName = habit.name;
      }
    });

    return {
      totalHabits: habits.length,
      overallRate: Math.round(totalRateSum / habits.length),
      currentStreak: maxCurrentStreak,
      longestStreak: maxLongestStreak,
      totalCompletions,
      bestHabitName,
    };
  }, [habits, todayStr]);

  // 14-day Recharts trend data
  const trendData = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dateStr) => {
      let completions = 0;
      let activeCount = 0;

      habits.forEach((habit) => {
        const isCreated = !isBeforeDate(dateStr, habit.createdAt) || dateStr === habit.createdAt;
        if (isCreated) {
          const skipDaysSet = new Set(habit.skipDays);
          const dayIndex = getWeekdayIndex(dateStr);
          const isSkipDay = skipDaysSet.has(dayIndex);
          const isCompleted = habit.completedDates.includes(dateStr);

          if (isCompleted) {
            completions++;
            activeCount++;
          } else if (!isSkipDay) {
            activeCount++;
          }
        }
      });

      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const weekday = WEEKDAYS_SHORT[dateObj.getDay()];

      return {
        dateStr,
        label: `${weekday} ${d}`,
        Completions: completions,
        TotalActive: activeCount,
        SuccessRate: activeCount > 0 ? Math.round((completions / activeCount) * 100) : 0,
      };
    });
  }, [habits, todayStr]);

  // 28-day Consistency Matrix
  const matrixData = useMemo(() => {
    const list = [];
    for (let i = 27; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dateStr) => {
      let completions = 0;
      let activeCount = 0;

      habits.forEach((habit) => {
        const isCreated = !isBeforeDate(dateStr, habit.createdAt) || dateStr === habit.createdAt;
        if (isCreated) {
          const skipDaysSet = new Set(habit.skipDays);
          const dayIndex = getWeekdayIndex(dateStr);
          const isSkipDay = skipDaysSet.has(dayIndex);
          if (habit.completedDates.includes(dateStr)) {
            completions++;
            activeCount++;
          } else if (!isSkipDay) {
            activeCount++;
          }
        }
      });

      const rate = activeCount > 0 ? completions / activeCount : 0;
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);

      return {
        dateStr,
        dayNum: d,
        monthLabel: dateObj.toLocaleDateString("en-US", { month: "short" }),
        rate,
        completions,
        totalActive: activeCount,
      };
    });
  }, [habits, todayStr]);

  const getMostActiveDay = (habit: Habit) => {
    if (habit.completedDates.length === 0) return "N/A";
    const counts = Array(7).fill(0);
    habit.completedDates.forEach((dateStr) => {
      const idx = getWeekdayIndex(dateStr);
      counts[idx]++;
    });

    let maxIdx = 0;
    let maxVal = 0;
    counts.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });

    return maxVal > 0 ? WEEKDAYS[maxIdx] : "N/A";
  };

  const getConsistencyTier = (rate: number) => {
    if (rate >= 80) return { label: "Elite Consistent", color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30" };
    if (rate >= 50) return { label: "Solid Progress", color: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/30" };
    if (rate > 0) return { label: "Building Phase", color: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30" };
    return { label: "Starting Out", color: "text-zinc-500 bg-zinc-50 border-zinc-100 dark:text-zinc-400 dark:bg-zinc-900/40 dark:border-zinc-800" };
  };

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-border rounded-3xl text-center bg-card-bg">
        <Flame className="w-10 h-10 text-orange-400 mb-3" />
        <h3 className="text-base font-bold text-black dark:text-white">No Habit Data</h3>
        <p className="text-xs text-muted-text mt-1 max-w-[280px]">
          Start adding habits in the Daily view to see streaks and growth curves here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
          Habits & Consistency Analytics
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Track habit streaks, completion trends, and individual progress
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Completion Rate */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Completion Rate</span>
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.overallRate}%
            </span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Overall consistency</span>
          </div>
        </div>

        {/* Card: Active Streak */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.currentStreak}
            </span>
            <span className="text-xs font-bold text-muted-text">days</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Longest current active streak
          </div>
        </div>

        {/* Card: Best Streak */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Record Streak</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.longestStreak}
            </span>
            <span className="text-xs font-bold text-muted-text">days</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            All-time record streak
          </div>
        </div>

        {/* Card: Total Completions */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Total Check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.totalCompletions}
            </span>
            <span className="text-xs font-bold text-muted-text">actions</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Across {stats.totalHabits} active habits
          </div>
        </div>

      </div>

      {/* Chart & Heatmap Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Area Chart (2 cols wide) */}
        <div className="lg:col-span-2 flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">14-Day Completion Trend</span>
              <span className="text-[10px] text-muted-text">Daily habit check-ins over time</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Growth Curve</span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="habitTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(249, 115, 22, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name?: any) => [
                    name === "SuccessRate" ? `${value}%` : value,
                    name === "SuccessRate" ? "Success Rate" : "Completions",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="Completions"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#habitTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 28-day Heatmap Matrix (1 col wide) */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">Consistency Matrix</span>
              <span className="text-[10px] text-muted-text">Last 28 days intensity</span>
            </div>
            <CalendarDays className="w-4 h-4 text-muted-text" />
          </div>

          <div className="grid grid-cols-7 gap-2.5 my-auto justify-items-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-600 w-7 text-center">
                {d}
              </span>
            ))}

            {matrixData.map((day, index) => {
              let cellColor = "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/40";
              if (day.totalActive > 0) {
                if (day.rate >= 0.75) {
                  cellColor = "bg-orange-500 text-white border-orange-500 shadow-sm";
                } else if (day.rate >= 0.4) {
                  cellColor = "bg-orange-400/70 text-white border-orange-400";
                } else if (day.rate > 0) {
                  cellColor = "bg-orange-200 text-black dark:bg-orange-950/60 dark:text-orange-200 border-orange-300 dark:border-orange-800";
                }
              }

              return (
                <div
                  key={index}
                  title={`${day.monthLabel} ${day.dayNum}: ${day.completions}/${day.totalActive} habits (${Math.round(day.rate * 100)}%)`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${cellColor} cursor-default`}
                >
                  {day.dayNum}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-muted-text font-semibold">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            <div className="w-3.5 h-3.5 rounded bg-orange-200 dark:bg-orange-950 border border-orange-300 dark:border-orange-800" />
            <div className="w-3.5 h-3.5 rounded bg-orange-400 border border-orange-400" />
            <div className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-500" />
            <span>More</span>
          </div>
        </div>

      </div>

      {/* Habit-by-Habit Breakdown */}
      <div className="flex flex-col gap-4">
        <span className="text-xs uppercase font-extrabold tracking-wider text-muted-text">
          Individual Habit Progress Breakdown
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const rate = getCompletionRate(habit, todayStr);
            const { currentStreak, longestStreak } = calculateStreaks(habit, todayStr);
            const mostActiveDay = getMostActiveDay(habit);
            const tier = getConsistencyTier(rate);

            return (
              <div
                key={habit._id}
                className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm gap-4 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm md:text-base font-extrabold text-black dark:text-white truncate">
                      {habit.name}
                    </span>
                    {habit.description && (
                      <span className="text-[10px] md:text-xs text-muted-text truncate mt-0.5">
                        {habit.description}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                    <span className="text-muted-text">Consistency Rate</span>
                    <span className="text-black dark:text-white">{rate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-border/50 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-muted-text">Current Streak</span>
                    <div className="flex items-center justify-center gap-0.5 text-xs font-black text-black dark:text-white">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
                      <span>{currentStreak}d</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-muted-text">Best Streak</span>
                    <span className="text-xs font-black text-black dark:text-white">
                      {longestStreak}d
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-muted-text">Peak Day</span>
                    <span className="text-xs font-black text-black dark:text-white truncate">
                      {mostActiveDay}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
