import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();
    const { date, completed } = body; // Expecting 'YYYY-MM-DD' and optional 'completed' boolean

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    // Retrieve current habit to inspect completed dates
    const habit = await db.collection("habits").findOne({ _id: new ObjectId(id) });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const completedDates: string[] = habit.completedDates || [];
    const isCompleted = completedDates.includes(date);

    // If completed is provided, use it; otherwise toggle current state
    const shouldComplete = completed !== undefined ? completed : !isCompleted;

    let updateQuery;
    if (shouldComplete) {
      // Add date if not marked completed, using $addToSet to avoid duplicates
      updateQuery = { $addToSet: { completedDates: date } };
    } else {
      // Remove date if marked completed
      updateQuery = { $pull: { completedDates: date } };
    }

    const updatedHabit = await db.collection("habits").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateQuery,
      { returnDocument: "after" }
    );

    if (!updatedHabit) {
      return NextResponse.json({ error: "Habit not found during toggle" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      habit: {
        ...updatedHabit,
        _id: updatedHabit._id.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to toggle habit completion in MongoDB:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
