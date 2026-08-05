"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { getLocalDateString } from "@/lib/habit-utils";
import { Calendar, Layers, BarChart2, Settings, Wifi, WifiOff, RefreshCw } from "lucide-react";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Header() {
  const {
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    dbConnected,
    isSyncing,
  } = useHabitStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate 29 days around today (14 before, 14 after)
  const dates = useMemo(() => {
    const list = [];
    for (let i = -14; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(getLocalDateString(d));
    }
    return list;
  }, []);

  // Scroll to selected date
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedElement = scrollContainerRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDate, activeTab]);

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
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-900 dark:text-white animate-spin" />
                <span>Syncing...</span>
              </>
            ) : dbConnected ? (
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
          <div className="relative group w-full max-w-md md:max-w-lg">
            <div 
              ref={scrollContainerRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 px-1"
              style={{ scrollSnapType: 'x proximity' }}
            >
              {dates.map((dateStr) => {
                const [y, m, d] = dateStr.split("-").map(Number);
                const dateObj = new Date(y, m - 1, d);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === getLocalDateString();
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = dateObj.getDate();

                return (
                  <button
                    key={dateStr}
                    data-selected={isSelected}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center min-w-[52px] py-2.5 rounded-2xl border transition-all scroll-snap-align-center ${
                      isSelected
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-md"
                        : "bg-card-bg border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-muted-text hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-tight ${
                      isSelected ? "text-white/70 dark:text-black/60" : "text-muted-text"
                    }`}>
                      {dayName}
                    </span>
                    <span className={`text-sm font-bold mt-0.5 ${
                      isSelected ? "text-white dark:text-black" : "text-black dark:text-white"
                    }`}>
                      {dayNum}
                    </span>
                    {isToday && !isSelected && (
                      <div className="w-1 h-1 rounded-full bg-black dark:bg-white mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
