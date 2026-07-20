import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const ideas = await db
      .collection("braindump")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = ideas.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));

    return NextResponse.json({ dbConnected: true, ideas: serialized });
  } catch (error: unknown) {
    console.error("Failed to fetch braindump ideas from MongoDB:", error);
    return NextResponse.json(
      {
        dbConnected: false,
        ideas: [],
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
    const { title, content } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    const newIdea = {
      title: title || content.slice(0, 50),
      content: content || "",
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("braindump").insertOne(newIdea);

    return NextResponse.json({
      dbConnected: true,
      idea: {
        ...newIdea,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Failed to create braindump idea in MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
