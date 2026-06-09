"use client";

import React, { useRef, useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { Habit } from "@/lib/habit-utils";
import { Database, Download, Upload, Trash2, PenLine, RefreshCw, AlertTriangle, Info } from "lucide-react";

interface SettingsViewProps {
  onEditHabit: (habit: Habit) => void;
  onAddHabit: () => void;
}

export default function SettingsView({ onEditHabit, onAddHabit }: SettingsViewProps) {
  const {
    habits,
    dbConnected,
    deleteHabit,
    clearAllLocalData,
    seedLocalMockData,
    fetchHabits,
  } = useHabitStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Trigger JSON Export
  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(habits, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `habit_tracker_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Failed to export habits:", e);
    }
  };

  // Trigger JSON Import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(parsed)) {
          throw new Error("Import data must be a JSON array of habits.");
        }
        
        // Simple validation
        for (const item of parsed) {
          if (!item.name || !Array.isArray(item.skipDays) || !Array.isArray(item.completedDates)) {
            throw new Error("Invalid habit schema detected in JSON file.");
          }
        }
        
        // Write to localStorage (since we fall back if not cloud connected)
        localStorage.setItem("habit_tracker_offline_habits", JSON.stringify(parsed));
        setImportStatus({ type: "success", message: "Data imported successfully!" });
        
        // Reload state
        fetchHabits();
        
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err: any) {
        setImportStatus({ type: "error", message: err.message || "Failed to parse file." });
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    
    fileReader.readAsText(files[0]);
    // Clear input
    e.target.value = "";
  };

  // Safe Seeding
  const handleSeedData = () => {
    seedLocalMockData();
    setImportStatus({ type: "success", message: "Demo data seeded! Tab over to Analytics to inspect." });
    setTimeout(() => setImportStatus(null), 3000);
  };

  // Safe Purge
  const handleClearData = () => {
    clearAllLocalData();
    setShowDeleteConfirm(false);
    setImportStatus({ type: "success", message: "All data cleared successfully." });
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 px-4 py-6 md:py-8">
      {/* Title */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">
          Preferences & Data
        </h2>
        <p className="text-xs text-muted-text mt-0.5">Manage habits and application data</p>
      </div>

      {/* Database/Environment Status */}
      <div className="flex flex-col p-4 rounded-2xl border border-border bg-card-bg gap-2.5 select-none">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-black dark:text-white" />
          <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
            Connection Profile
          </span>
        </div>
        <div className="text-xs text-muted-text leading-relaxed">
          {dbConnected ? (
            <p>
              Your habits are actively synced with <span className="font-semibold text-black dark:text-white">MongoDB</span>. Changes are saved to your cloud database automatically.
            </p>
          ) : (
            <p>
              Running in <span className="font-semibold text-black dark:text-white">Offline Mode</span>. Data is cached locally in your browser. Connect to MongoDB by setting the <code className="bg-muted-bg px-1 py-0.5 rounded text-[10px] font-mono">MONGODB_URI</code> environment variable in your project's root folder.
            </p>
          )}
        </div>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium animate-fade-in ${
            importStatus.type === "success"
              ? "bg-neutral-50 border-black/10 text-neutral-800 dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-200"
              : "bg-red-50/50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300"
          }`}
        >
          {importStatus.message}
        </div>
      )}

      {/* Habits List Manager */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text">
            Manage Habits ({habits.length})
          </span>
          <button
            onClick={onAddHabit}
            className="text-xs font-bold text-black dark:text-white hover:underline cursor-pointer"
          >
            + Add New
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="p-4 border border-dashed border-border rounded-2xl text-center bg-card-bg text-xs text-muted-text">
            No habits available. Click above to create one.
          </div>
        ) : (
          <div className="flex flex-col border border-border bg-card-bg rounded-2xl divide-y divide-border overflow-hidden">
            {habits.map((habit) => (
              <div key={habit._id} className="flex items-center justify-between p-3.5 bg-card-bg hover:bg-neutral-50/50 dark:hover:bg-zinc-900/20 transition-all">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-black dark:text-white truncate">
                    {habit.name}
                  </span>
                  <span className="text-[9px] text-muted-text mt-0.5 truncate max-w-[200px]">
                    Created on {habit.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Edit */}
                  <button
                    onClick={() => onEditHabit(habit)}
                    className="btn-interactive p-1.5 rounded-lg border border-border hover:border-black dark:hover:border-white text-muted-text hover:text-black dark:hover:text-white"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                        deleteHabit(habit._id!);
                      }
                    }}
                    className="btn-interactive p-1.5 rounded-lg border border-border hover:border-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-muted-text hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Operations */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-text">
          Backup & Maintenance
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="btn-interactive flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-border bg-card-bg hover:border-black dark:hover:border-white text-xs font-bold text-black dark:text-white"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={handleImportClick}
            className="btn-interactive flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-border bg-card-bg hover:border-black dark:hover:border-white text-xs font-bold text-black dark:text-white"
          >
            <Upload className="w-4 h-4" />
            <span>Import Data</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Demo Seeding */}
        {!dbConnected && (
          <button
            onClick={handleSeedData}
            className="btn-interactive flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-border bg-card-bg hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-xs font-bold text-black dark:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Seed 5-Day Demo Logs</span>
          </button>
        )}

        {/* Clear All Data */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-interactive flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-red-100 hover:border-red-200 bg-red-50/10 text-xs font-bold text-red-600 hover:bg-red-50/50 dark:bg-red-950/5 dark:border-red-950/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Habits</span>
          </button>
        ) : (
          <div className="flex flex-col p-4 border border-red-200 dark:border-red-900/40 rounded-2xl bg-red-50/10 dark:bg-red-950/5 gap-3">
            <div className="flex items-start gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-semibold">
                This deletes all habit lists and completion logs permanently. This action cannot be undone.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearData}
                className="btn-interactive flex-1 p-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-interactive flex-1 p-2 rounded-xl border border-border bg-card-bg text-black dark:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
