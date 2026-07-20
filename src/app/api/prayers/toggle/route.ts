import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { PrayerKey } from "@/lib/prayer-utils";

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { date, prayer } = body as { date: string; prayer: PrayerKey };

    if (!date || !prayer) {
      return NextResponse.json(
        { error: "Date and prayer key are required" },
        { status: 400 }
      );
    }

    // Find existing doc for date
    const existing = await db.collection("prayers").findOne({ date });

    let updatedCompleted: PrayerKey[] = [];
    if (existing) {
      const currentCompleted: PrayerKey[] = existing.completed || [];
      if (currentCompleted.includes(prayer)) {
        updatedCompleted = currentCompleted.filter((p) => p !== prayer);
      } else {
        updatedCompleted = [...currentCompleted, prayer];
      }
    } else {
      updatedCompleted = [prayer];
    }

    const result = await db.collection("prayers").findOneAndUpdate(
      { date },
      { $set: { completed: updatedCompleted } },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      dbConnected: true,
      prayerRecord: {
        ...result,
        _id: result?._id?.toString(),
        date,
        completed: updatedCompleted,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to toggle prayer in MongoDB:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
