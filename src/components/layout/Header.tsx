"use client";

import React, { useMemo } from "react";
import { useHabitStore } from "@/store/habit-store";
import { getLocalDateString, addDays, getWeekdayIndex } from "@/lib/habit-utils";
import { Calendar, Layers, BarChart2, Settings, Wifi, WifiOff } from "lucide-react";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Header() {
  const {
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    dbConnected,
  } = useHabitStore();

  // Generate 7 days around the currently selected date (3 days before, selected day, 3 days after)
  const dateReel = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const dateStr = addDays(selectedDate, i);
      const [year, month, day] = dateStr.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayName = WEEKDAYS_SHORT[dateObj.getDay()];
      const dayNum = dateObj.getDate();
      
      const isToday = dateStr === getLocalDateString();
      
      days.push({
        dateStr,
        dayName,
        dayNum,
        isToday,
      });
    }
    return days;
  }, [selectedDate]);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (activeTab !== "daily") {
      setActiveTab("daily");
    }
  };

  const navItems = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "weekly", label: "Weekly", icon: Layers },
    { id: "monthly", label: "Monthly", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md dark:bg-black/95 px-4 md:px-8 py-3 md:py-4 flex flex-col gap-3">
      {/* Branding and Navigation row */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span 
            className="text-2xl md:text-3xl font-extrabold tracking-tighter text-black dark:text-white cursor-pointer select-none"
            onClick={() => {
              setSelectedDate(getLocalDateString());
              setActiveTab("daily");
            }}
          >
            habit.
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border border-border bg-muted-bg text-muted-text">
            {dbConnected ? (
              <>
                <Wifi className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-900 dark:text-white" />
                <span>Cloud Sync</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop navigation tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`btn-interactive flex items-center gap-2 px-5 py-2.5 rounded-full text-sm md:text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-muted-text hover:bg-muted-bg hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 md:w-4.5 md:h-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Date picker reel - only relevant/helpful in Daily or when transitioning to it */}
      {activeTab === "daily" && (
        <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-1 md:py-2">
          <div className="flex items-center justify-between gap-1 w-full max-w-md md:max-w-lg">
            {dateReel.map((day) => {
              const isSelected = day.dateStr === selectedDate;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleDateClick(day.dateStr)}
                  className={`btn-interactive flex flex-col items-center justify-center w-11 h-14 md:w-13 md:h-16 rounded-xl border select-none transition-all ${
                    isSelected
                      ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                      : "bg-transparent border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
                  }`}
                >
                  <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider">
                    {day.dayName}
                  </span>
                  <span className="text-sm md:text-base font-bold mt-0.5 relative">
                    {day.dayNum}
                    {day.isToday && (
                      <span
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          isSelected ? "bg-white dark:bg-black" : "bg-black dark:bg-white"
                        }`}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
