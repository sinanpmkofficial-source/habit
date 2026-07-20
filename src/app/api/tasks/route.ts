import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const tasks = await db.collection("tasks").find({}).toArray();

    const serializedTasks = tasks.map((task) => ({
      ...task,
      _id: task._id.toString(),
    }));

    return NextResponse.json({ dbConnected: true, tasks: serializedTasks });
  } catch (error: unknown) {
    console.error("Failed to fetch tasks from MongoDB:", error);
    return NextResponse.json(
      {
        dbConnected: false,
        tasks: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { title, date } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }
    if (!date) {
      return NextResponse.json(
        { error: "Task date is required" },
        { status: 400 }
      );
    }

    const newTask = {
      title,
      date,
      completed: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const result = await db.collection("tasks").insertOne(newTask);

    return NextResponse.json({
      dbConnected: true,
      task: { ...newTask, _id: result.insertedId.toString() },
    });
  } catch (error: unknown) {
    console.error("Failed to create task in MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.collection("tasks").deleteMany({});
    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error: unknown) {
    console.error("Failed to clear tasks from MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
