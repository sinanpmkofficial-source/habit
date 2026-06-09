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
    const { date } = body; // Expecting 'YYYY-MM-DD'

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

    let updateQuery;
    if (isCompleted) {
      // Remove date if already marked completed
      updateQuery = { $pull: { completedDates: date } };
    } else {
      // Add date if not marked completed
      updateQuery = { $push: { completedDates: date } };
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
  } catch (error: any) {
    console.error("Failed to toggle habit completion in MongoDB:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
