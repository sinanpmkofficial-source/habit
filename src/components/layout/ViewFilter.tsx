"use client";

import React from "react";
import { Calendar, Layers, BarChart2, ChevronDown } from "lucide-react";

export type ViewMode = "daily" | "weekly" | "monthly";

interface ViewFilterProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

const VIEWS = [
  { id: "daily",   label: "Daily",   Icon: Calendar  },
  { id: "weekly",  label: "Weekly",  Icon: Layers    },
  { id: "monthly", label: "Monthly", Icon: BarChart2 },
] as const;

export default function ViewFilter({ value, onChange }: ViewFilterProps) {
  return (
    <>
      {/* Mobile Compact Select Dropdown (md:hidden) */}
      <div className="md:hidden relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ViewMode)}
          className="appearance-none bg-white dark:bg-zinc-900 text-black dark:text-white border border-border rounded-xl px-3 py-1.5 pr-7 text-xs font-bold focus:outline-none cursor-pointer shadow-xs select-none uppercase tracking-wide"
        >
          {VIEWS.map(({ id, label }) => (
            <option
              key={id}
              value={id}
              className="bg-white dark:bg-zinc-900 text-black dark:text-white font-semibold normal-case"
            >
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-muted-text absolute right-2 pointer-events-none" />
      </div>

      {/* Desktop Pill Toggle Row (hidden md:flex) */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-muted-bg/60 dark:bg-zinc-900/60 border border-border w-fit">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`btn-interactive flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              value === id
                ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-border"
                : "text-muted-text hover:text-black dark:hover:text-white"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
