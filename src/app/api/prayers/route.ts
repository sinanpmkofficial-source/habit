import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const prayers = await db.collection("prayers").find({}).toArray();

    const serialized = prayers.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));

    return NextResponse.json({ dbConnected: true, prayers: serialized });
  } catch (error: unknown) {
    console.error("Failed to fetch prayers from MongoDB:", error);
    return NextResponse.json(
      {
        dbConnected: false,
        prayers: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
