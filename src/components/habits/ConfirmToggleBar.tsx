"use client";

import React from "react";
import { Check, X } from "lucide-react";

export interface PendingToggle {
  habitId: string;
  dateStr: string;
  habitName: string;
  isCurrentlyCompleted: boolean;
}

interface ConfirmToggleBarProps {
  pending: PendingToggle | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A slim, animated action bar that slides up from the bottom when a habit
 * toggle is pending confirmation in Weekly or Monthly view.
 */
export default function ConfirmToggleBar({ pending, onConfirm, onCancel }: ConfirmToggleBarProps) {
  if (!pending) return null;

  const [y, m, d] = pending.dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const action = pending.isCurrentlyCompleted ? "Unmark" : "Mark as done";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] animate-fade-in"
        onClick={onCancel}
      />

      {/* Action bar */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-slide-up">
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border bg-white dark:bg-zinc-950 shadow-2xl">
          {/* Label */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-text">
              Confirm Action
            </span>
            <p className="text-sm font-semibold text-black dark:text-white mt-1 leading-snug">
              {action}{" "}
              <span className="font-extrabold">"{pending.habitName}"</span>{" "}
              for{" "}
              <span className="font-extrabold">{formattedDate}</span>?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="btn-interactive flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-text hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn-interactive flex-2 flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-90 shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              {action}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
