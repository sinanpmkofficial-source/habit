import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// PUT — update idea title and/or content
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    const updateDoc: { title?: string; content?: string } = {};
    if (title !== undefined) updateDoc.title = title;
    if (content !== undefined) updateDoc.content = content;

    const result = await db.collection("braindump").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      idea: { ...result, _id: result._id.toString() },
    });
  } catch (error: unknown) {
    console.error("Failed to update braindump idea:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH — toggle completion status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    const { completed } = body;

    const result = await db.collection("braindump").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { completed: Boolean(completed) } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      idea: { ...result, _id: result._id.toString() },
    });
  } catch (error: unknown) {
    console.error("Failed to toggle braindump completion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE — remove idea
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;

    const result = await db
      .collection("braindump")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error: unknown) {
    console.error("Failed to delete braindump idea:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
