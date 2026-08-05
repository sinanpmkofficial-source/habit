"use client";

import React from "react";
import { useHabitStore } from "@/store/habit-store";
import { Calendar, Layers, BarChart2, Settings } from "lucide-react";

export default function BottomNav() {
  const { activeTab, setActiveTab } = useHabitStore();

  const navItems = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "weekly", label: "Weekly", icon: Layers },
    { id: "monthly", label: "Monthly", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/90 dark:bg-black/90 backdrop-blur-lg px-2 py-2.5 pb-safe flex justify-around items-center">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="btn-interactive flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
          >
            <Icon
              className={`w-5.5 h-5.5 transition-colors ${
                isActive ? "text-black dark:text-white stroke-[2]" : "text-muted-text stroke-[1.75]"
              }`}
            />
            <span
              className={`text-[10px] font-medium mt-1 transition-colors ${
                isActive ? "text-black dark:text-white" : "text-muted-text"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
