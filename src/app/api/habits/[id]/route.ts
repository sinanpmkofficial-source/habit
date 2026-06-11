import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { name, description, skipDays } = body;

    if (!name) {
      return NextResponse.json({ error: "Habit name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const updateFields = {
      name,
      description: description || "",
      skipDays: Array.isArray(skipDays) ? skipDays : [],
    };

    const result = await db.collection("habits").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      habit: {
        ...result,
        _id: result._id.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to update habit in MongoDB:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const result = await db.collection("habits").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error: unknown) {
    console.error("Failed to delete habit from MongoDB:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
