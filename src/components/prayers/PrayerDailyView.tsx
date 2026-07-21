"use client";

import React from "react";
import { useHabitStore } from "@/store/habit-store";
import { usePrayerStore } from "@/store/prayer-store";
import { PRAYERS, PrayerKey } from "@/lib/prayer-utils";
import { Check, Moon, Sun, Sunset, Sunrise, Sparkles } from "lucide-react";

const PRAYER_ICONS: Record<PrayerKey, React.ComponentType<{ className?: string }>> = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Sunset,
  isha: Moon,
};

export default function PrayerDailyView() {
  const { selectedDate } = useHabitStore();
  const { prayers, togglePrayerCompletion } = usePrayerStore();

  const completedList = prayers[selectedDate] || [];
  const completedCount = completedList.length;
  const progressPercent = Math.round((completedCount / PRAYERS.length) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 md:gap-6 px-3 md:px-6 py-3 md:py-6">
      {/* Daily Prayer Overview Card */}
      <div className="flex items-center justify-between p-3.5 md:p-5 rounded-2xl border border-border bg-card-bg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-extrabold text-black dark:text-white">
              Daily Prayers
            </h2>
            {completedCount === 5 && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">
                <Sparkles className="w-3 h-3" /> All Done
              </span>
            )}
          </div>
          <p className="text-xs text-muted-text">
            {completedCount} of 5 prayers completed for {selectedDate}
          </p>
        </div>

        {/* Circular progress */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="var(--border)"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * (1 - progressPercent / 100)}
              className="text-black dark:text-white transition-all duration-500 ease-out"
            />
          </svg>
          <span className="absolute text-xs font-black text-black dark:text-white">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* 5 Prayer Rows */}
      <div className="flex flex-col gap-2 md:gap-3">
        {PRAYERS.map((prayer) => {
          const isCompleted = completedList.includes(prayer.key);
          const Icon = PRAYER_ICONS[prayer.key];

          return (
            <div
              key={prayer.key}
              onClick={() => togglePrayerCompletion(selectedDate, prayer.key)}
              className={`btn-interactive flex items-center justify-between p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border transition-all cursor-pointer select-none ${
                isCompleted
                  ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-md"
                  : "bg-card-bg border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-black dark:text-white"
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                    isCompleted
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                      : "bg-muted-bg text-black dark:text-white border border-border"
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-extrabold break-words whitespace-normal leading-snug">
                      {prayer.name}
                    </span>
                    <span
                      className={`text-xs font-serif opacity-70 dir-rtl ${
                        isCompleted ? "text-white/80 dark:text-black/80" : "text-muted-text"
                      }`}
                    >
                      {prayer.arabicName}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      isCompleted ? "text-white/70 dark:text-black/70" : "text-muted-text"
                    }`}
                  >
                    {prayer.timePeriod}
                  </span>
                </div>
              </div>

              {/* Checkbox button */}
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all shrink-0 ml-2 ${
                  isCompleted
                    ? "bg-white text-black dark:bg-black dark:text-white border-white dark:border-black"
                    : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3] transition-transform ${
                    isCompleted ? "scale-100" : "scale-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
