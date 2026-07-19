"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
}

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a YYYY-MM-DD string into a local midnight Date (avoids UTC shift). */
function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Format a local Date as YYYY-MM-DD. */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseDate(value);

  const [viewMonth, setViewMonth] = useState<number>(
    () => selected?.getMonth() ?? today.getMonth()
  );
  const [viewYear, setViewYear] = useState<number>(
    () => selected?.getFullYear() ?? today.getFullYear()
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day: number) => {
    onChange(formatDate(new Date(viewYear, viewMonth, day)));
  };

  // Grid: offset to start on Monday
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0=Mon…6=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to a full last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-border bg-muted-bg/20 dark:bg-white/[0.03] p-4 select-none">

      {/* Month / Year navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="Previous month"
          className="btn-interactive w-8 h-8 flex items-center justify-center rounded-xl text-muted-text hover:text-black dark:hover:text-white hover:bg-muted-bg dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm font-bold text-black dark:text-white tracking-tight">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="btn-interactive w-8 h-8 flex items-center justify-center rounded-xl text-muted-text hover:text-black dark:hover:text-white hover:bg-muted-bg dark:hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-text h-7"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);

          const isToday = cellDate.getTime() === today.getTime();
          const isSelected =
            selected !== null && cellDate.getTime() === selected.getTime();

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(day)}
              aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${isToday ? " (today)" : ""}`}
              aria-pressed={isSelected}
              className={[
                "btn-interactive mx-auto w-9 h-9 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all",
                isSelected
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                  : isToday
                  ? "ring-1 ring-black dark:ring-white text-black dark:text-white"
                  : "text-black dark:text-white hover:bg-muted-bg dark:hover:bg-white/10",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected date pill */}
      {value && (
        <p className="mt-3 text-center text-[11px] font-semibold text-muted-text">
          {selected?.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
