"use client";

import React, { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { 
  calculateStreaks, 
  getCompletionRate, 
  getLocalDateString, 
  addDays, 
  getWeekdayIndex,
  isBeforeDate,
  Habit 
} from "@/lib/habit-utils";
import { 
  TrendingUp, 
  Award, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Info,
  CalendarDays,
  Target,
  Sparkles
} from "lucide-react";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function InsightsView() {
  const { habits } = useHabitStore();
  const todayStr = getLocalDateString();
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string; percentage: number } | null>(null);

  // 1. High-Level Metrics
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return {
        totalHabits: 0,
        overallRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        bestHabitName: "None",
        bestHabitRate: 0,
      };
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
      bestHabitRate,
    };
  }, [habits, todayStr]);

  // 2. Dynamic 14-Day Completion Trend Data
  const trendData = useMemo(() => {
    // Generate dates from 13 days ago to today (14 days total)
    const list = [];
    for (let i = 13; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dateStr) => {
      // Find how many habits were completed on this date
      let completions = 0;
      let activeCount = 0;

      habits.forEach((habit) => {
        // A habit is active if it was created on or before this date
        const isCreated = !isBeforeDate(dateStr, habit.createdAt) || dateStr === habit.createdAt;
        if (isCreated) {
          const skipDaysSet = new Set(habit.skipDays);
          const dayIndex = getWeekdayIndex(dateStr);
          const isSkipDay = skipDaysSet.has(dayIndex);
          const isCompleted = habit.completedDates.includes(dateStr);

          // We count active habits as those that either are completed, or are not skip days
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
        label,
        weekday,
        completions,
        totalActive: activeCount,
        percentage: activeCount > 0 ? Math.round((completions / activeCount) * 100) : 0,
      };
    });
  }, [habits, todayStr]);

  // 3. Consistency Matrix (Last 28 Days)
  const matrixData = useMemo(() => {
    // 28 days = 4 weeks
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

  // 4. Individual Habit Analysis Helpers
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

  // SVG Line Chart Dimensions and calculations
  const chartWidth = 700;
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartPoints = useMemo(() => {
    const pointsCount = trendData.length;
    const maxVal = Math.max(...trendData.map(d => d.completions), 1);
    const xInterval = (chartWidth - paddingLeft - paddingRight) / (pointsCount - 1);
    const yScale = (chartHeight - paddingTop - paddingBottom) / maxVal;

    return trendData.map((d, index) => {
      const x = paddingLeft + index * xInterval;
      const y = chartHeight - paddingBottom - d.completions * yScale;
      return { x, y, ...d };
    });
  }, [trendData]);

  // SVG Line path generation
  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      
      // Bezier curve approximation for smooth line
      const prev = chartPoints[index - 1];
      const cpX1 = prev.x + (point.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + 2 * (point.x - prev.x) / 3;
      const cpY2 = point.y;
      
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
    }, "");
  }, [chartPoints]);

  // SVG Area path generation (closed loop for gradient fill)
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const firstPoint = chartPoints[0];
    const lastPoint = chartPoints[chartPoints.length - 1];
    return `${linePath} L ${lastPoint.x} ${chartHeight - paddingBottom} L ${firstPoint.x} ${chartHeight - paddingBottom} Z`;
  }, [chartPoints, linePath]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 px-4 py-6 md:py-8 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black dark:text-white">
          Insights & Growth
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Visualize your habits, completion streaks, and weekly consistency
        </p>
      </div>

      {/* No habits empty state */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-border rounded-3xl text-center bg-card-bg">
          <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-base font-bold text-black dark:text-white">No data available</h3>
          <p className="text-xs text-muted-text mt-1 max-w-[260px]">
            Once you add and complete habits, your growth dashboards and streaks will update here.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Grid of metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card: Completion Rate */}
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Completion Rate</span>
                <Target className="w-4 h-4 text-black dark:text-white opacity-80" />
              </div>
              <div className="flex items-baseline gap-1 mt-3.5">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
                  {stats.overallRate}%
                </span>
              </div>
              <div className="text-[10px] text-muted-text mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                <span>Overall consistency</span>
              </div>
            </div>

            {/* Card: Active Streak */}
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Active Streak</span>
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
              </div>
              <div className="flex items-baseline gap-1 mt-3.5">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
                  {stats.currentStreak}
                </span>
                <span className="text-xs font-bold text-muted-text">days</span>
              </div>
              <div className="text-[10px] text-muted-text mt-2">
                Longest current habit streak
              </div>
            </div>

            {/* Card: Best Streak */}
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Best Streak</span>
                <Award className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-1 mt-3.5">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
                  {stats.longestStreak}
                </span>
                <span className="text-xs font-bold text-muted-text">days</span>
              </div>
              <div className="text-[10px] text-muted-text mt-2">
                All-time record streak
              </div>
            </div>

            {/* Card: Total completions */}
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm relative overflow-hidden group hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-muted-text">
                <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Total Actions</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1 mt-3.5">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
                  {stats.totalCompletions}
                </span>
                <span className="text-xs font-bold text-muted-text">completions</span>
              </div>
              <div className="text-[10px] text-muted-text mt-2">
                Across {stats.totalHabits} active habits
              </div>
            </div>

          </div>

          {/* 2. Completion Trend Chart & Consistency Heatmap Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Column (2 spans wide) */}
            <div className="lg:col-span-2 flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">Completions Trend</span>
                  <span className="text-[10px] text-muted-text">Last 14 days of habit checkins</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-text bg-muted-bg border border-border px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3 text-black dark:text-white" />
                  <span>Growth Curve</span>
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="relative w-full overflow-hidden mt-1 select-none">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-line, #000000)" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="var(--color-chart-line, #000000)" stopOpacity="0.00" />
                    </linearGradient>
                    {/* Dark Mode Gradient */}
                    <linearGradient id="chartGradientDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 1, 2, 3].map((val, idx) => {
                    const maxCompletions = Math.max(...trendData.map(d => d.completions), 1);
                    const lineVal = (maxCompletions / 3) * val;
                    const y = chartHeight - paddingBottom - lineVal * ((chartHeight - paddingTop - paddingBottom) / maxCompletions);
                    
                    return (
                      <g key={idx} className="opacity-40">
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-zinc-200 dark:text-zinc-800"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 3}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="end"
                          className="fill-zinc-400 dark:fill-zinc-600 font-sans"
                        >
                          {Math.round(lineVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Area under the curve */}
                  <path
                    d={areaPath}
                    fill="url(#chartGradient)"
                    className="dark:hidden"
                  />
                  <path
                    d={areaPath}
                    fill="url(#chartGradientDark)"
                    className="hidden dark:block"
                  />

                  {/* Bezier Curve Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-black dark:text-white"
                  />

                  {/* Interactive Nodes */}
                  {chartPoints.map((point, index) => {
                    const isHovered = hoveredPoint?.label === point.label;
                    return (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isHovered ? 6 : 4}
                          className={`stroke-white dark:stroke-black transition-all ${
                            isHovered 
                              ? "fill-black dark:fill-white stroke-[2.5]" 
                              : "fill-zinc-800 dark:fill-zinc-200 stroke-[1.5]"
                          }`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPoint({
                              x: point.x,
                              y: point.y,
                              label: point.label,
                              value: `${point.completions} of ${point.totalActive} Habits`,
                              percentage: point.percentage,
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {/* Day Labels below chart */}
                        {index % 2 === 0 && (
                          <text
                            x={point.x}
                            y={chartHeight - 8}
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="fill-zinc-400 dark:fill-zinc-500 font-sans"
                          >
                            {point.weekday} {point.dateStr.split("-")[2]}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay (Absolute Positioned HTML overlay) */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 bg-black/90 dark:bg-zinc-950/90 text-white rounded-xl p-2.5 shadow-lg border border-zinc-800 pointer-events-none text-[10px] md:text-xs flex flex-col gap-0.5 animate-fade-in"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${Math.max(0, (hoveredPoint.y / chartHeight) * 100 - 32)}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <span className="font-extrabold text-zinc-400">{hoveredPoint.label}</span>
                    <span className="font-black text-white">{hoveredPoint.value}</span>
                    <span className="font-bold text-emerald-400">{hoveredPoint.percentage}% success</span>
                  </div>
                )}
              </div>
            </div>

            {/* Consistency Heatmap Matrix (1 span wide) */}
            <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">Consistency Matrix</span>
                  <span className="text-[10px] text-muted-text">Last 28 days completion weight</span>
                </div>
                <CalendarDays className="w-4 h-4 text-muted-text" />
              </div>

              {/* Heatmap Grid */}
              <div className="grid grid-cols-7 gap-2.5 my-auto justify-items-center">
                {/* Weekday headers */}
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-600 w-7 text-center">
                    {d}
                  </span>
                ))}

                {/* 28 cells */}
                {matrixData.map((day, index) => {
                  let cellColor = "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/40";
                  let hoverBorder = "hover:border-zinc-400 dark:hover:border-zinc-600";
                  
                  if (day.totalActive > 0) {
                    if (day.rate >= 0.75) {
                      cellColor = "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm";
                    } else if (day.rate >= 0.4) {
                      cellColor = "bg-zinc-700 text-white dark:bg-zinc-200 dark:text-black border-zinc-700 dark:border-zinc-200";
                    } else if (day.rate > 0) {
                      cellColor = "bg-zinc-300 text-black dark:bg-zinc-700 dark:text-white border-zinc-300 dark:border-zinc-700";
                    }
                  }

                  return (
                    <div
                      key={index}
                      title={`${day.monthLabel} ${day.dayNum}: ${day.completions}/${day.totalActive} habits (${Math.round(day.rate * 100)}%)`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${cellColor} ${hoverBorder} cursor-default`}
                    >
                      {day.dayNum}
                    </div>
                  );
                })}
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-muted-text font-semibold">
                <span>Less</span>
                <div className="w-3.5 h-3.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                <div className="w-3.5 h-3.5 rounded bg-zinc-300 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-700" />
                <div className="w-3.5 h-3.5 rounded bg-zinc-700 dark:bg-zinc-200 border border-zinc-700 dark:border-zinc-200" />
                <div className="w-3.5 h-3.5 rounded bg-black dark:bg-white border border-black dark:border-white" />
                <span>More</span>
              </div>
            </div>

          </div>

          {/* 3. Habit-by-Habit Breakdown */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider text-muted-text">
              Habit Consistency Breakdown
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
                    className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm md:text-base font-extrabold text-black dark:text-white truncate">
                          {habit.name}
                        </span>
                        {habit.description && (
                          <span className="text-[10px] md:text-xs text-muted-text truncate mt-0.5 max-w-[240px] md:max-w-xs">
                            {habit.description}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[10px] font-extrabold">
                        <span className="text-muted-text">Consistency Rate</span>
                        <span className="text-black dark:text-white">{rate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-border/50 overflow-hidden">
                        <div
                          className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats details grid */}
                    <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                      
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase font-bold text-muted-text">Streak</span>
                        <div className="flex items-center justify-center gap-0.5 text-xs font-black text-black dark:text-white">
                          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10 stroke-[2.25]" />
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
                        <span className="text-xs font-black text-black dark:text-white truncate px-1">
                          {mostActiveDay}
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
