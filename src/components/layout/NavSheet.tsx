"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckSquare2,
  Moon,
  Brain,
  TrendingUp,
  Settings,
  Lock,
} from "lucide-react";

interface NavSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: "/habits",    label: "Habits",     icon: BookOpen,     enabled: true  },
  { href: "/tasks",     label: "Tasks",      icon: CheckSquare2, enabled: true  },
  { href: "/prayers",   label: "Prayer",     icon: Moon,         enabled: true  },
  { href: "/braindump", label: "Brain Dump", icon: Brain,        enabled: true  },
  { href: "/insights",  label: "Insights",   icon: TrendingUp,   enabled: true  },
  { href: "/settings",  label: "Settings",   icon: Settings,     enabled: true  },
];

export default function NavSheet({ isOpen, onClose }: NavSheetProps) {
  const pathname = usePathname();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-950 border-t border-border rounded-t-3xl shadow-2xl pb-safe">

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Label */}
          <p className="text-[10px] font-extrabold tracking-widest uppercase text-muted-text px-5 pb-3">
            Navigate
          </p>

          {/* Nav grid */}
          <div className="grid grid-cols-3 gap-2.5 px-4 pb-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? pathname === item.href : false;

              if (!item.enabled) {
                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-border opacity-40 select-none"
                  >
                    <Icon className="w-5 h-5 text-muted-text" />
                    <span className="text-xs font-semibold text-muted-text">{item.label}</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted-bg border border-border">
                      <Lock className="w-2.5 h-2.5 text-muted-text" />
                      <span className="text-[9px] font-bold text-muted-text uppercase tracking-wide">Soon</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={onClose}
                  className={`btn-interactive flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                    isActive
                      ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-sm"
                      : "bg-card-bg border-border text-muted-text hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
