"use client";

import React from "react";
import { Calendar, Layers, BarChart2 } from "lucide-react";

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
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted-bg/60 dark:bg-zinc-900/60 border border-border w-fit">
      {VIEWS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`btn-interactive flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
  );
}
