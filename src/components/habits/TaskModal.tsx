"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/store/task-store";
import { Task } from "@/lib/habit-utils";
import { X, Trash2 } from "lucide-react";
import DatePicker from "./DatePicker";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // null = create mode
  defaultDate?: string; // pre-fill date when creating from a specific day
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  defaultDate,
}: TaskModalProps) {
  const { addTask, updateTask, deleteTask } = useTaskStore();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date);
    } else {
      setTitle("");
      setDate(defaultDate || "");
    }
    setError("");
  }, [task, isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!date) {
      setError("Please select a date for this task");
      return;
    }

    try {
      if (task && task._id) {
        await updateTask(task._id, title.trim(), date);
      } else {
        await addTask(title.trim(), date);
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const handleDelete = async () => {
    if (task && task._id) {
      if (confirm(`Delete "${task.title}"?`)) {
        await deleteTask(task._id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-xs p-0 md:p-4 animate-fade-in" style={{ height: '100dvh' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-h-[90dvh] md:max-h-[85dvh] md:w-[420px] bg-white dark:bg-[#0a0a0a] border-t md:border border-border rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up z-10">

        {/* Drag handle (mobile) */}
        <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-3 mb-1 shrink-0 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-base font-bold text-black dark:text-white">
            {task ? "Edit Task" : "New Task"}
          </h3>
          <button
            onClick={onClose}
            className="btn-interactive p-1.5 rounded-full border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5"
        >
          {error && (
            <div className="p-3 rounded-xl border border-red-200 bg-red-50/20 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-text mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review project proposal"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-transparent text-sm font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white placeholder:font-normal"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-text mb-1.5">
              Scheduled Date *
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Hidden submit */}
          <button type="submit" className="hidden" />
        </form>

        {/* Footer */}
        <div className="px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-white dark:bg-[#0a0a0a] flex items-center justify-between shrink-0 gap-3">
          {task ? (
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
              className="btn-interactive px-4 py-3 rounded-xl border border-border text-xs font-bold text-muted-text hover:text-black dark:hover:text-white"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="btn-interactive flex-1 px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold text-center hover:opacity-90 shadow-sm"
          >
            {task ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
