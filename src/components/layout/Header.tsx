"use client";

import React, { useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHabitStore } from "@/store/habit-store";
import { getLocalDateString } from "@/lib/habit-utils";
import {
  BookOpen,
  CheckSquare2,
  TrendingUp,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onMenuOpen?: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const {
    selectedDate,
    setSelectedDate,
    dbConnected,
    isSyncing,
  } = useHabitStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Show date reel on /habits and /tasks
  const showDateReel = pathname === "/habits" || pathname === "/tasks";

  // Generate 365 days around today (182 before, 182 after)
  const dates = useMemo(() => {
    const list = [];
    for (let i = -182; i <= 182; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(getLocalDateString(d));
    }
    return list;
  }, []);

  // Scroll to selected date
  useEffect(() => {
    if (scrollContainerRef.current && showDateReel) {
      const selectedElement = scrollContainerRef.current.querySelector(
        '[data-selected="true"]'
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedDate, showDateReel]);

  const navItems = [
    { href: "/habits", label: "Habits", icon: BookOpen },
    { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
    { href: "/insights", label: "Insights", icon: TrendingUp },
    { href: "/settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-md dark:bg-black/95 px-4 md:px-6 xl:px-10 py-3 md:py-4 flex flex-col gap-3">
      {/* Branding and Navigation row */}
      <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2">
          <Link
            href="/habits"
            onClick={() => setSelectedDate(getLocalDateString())}
            className="text-2xl md:text-3xl font-extrabold tracking-tighter text-black dark:text-white cursor-pointer select-none"
          >
            habit.
          </Link>
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

        {/* Desktop navigation links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn-interactive flex items-center gap-2 px-5 py-2.5 rounded-full text-sm md:text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-muted-text hover:bg-muted-bg hover:text-black dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 md:w-4.5 md:h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onMenuOpen}
          className="md:hidden p-2 rounded-xl border border-border bg-card-bg text-black dark:text-white hover:bg-muted-bg btn-interactive select-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Date picker reel - only shown on /habits and /tasks */}
      {showDateReel && (
        <div className="w-full max-w-[1400px] mx-auto flex items-center justify-center py-1 md:py-2">
          <div className="relative w-full">
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 px-1"
              style={{ scrollSnapType: "x proximity" }}
            >
              {dates.map((dateStr) => {
                const [y, m, d] = dateStr.split("-").map(Number);
                const dateObj = new Date(y, m - 1, d);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === getLocalDateString();
                const dayName = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                const dayNum = dateObj.getDate();
                const isFirstOfMonth = dayNum === 1;
                const monthName = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                });

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
                      <span
                        className={`text-[9px] md:text-[10px] font-extrabold uppercase tracking-tight leading-none mb-0.5 ${
                          isSelected
                            ? "text-white/80 dark:text-black/60"
                            : "text-black dark:text-white"
                        }`}
                      >
                        {monthName}
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${
                          isSelected
                            ? "text-white/70 dark:text-black/60"
                            : "text-muted-text"
                        }`}
                      >
                        {dayName}
                      </span>
                    )}
                    <span
                      className={`text-sm font-bold mt-0.5 ${
                        isSelected
                          ? "text-white dark:text-black"
                          : "text-black dark:text-white"
                      }`}
                    >
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
