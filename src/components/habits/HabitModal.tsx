"use client";

import React, { useState, useEffect } from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit } from "@/lib/habit-utils";
import { X, Trash2 } from "lucide-react";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null; // If not null, we are editing
}

const WEEKDAYS = [
  { label: "M", index: 1, name: "Monday" },
  { label: "T", index: 2, name: "Tuesday" },
  { label: "W", index: 3, name: "Wednesday" },
  { label: "T", index: 4, name: "Thursday" },
  { label: "F", index: 5, name: "Friday" },
  { label: "S", index: 6, name: "Saturday" },
  { label: "S", index: 0, name: "Sunday" },
];

export default function HabitModal({ isOpen, onClose, habit }: HabitModalProps) {
  const { addHabit, updateHabit, deleteHabit } = useHabitStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [skipDays, setSkipDays] = useState<number[]>([]);
  const [error, setError] = useState("");

  // Sync state with habit prop when opening/changing
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || "");
      setSkipDays(habit.skipDays || []);
    } else {
      setName("");
      setDescription("");
      setSkipDays([]);
    }
    setError("");
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleToggleSkipDay = (index: number) => {
    setSkipDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Habit name is required");
      return;
    }

    try {
      if (habit && habit._id) {
        await updateHabit(habit._id, name.trim(), description.trim(), skipDays);
      } else {
        await addHabit(name.trim(), description.trim(), skipDays);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (habit && habit._id) {
      if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
        await deleteHabit(habit._id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-xs p-0 md:p-4 animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-h-[90vh] md:max-h-[85vh] md:w-[420px] bg-white dark:bg-[#0a0a0a] border-t md:border border-border rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up z-10">
        
        {/* Drag handle for mobile visual */}
        <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 mb-1 shrink-0 md:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-base font-bold text-black dark:text-white">
            {habit ? "Edit Habit" : "New Habit"}
          </h3>
          <button
            onClick={onClose}
            className="btn-interactive p-1.5 rounded-full border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50/20 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-text mb-1.5">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read 15 mins"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-transparent text-sm font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-text mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A non-fiction book to learn something new"
              rows={2}
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-transparent text-sm font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all resize-none text-black dark:text-white"
            />
          </div>

          {/* Skip Days */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-text mb-1.5">
              Skip Days
            </label>
            <p className="text-[10px] text-muted-text mb-2.5">
              Select days you don't want to track. They won't break your streak if left incomplete.
            </p>
            <div className="flex justify-between items-center bg-muted-bg/50 dark:bg-muted-bg/10 rounded-2xl p-3 border border-border">
              {WEEKDAYS.map((day) => {
                const isSkipped = skipDays.includes(day.index);
                return (
                  <button
                    type="button"
                    key={day.index}
                    onClick={() => handleToggleSkipDay(day.index)}
                    title={`Skip ${day.name}`}
                    className={`btn-interactive w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                      isSkipped
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-muted-text hover:border-black dark:hover:border-white"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden submit trigger */}
          <button type="submit" className="hidden" />
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-border bg-white dark:bg-[#0a0a0a] flex items-center justify-between shrink-0 gap-3">
          {habit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="btn-interactive p-3 rounded-xl border border-red-100 hover:border-red-600 hover:bg-red-50/10 text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-4 py-3 rounded-xl border border-border text-xs font-bold text-muted-text hover:text-black dark:hover:text-white whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-interactive flex-1 px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold text-center hover:opacity-90 shadow-sm whitespace-nowrap shrink-0"
          >
            {habit ? "Save Changes" : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
}
