export interface Habit {
  _id?: string;
  name: string;
  description?: string;
  createdAt: string; // YYYY-MM-DD
  skipDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  completedDates: string[]; // YYYY-MM-DD
}

export interface Task {
  _id?: string;
  title: string;
  date: string;      // YYYY-MM-DD — the day this task belongs to
  completed: boolean;
  createdAt: string; // YYYY-MM-DD
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
 * Calculates current and longest streaks for a habit, taking skip days into account.
 */
export function calculateStreaks(habit: Habit, todayStr: string): { currentStreak: number; longestStreak: number } {
  const completedSet = new Set(habit.completedDates);
  const skipDaysSet = new Set(habit.skipDays);
  
  // 1. Calculate Current Streak (working backwards from todayStr)
  let currentStreak = 0;
  let checkDateStr = todayStr;
  let isFirstDay = true;
  let safetyCounter = 0;

  // We loop back until we are before the creation date, or we hit a break condition
  while (safetyCounter < 3650) {
    if (isBeforeDate(checkDateStr, habit.createdAt)) {
      break;
    }

    const isCompleted = completedSet.has(checkDateStr);
    const dayOfWeek = getWeekdayIndex(checkDateStr);
    const isSkipDay = skipDaysSet.has(dayOfWeek);

    if (isCompleted) {
      currentStreak++;
      isFirstDay = false;
    } else {
      if (isSkipDay) {
        // Skip days do not break the streak. We just bridge over them.
        // If it's the first checked day (today) and it's a skip day, we just keep going.
        // If it's a past day, it also doesn't break the streak.
      } else {
        // Not completed and not a skip day
        if (isFirstDay && checkDateStr === todayStr) {
          // Today is not completed yet, but the user still has time to complete it.
          // The streak is determined by the previous days. We continue checking.
          isFirstDay = false;
        } else {
          // A past non-skip day was missed, so the current streak breaks.
          break;
        }
      }
    }

    checkDateStr = addDays(checkDateStr, -1);
    safetyCounter++;
  }

  // 2. Calculate Longest Streak (working forwards from createdAt to todayStr)
  let longestStreak = 0;
  let runningStreak = 0;
  let currentCheckStr = habit.createdAt;
  safetyCounter = 0;

  while (safetyCounter < 3650) {
    if (isBeforeDate(todayStr, currentCheckStr)) {
      break;
    }

    const isCompleted = completedSet.has(currentCheckStr);
    const dayOfWeek = getWeekdayIndex(currentCheckStr);
    const isSkipDay = skipDaysSet.has(dayOfWeek);

    if (isCompleted) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      if (isSkipDay) {
        // Skip day does not break or reset the streak.
      } else {
        // If it's today and not completed yet, we don't break the running streak
        // (since it might still be completed today).
        if (currentCheckStr !== todayStr) {
          runningStreak = 0;
        }
      }
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
    const isSkipDay = skipDaysSet.has(dayOfWeek);

    if (isCompleted) {
      completions++;
      activeDays++;
    } else if (!isSkipDay) {
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
