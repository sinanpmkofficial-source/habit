export type SkipMode = "fixed" | "flexible";

// A flexible-mode habit tolerates this many missed days per calendar week
// (Mon-Sun) without breaking the streak, regardless of which day is missed.
export const FLEXIBLE_SKIPS_PER_WEEK = 1;

export interface Habit {
  _id?: string;
  name: string;
  description?: string;
  createdAt: string; // YYYY-MM-DD
  skipDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. Only used when skipMode is "fixed".
  skipMode?: SkipMode; // "fixed" (default) = specific weekdays via skipDays. "flexible" = any single day off per week.
  completedDates: string[]; // YYYY-MM-DD
}

/**
 * Returns a YYYY-MM-DD string representing the local date.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the day of the week (0-6) for a YYYY-MM-DD string in local timezone.
 */
export function getWeekdayIndex(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string, returning a new YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

/**
 * Checks if date A is before date B (both YYYY-MM-DD format).
 */
export function isBeforeDate(dateStrA: string, dateStrB: string): boolean {
  return dateStrA < dateStrB;
}

/**
 * Returns the Monday (YYYY-MM-DD) of the calendar week containing dateStr.
 */
export function getWeekStart(dateStr: string): string {
  const dayOfWeek = getWeekdayIndex(dateStr); // 0 = Sun, ..., 6 = Sat
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(dateStr, offset);
}

/**
 * Checks if dateStr falls on one of the habit's fixed skip weekdays.
 * Always false for flexible-mode habits, which have no specific skip day.
 */
export function isFixedSkipDay(habit: Habit, dateStr: string): boolean {
  if (habit.skipMode === "flexible") return false;
  return habit.skipDays.includes(getWeekdayIndex(dateStr));
}

/**
 * For a flexible-mode habit, reports how much of the current week's single
 * free skip (Mon-Sun) has been used by days strictly before refDateStr.
 * Non-flexible habits always report a zero-width budget.
 */
export function getFlexibleSkipStatus(
  habit: Habit,
  refDateStr: string
): { used: number; remaining: number; limit: number } {
  const limit = habit.skipMode === "flexible" ? FLEXIBLE_SKIPS_PER_WEEK : 0;
  if (limit === 0) return { used: 0, remaining: 0, limit: 0 };

  const completedSet = new Set(habit.completedDates);
  let used = 0;
  let dateStr = getWeekStart(refDateStr);

  for (let i = 0; i < 7 && dateStr < refDateStr; i++) {
    if (!isBeforeDate(dateStr, habit.createdAt) && !completedSet.has(dateStr)) {
      used++;
    }
    dateStr = addDays(dateStr, 1);
  }

  used = Math.min(used, limit);
  return { used, remaining: limit - used, limit };
}

/**
 * Calculates current and longest streaks for a habit, taking skip days into account.
 */
export function calculateStreaks(habit: Habit, todayStr: string): { currentStreak: number; longestStreak: number } {
  const completedSet = new Set(habit.completedDates);
  const skipDaysSet = new Set(habit.skipDays);
  const isFlexible = habit.skipMode === "flexible";

  // 1. Calculate Current Streak (working backwards from todayStr)
  let currentStreak = 0;
  let checkDateStr = todayStr;
  let isFirstDay = true;
  let safetyCounter = 0;
  const flexUsage = new Map<string, number>();

  // We loop back until we are before the creation date, or we hit a break condition
  while (safetyCounter < 3650) {
    if (isBeforeDate(checkDateStr, habit.createdAt)) {
      break;
    }

    const isCompleted = completedSet.has(checkDateStr);
    const dayOfWeek = getWeekdayIndex(checkDateStr);
    const isSkipDay = !isFlexible && skipDaysSet.has(dayOfWeek);

    if (isCompleted) {
      currentStreak++;
      isFirstDay = false;
    } else if (isSkipDay) {
      // Fixed skip days do not break the streak. We just bridge over them.
    } else if (isFirstDay && checkDateStr === todayStr) {
      // Today is not completed yet, but the user still has time to complete it.
      // The streak is determined by the previous days. We continue checking.
      isFirstDay = false;
    } else if (isFlexible) {
      // Flexible mode tolerates one missed day per calendar week, whichever it is.
      const weekStart = getWeekStart(checkDateStr);
      const used = flexUsage.get(weekStart) || 0;
      if (used < FLEXIBLE_SKIPS_PER_WEEK) {
        flexUsage.set(weekStart, used + 1);
      } else {
        break;
      }
    } else {
      // A past non-skip day was missed, so the current streak breaks.
      break;
    }

    checkDateStr = addDays(checkDateStr, -1);
    safetyCounter++;
  }

  // 2. Calculate Longest Streak (working forwards from createdAt to todayStr)
  let longestStreak = 0;
  let runningStreak = 0;
  let currentCheckStr = habit.createdAt;
  safetyCounter = 0;
  const flexUsageForward = new Map<string, number>();

  while (safetyCounter < 3650) {
    if (isBeforeDate(todayStr, currentCheckStr)) {
      break;
    }

    const isCompleted = completedSet.has(currentCheckStr);
    const dayOfWeek = getWeekdayIndex(currentCheckStr);
    const isSkipDay = !isFlexible && skipDaysSet.has(dayOfWeek);

    if (isCompleted) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (isSkipDay) {
      // Fixed skip day does not break or reset the streak.
    } else if (currentCheckStr === todayStr) {
      // If it's today and not completed yet, we don't break the running streak
      // (since it might still be completed today).
    } else if (isFlexible) {
      const weekStart = getWeekStart(currentCheckStr);
      const used = flexUsageForward.get(weekStart) || 0;
      if (used < FLEXIBLE_SKIPS_PER_WEEK) {
        flexUsageForward.set(weekStart, used + 1);
      } else {
        runningStreak = 0;
      }
    } else {
      runningStreak = 0;
    }

    if (currentCheckStr === todayStr) {
      break;
    }

    currentCheckStr = addDays(currentCheckStr, 1);
    safetyCounter++;
  }

  return {
    currentStreak,
    longestStreak,
  };
}

/**
 * Calculates completion rate (completions / active days) in percentage.
 * Active days are non-skip days, plus any skip day that was completed anyway.
 */
export function getCompletionRate(habit: Habit, todayStr: string): number {
  if (habit.completedDates.length === 0) return 0;

  const completedSet = new Set(habit.completedDates);
  const skipDaysSet = new Set(habit.skipDays);
  const isFlexible = habit.skipMode === "flexible";
  const flexUsage = new Map<string, number>();

  let activeDays = 0;
  let completions = 0;
  let currentCheckStr = habit.createdAt;
  let safetyCounter = 0;

  while (safetyCounter < 3650) {
    if (isBeforeDate(todayStr, currentCheckStr)) {
      break;
    }

    const isCompleted = completedSet.has(currentCheckStr);
    const dayOfWeek = getWeekdayIndex(currentCheckStr);
    const isSkipDay = !isFlexible && skipDaysSet.has(dayOfWeek);
    let isFlexSkipUsed = false;

    if (!isCompleted && isFlexible) {
      const weekStart = getWeekStart(currentCheckStr);
      const used = flexUsage.get(weekStart) || 0;
      if (used < FLEXIBLE_SKIPS_PER_WEEK) {
        flexUsage.set(weekStart, used + 1);
        isFlexSkipUsed = true;
      }
    }

    if (isCompleted) {
      completions++;
      activeDays++;
    } else if (!isSkipDay && !isFlexSkipUsed) {
      activeDays++;
    }

    if (currentCheckStr === todayStr) {
      break;
    }

    currentCheckStr = addDays(currentCheckStr, 1);
    safetyCounter++;
  }

  if (activeDays === 0) return 0;
  return Math.round((completions / activeDays) * 100);
}
