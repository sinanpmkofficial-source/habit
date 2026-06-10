import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    if (!clientPromise) {
      return NextResponse.json({ dbConnected: false, habits: [] });
    }
    const client = await clientPromise;
    const db = client.db("habit-tracker");
    const habits = await db.collection("habits").find({}).toArray();
    
    // Map _id to string representation for standard JSON response
    const serializedHabits = habits.map((habit) => ({
      ...habit,
      _id: habit._id.toString(),
    }));

    return NextResponse.json({ dbConnected: true, habits: serializedHabits });
  } catch (error: any) {
    console.error("Failed to fetch habits from MongoDB:", error);
    return NextResponse.json(
      { dbConnected: false, habits: [], error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    const body = await request.json();
    const { name, description, skipDays, createdAt } = body;

    if (!name) {
      return NextResponse.json({ error: "Habit name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const newHabit = {
      name,
      description: description || "",
      skipDays: Array.isArray(skipDays) ? skipDays : [],
      createdAt: createdAt || new Date().toISOString().split("T")[0],
      completedDates: [],
    };

    const result = await db.collection("habits").insertOne(newHabit);
    
    return NextResponse.json({
      dbConnected: true,
      habit: {
        ...newHabit,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error: any) {
    console.error("Failed to create habit in MongoDB:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    const client = await clientPromise;
    const db = client.db("habit-tracker");
    
    await db.collection("habits").deleteMany({});

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error: unknown) {
    console.error("Failed to clear habits from MongoDB:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
