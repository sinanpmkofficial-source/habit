import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getLocalDateString, getWeekdayIndex, isBeforeDate } from "@/lib/habit-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const dateParam = searchParams.get("date");
    const incomingToken = searchParams.get("token") || 
      searchParams.get("apiKey") || 
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const today = dateParam || getLocalDateString();
    const weekdayIndex = getWeekdayIndex(today);

    if (!clientPromise) {
      const errorMsg = "Database connection error.";
      if (format === "text") {
        return new Response(errorMsg, { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      return NextResponse.json({ error: errorMsg }, { status: 503 });
    }

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    // Token Authentication Check
    const tokenDoc = await db.collection("settings").findOne({ _id: "api_token" as any });
    if (tokenDoc && tokenDoc.token) {
      if (!incomingToken || incomingToken !== tokenDoc.token) {
        const authErrorMsg = "Unauthorized: Invalid or missing API token.";
        if (format === "text") {
          return new Response(authErrorMsg, { status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        return NextResponse.json({ success: false, error: authErrorMsg }, { status: 401 });
      }
    }

    const habits = await db.collection("habits").find({}).toArray();

    // Active habits for the target date
    const activeHabits = habits.filter((habit) => {
      const createdAt = habit.createdAt || "2000-01-01";
      return createdAt === today || isBeforeDate(createdAt, today);
    });

    // Uncompleted habits for today (excluding skip days)
    const pendingHabits = activeHabits.filter((habit) => {
      const isCompleted = Array.isArray(habit.completedDates) && habit.completedDates.includes(today);
      const isSkipDay = Array.isArray(habit.skipDays) && habit.skipDays.includes(weekdayIndex);
      return !isCompleted && !isSkipDay;
    });

    const totalCount = activeHabits.length;
    const completedCount = totalCount - pendingHabits.length;
    const uncompletedCount = pendingHabits.length;
    const pendingNames = pendingHabits.map((h) => h.name);

    let message = "";
    if (totalCount === 0) {
      message = "No active habits configured for today.";
    } else if (uncompletedCount === 0) {
      message = `🎉 All ${totalCount} habit(s) completed for today! Great job!`;
    } else {
      message = `⚠️ You have ${uncompletedCount} habit(s) pending for today: ${pendingNames.join(", ")}.`;
    }

    // Return plain text format if requested by Shortcut
    if (format === "text") {
      return new Response(message, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      success: true,
      date: today,
      totalHabits: totalCount,
      completedCount,
      uncompletedCount,
      pendingHabits: pendingNames,
      hasPending: uncompletedCount > 0,
      message,
    });
  } catch (error: unknown) {
    console.error("Error in /api/shortcuts/pending:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
