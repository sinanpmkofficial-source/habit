"use client";

import React, { useState, useEffect, useRef } from "react";
import { useHabitStore } from "@/store/habit-store";
import { Calendar, Layers, BarChart2, Settings, MoreHorizontal, TrendingUp } from "lucide-react";

export default function BottomNav() {
  const { activeTab, setActiveTab } = useHabitStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: "daily", label: "Daily", icon: Calendar },
    { id: "weekly", label: "Weekly", icon: Layers },
    { id: "monthly", label: "Monthly", icon: BarChart2 },
  ] as const;

  return (
    <>
      {/* Mobile Slide-Up Menu Sheet */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30 dark:bg-black/60 backdrop-blur-xs flex items-end justify-center animate-fade-in">
          <div
            ref={menuRef}
            className="w-full bg-white dark:bg-zinc-950 border-t border-border rounded-t-3xl p-5 pb-8 shadow-2xl flex flex-col gap-4 max-w-md mx-auto"
          >
            <div className="w-12 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto mb-2" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-muted-text">More Options</span>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setActiveTab("insights");
                  setMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer select-none ${
                  activeTab === "insights"
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm"
                    : "bg-card-bg border-border text-muted-text hover:text-black dark:hover:text-white"
                }`}
              >
                <TrendingUp className="w-5.5 h-5.5 mb-2" />
                <span className="text-xs font-bold">Insights</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer select-none ${
                  activeTab === "settings"
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm"
                    : "bg-card-bg border-border text-muted-text hover:text-black dark:hover:text-white"
                }`}
              >
                <Settings className="w-5.5 h-5.5 mb-2" />
                <span className="text-xs font-bold">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/90 dark:bg-black/90 backdrop-blur-lg px-2 py-2.5 pb-safe flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setMenuOpen(false);
                setActiveTab(item.id);
              }}
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

        {/* More button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn-interactive flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none"
        >
          <MoreHorizontal
            className={`w-5.5 h-5.5 transition-colors ${
              menuOpen || activeTab === "settings" || activeTab === "insights"
                ? "text-black dark:text-white stroke-[2]"
                : "text-muted-text stroke-[1.75]"
            }`}
          />
          <span
            className={`text-[10px] font-medium mt-1 transition-colors ${
              menuOpen || activeTab === "settings" || activeTab === "insights"
                ? "text-black dark:text-white"
                : "text-muted-text"
            }`}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
}
