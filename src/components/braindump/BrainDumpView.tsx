"use client";

import React, { useState } from "react";
import { useBrainDumpStore, BrainIdea } from "@/store/braindump-store";
import {
  Brain,
  Plus,
  Trash2,
  PenLine,
  SquareCheck,
  Check,
  Sparkles,
  Lightbulb,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type FilterMode = "all" | "active" | "completed";

export default function BrainDumpView() {
  const {
    ideas,
    addIdea,
    updateIdea,
    toggleIdeaCompletion,
    deleteIdea,
    reorderIdea,
  } = useBrainDumpStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Edit modal state
  const [editingIdea, setEditingIdea] = useState<BrainIdea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() && !contentInput.trim()) return;

    const title = titleInput.trim() || contentInput.trim().slice(0, 40);
    addIdea(title, contentInput.trim());

    setTitleInput("");
    setContentInput("");
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (idea: BrainIdea) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditContent(idea.content || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !editingIdea._id) return;
    if (!editTitle.trim() && !editContent.trim()) return;

    updateIdea(editingIdea._id, editTitle.trim(), editContent.trim());
    setEditingIdea(null);
  };

  const filteredIdeas = ideas.filter((item) => {
    if (filterMode === "active") return !item.completed;
    if (filterMode === "completed") return item.completed;
    return true;
  });

  const activeCount = ideas.filter((i) => !i.completed).length;
  const completedCount = ideas.filter((i) => i.completed).length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-black dark:text-white" />
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-black dark:text-white">
              Brain Dump
            </h2>
          </div>
          <p className="text-xs md:text-sm text-muted-text mt-1">
            Capture thoughts, raw ideas, and unstructured notes instantly. No dates, no pressure.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-interactive flex items-center gap-1.5 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-extrabold shadow-sm whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Dump Idea</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted-bg/60 border border-border overflow-x-auto no-scrollbar max-w-full">
          {(["all", "active", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`btn-interactive flex-1 sm:flex-initial px-3 md:px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap shrink-0 text-center ${
                filterMode === mode
                  ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm border border-border"
                  : "text-muted-text hover:text-black dark:hover:text-white"
              }`}
            >
              {mode}
              {mode === "all" && ` (${ideas.length})`}
              {mode === "active" && ` (${activeCount})`}
              {mode === "completed" && ` (${completedCount})`}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-text font-medium self-end sm:self-center">
          {activeCount} active idea{activeCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Idea List */}
      {filteredIdeas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-border rounded-2xl text-center bg-card-bg">
          <Lightbulb className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-black dark:text-white">
            {filterMode === "completed"
              ? "No completed ideas yet"
              : filterMode === "active"
              ? "No active ideas"
              : "No ideas dumped yet"}
          </h3>
          <p className="text-xs text-muted-text mt-1 max-w-[260px]">
            Click the button below to quickly capture any thoughts or tasks floating in your head.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-interactive mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dump New Idea</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((idea) => {
            const formattedDate = new Date(idea.createdAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <div
                key={idea._id}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition-all bg-card-bg gap-3 ${
                  idea.completed
                    ? "border-black/20 dark:border-white/20 opacity-60 bg-neutral-50/50 dark:bg-zinc-900/10"
                    : "border-border hover:border-zinc-400 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Square Checkbox */}
                  <button
                    onClick={() => toggleIdeaCompletion(idea._id!)}
                    className={`btn-interactive shrink-0 flex items-center justify-center w-6 h-6 rounded-lg border mt-0.5 transition-all cursor-pointer ${
                      idea.completed
                        ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    <SquareCheck
                      className={`w-3.5 h-3.5 transition-transform ${
                        idea.completed ? "scale-100" : "scale-0"
                      }`}
                    />
                  </button>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      onClick={() => toggleIdeaCompletion(idea._id!)}
                      className={`text-sm font-bold cursor-pointer leading-snug break-words ${
                        idea.completed
                          ? "line-through text-muted-text"
                          : "text-black dark:text-white"
                      }`}
                    >
                      {idea.title}
                    </span>

                    {idea.content && (
                      <p
                        className={`text-xs mt-1 whitespace-pre-wrap leading-relaxed ${
                          idea.completed
                            ? "line-through text-muted-text/70"
                            : "text-muted-text"
                        }`}
                      >
                        {idea.content}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] text-muted-text">
                  <span>{formattedDate}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => reorderIdea(idea._id!, "up")}
                      className="btn-interactive p-1.5 rounded-lg hover:bg-muted-bg text-muted-text hover:text-black dark:hover:text-white transition-colors"
                      title="Move idea up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderIdea(idea._id!, "down")}
                      className="btn-interactive p-1.5 rounded-lg hover:bg-muted-bg text-muted-text hover:text-black dark:hover:text-white transition-colors"
                      title="Move idea down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(idea)}
                      className="btn-interactive p-1.5 rounded-lg hover:bg-muted-bg text-muted-text hover:text-black dark:hover:text-white transition-colors"
                      title="Edit idea"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteIdea(idea._id!)}
                      className="btn-interactive p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-text hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Idea Modal */}
      {isAddModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 p-5 rounded-3xl border border-border bg-white dark:bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-black dark:text-white">
                  Dump New Idea
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-interactive p-1 rounded-full text-muted-text hover:text-black dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Idea title (optional)..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted-bg/50 text-sm font-semibold text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
              />

              <textarea
                rows={4}
                placeholder="Dump your thought or idea here..."
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted-bg/50 text-sm text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-interactive px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!titleInput.trim() && !contentInput.trim()}
                  className="btn-interactive px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold disabled:opacity-40"
                >
                  Dump Idea
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setEditingIdea(null)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-slide-up">
            <form
              onSubmit={handleSaveEdit}
              className="flex flex-col gap-4 p-5 rounded-3xl border border-border bg-white dark:bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-black dark:text-white">
                  Edit Idea
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="btn-interactive p-1 rounded-full text-muted-text hover:text-black dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted-bg/50 text-sm font-semibold text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />

              <textarea
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Details..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted-bg/50 text-sm text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="btn-interactive px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-interactive px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
