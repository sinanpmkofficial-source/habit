"use client";

import React, { useMemo } from "react";
import { getLocalDateString, addDays } from "@/lib/habit-utils";
import { PrayerKey, PRAYERS } from "@/lib/prayer-utils";
import { Sparkles, CalendarDays, Award, Target, TrendingUp, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface PrayerInsightsProps {
  prayers: Record<string, PrayerKey[]>;
}

export default function PrayerInsights({ prayers }: PrayerInsightsProps) {
  const todayStr = getLocalDateString();

  // High-level Prayer Stats
  const stats = useMemo(() => {
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

  // Breakdown for each of the 5 prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
  const prayerBreakdown = useMemo(() => {
    const dates = Object.keys(prayers);
    const totalDays = Math.max(dates.length, 1);

    const counts: Record<PrayerKey, number> = {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };

    dates.forEach((d) => {
      const list = prayers[d] || [];
      list.forEach((p) => {
        if (counts[p] !== undefined) counts[p]++;
      });
    });

    return PRAYERS.map((p) => {
      const offered = counts[p.key] || 0;
      const rate = Math.round((offered / totalDays) * 100);
      return {
        key: p.key,
        name: p.name,
        arabicName: p.arabicName,
        timePeriod: p.timePeriod,
        Offered: offered,
        Rate: rate,
      };
    });
  }, [prayers]);

  // 14-day prayer trend (0-5 prayers per day)
  const trendData = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dateStr) => {
      const completedList = prayers[dateStr] || [];
      const count = completedList.length;

      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        dateStr,
        label,
        Prayers: count,
        CompletionPct: Math.round((count / 5) * 100),
      };
    });
  }, [prayers, todayStr]);

  // 28-day Prayer Heatmap Matrix
  const matrixData = useMemo(() => {
    const list = [];
    for (let i = 27; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }

    return list.map((dateStr) => {
      const list = prayers[dateStr] || [];
      const count = list.length;
      const rate = count / 5;

      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);

      return {
        dateStr,
        dayNum: d,
        monthLabel: dateObj.toLocaleDateString("en-US", { month: "short" }),
        count,
        rate,
      };
    });
  }, [prayers, todayStr]);

  const getPrayerIcon = (key: PrayerKey) => {
    switch (key) {
      case "fajr":
        return Sunrise;
      case "dhuhr":
        return Sun;
      case "asr":
        return Sun;
      case "maghrib":
        return Sunset;
      case "isha":
        return Moon;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-500" />
          Prayer Routine & Spiritual Growth
        </h2>
        <p className="text-xs md:text-sm text-muted-text mt-0.5">
          Track consistency across the 5 daily prayers (*Salah*)
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Overall Rate */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Overall Consistency</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.overallRate}%
            </span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Across recorded days
          </div>
        </div>

        {/* Card: Today's Prayers */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Today</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.todayCount}
            </span>
            <span className="text-xs font-bold text-muted-text">/ 5 prayers</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Completed today
          </div>
        </div>

        {/* Card: Full 5/5 Days */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Perfect Days</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.fullDaysCount}
            </span>
            <span className="text-xs font-bold text-muted-text">days</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            All 5 daily prayers offered
          </div>
        </div>

        {/* Card: Total Offered */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-text">
            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-wider">Total Offered</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1 mt-3">
            <span className="text-2xl md:text-3xl font-black text-black dark:text-white">
              {stats.totalOffered}
            </span>
            <span className="text-xs font-bold text-muted-text">prayers</span>
          </div>
          <div className="text-[10px] text-muted-text mt-2 font-semibold">
            Across {stats.totalDaysRecorded} days
          </div>
        </div>

      </div>

      {/* Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Area Chart: 14-Day Prayer Flow (2 cols) */}
        <div className="lg:col-span-2 flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">14-Day Prayer Flow</span>
              <span className="text-[10px] text-muted-text">Daily prayers performed (0 to 5)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>Daily Consistency</span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prayerTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <YAxis domain={[0, 5]} tickCount={6} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(16, 185, 129, 0.3)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} / 5 Prayers`, "Completed"]}
                />
                <Area
                  type="monotone"
                  dataKey="Prayers"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#prayerTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 28-Day Prayer Heatmap Matrix (1 col) */}
        <div className="flex flex-col p-5 rounded-2xl border border-border bg-card-bg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-text">Prayer Matrix</span>
              <span className="text-[10px] text-muted-text">28 days completion weight</span>
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
              if (day.count === 5) {
                cellColor = "bg-emerald-500 text-white border-emerald-500 shadow-sm";
              } else if (day.count >= 3) {
                cellColor = "bg-emerald-400/70 text-white border-emerald-400";
              } else if (day.count > 0) {
                cellColor = "bg-emerald-200 text-black dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800";
              }

              return (
                <div
                  key={index}
                  title={`${day.monthLabel} ${day.dayNum}: ${day.count}/5 prayers`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${cellColor} cursor-default`}
                >
                  {day.dayNum}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] text-muted-text font-semibold">
            <span>0</span>
            <div className="w-3.5 h-3.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-400" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-500" />
            <span>5/5</span>
          </div>
        </div>

      </div>

      {/* Individual 5 Prayers Consistency Breakdown */}
      <div className="flex flex-col gap-4">
        <span className="text-xs uppercase font-extrabold tracking-wider text-muted-text">
          Individual Prayer Completion Rates
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {prayerBreakdown.map((p) => {
            const Icon = getPrayerIcon(p.key);

            return (
              <div
                key={p.key}
                className="flex flex-col p-4 rounded-2xl border border-border bg-card-bg shadow-sm gap-3 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-extrabold text-black dark:text-white">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-xs font-serif font-bold text-emerald-600 dark:text-emerald-400">
                    {p.arabicName}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-[10px] font-extrabold">
                    <span className="text-muted-text">{p.timePeriod}</span>
                    <span className="text-black dark:text-white">{p.Rate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-border/50 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${p.Rate}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] text-muted-text font-bold text-center border-t border-border/60 pt-2">
                  {p.Offered} times completed
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
