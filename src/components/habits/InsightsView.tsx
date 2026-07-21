"use client";

import React, { useState } from "react";
import { useHabitStore } from "@/store/habit-store";
import { useTaskStore } from "@/store/task-store";
import { usePrayerStore } from "@/store/prayer-store";
import InsightsNav, { InsightsTab } from "@/components/insights/InsightsNav";
import OverviewInsights from "@/components/insights/OverviewInsights";
import HabitsInsights from "@/components/insights/HabitsInsights";
import TasksInsights from "@/components/insights/TasksInsights";
import PrayerInsights from "@/components/insights/PrayerInsights";

export default function InsightsView() {
  const { habits } = useHabitStore();
  const { tasks } = useTaskStore();
  const { prayers } = usePrayerStore();

  const [activeTab, setActiveTab] = useState<InsightsTab>("habits");

  // Calculate quick stats for nav badge counts
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPrayerCount = (prayers[todayStr] || []).length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col px-4 py-6 md:py-8">
      {/* Navigation Bar */}
      <InsightsNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        habitCount={habits.length}
        taskCount={tasks.length}
        prayerCount={todayPrayerCount}
      />

      {/* Tab Content Views */}
      <div className="w-full">
        {activeTab === "overview" && (
          <OverviewInsights
            habits={habits}
            tasks={tasks}
            prayers={prayers}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "habits" && <HabitsInsights habits={habits} />}

        {activeTab === "tasks" && <TasksInsights tasks={tasks} />}

        {activeTab === "prayers" && <PrayerInsights prayers={prayers} />}
      </div>
    </div>
  );
}
