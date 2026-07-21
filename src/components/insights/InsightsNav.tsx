"use client";

import React from "react";
import { LayoutDashboard, Flame, CheckSquare, Sparkles } from "lucide-react";

export type InsightsTab = "overview" | "habits" | "tasks" | "prayers";

interface InsightsNavProps {
  activeTab: InsightsTab;
  onSelectTab: (tab: InsightsTab) => void;
  habitCount: number;
  taskCount: number;
  prayerCount: number;
}

export default function InsightsNav({
  activeTab,
  onSelectTab,
  habitCount,
  taskCount,
  prayerCount,
}: InsightsNavProps) {
  const tabs = [
    {
      id: "overview" as InsightsTab,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "habits" as InsightsTab,
      label: "Habits",
      icon: Flame,
      badge: habitCount,
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    },
    {
      id: "tasks" as InsightsTab,
      label: "Tasks",
      icon: CheckSquare,
      badge: taskCount,
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "prayers" as InsightsTab,
      label: "Prayer",
      icon: Sparkles,
      badge: prayerCount > 0 ? `${prayerCount}/5` : "5 Daily",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="w-full flex items-center justify-between border-b border-border/60 pb-3 mb-6 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 p-1 bg-muted-bg/80 border border-border/80 rounded-2xl shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-md border border-border/40"
                  : "text-muted-text hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? tab.id === "habits"
                      ? "text-orange-500"
                      : tab.id === "tasks"
                      ? "text-blue-500"
                      : tab.id === "prayers"
                      ? "text-emerald-500"
                      : "text-indigo-500"
                    : "text-muted-text opacity-70"
                }`}
              />
              <span>{tab.label}</span>

              {tab.badge !== null && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
