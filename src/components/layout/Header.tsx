"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { getLocalDateString } from "@/lib/habit-utils";
import { Calendar, Layers, BarChart2, Settings, Wifi, WifiOff, RefreshCw, ChevronDown, TrendingUp } from "lucide-react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate 91 days around today (45 before, 45 after)
  const dates = useMemo(() => {
    const list = [];
    for (let i = -45; i <= 45; i++) {
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
              setDropdownOpen(false);
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
        <nav className="hidden md:flex items-center gap-1.5 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setDropdownOpen(false);
                  setActiveTab(item.id);
                }}
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

          {/* Desktop More Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`btn-interactive flex items-center gap-2 px-5 py-2.5 rounded-full text-sm md:text-base font-semibold transition-colors cursor-pointer select-none ${
                activeTab === "settings" || activeTab === "insights"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-muted-text hover:bg-muted-bg hover:text-black dark:hover:text-white"
              }`}
            >
              <ChevronDown className={`w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              <span>More</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-lg py-2.5 z-50 flex flex-col gap-0.5 animate-fade-in">
                <button
                  onClick={() => {
                    setActiveTab("insights");
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted-bg text-left cursor-pointer w-full ${
                    activeTab === "insights" ? "text-black dark:text-white bg-muted-bg/50" : "text-muted-text"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Insights</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted-bg text-left cursor-pointer w-full ${
                    activeTab === "settings" ? "text-black dark:text-white bg-muted-bg/50" : "text-muted-text"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Date picker reel - only relevant/helpful in Daily or when transitioning to it */}
      {activeTab === "daily" && (
        <div className="w-full max-w-5xl mx-auto flex items-center justify-center py-1 md:py-2">
          <div className="relative w-full">
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 px-1"
              style={{ scrollSnapType: 'x proximity' }}
            >
              {dates.map((dateStr) => {
                const [y, m, d] = dateStr.split("-").map(Number);
                const dateObj = new Date(y, m - 1, d);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === getLocalDateString();
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = dateObj.getDate();
                const isFirstOfMonth = dayNum === 1;
                const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });

                return (
                  <button
                    key={dateStr}
                    data-selected={isSelected}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center min-w-[48px] md:min-w-[56px] py-2 md:py-2.5 rounded-2xl border transition-all scroll-snap-align-center shrink-0 ${
                      isSelected
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-md"
                        : "bg-card-bg border-border hover:border-zinc-400 dark:hover:border-zinc-700 text-muted-text hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {/* Month label on 1st of month */}
                    {isFirstOfMonth ? (
                      <span className={`text-[9px] md:text-[10px] font-extrabold uppercase tracking-tight leading-none mb-0.5 ${
                        isSelected ? "text-white/80 dark:text-black/60" : "text-black dark:text-white"
                      }`}>
                        {monthName}
                      </span>
                    ) : (
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${
                        isSelected ? "text-white/70 dark:text-black/60" : "text-muted-text"
                      }`}>
                        {dayName}
                      </span>
                    )}
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
