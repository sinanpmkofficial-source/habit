import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// PUT — update task title and/or date
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 503 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { title, date } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const result = await db.collection("tasks").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title, date } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      task: { ...result, _id: result._id.toString() },
    });
  } catch (error: unknown) {
    console.error("Failed to update task in MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH — toggle completion
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 503 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { completed } = body;

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const result = await db.collection("tasks").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { completed } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      task: { ...result, _id: result._id.toString() },
    });
  } catch (error: unknown) {
    console.error("Failed to toggle task in MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE — remove single task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 503 }
      );
    }
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const result = await db
      .collection("tasks")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error: unknown) {
    console.error("Failed to delete task from MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
