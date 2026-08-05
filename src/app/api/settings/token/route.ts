import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";

export async function GET() {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    const client = await clientPromise;
    const db = client.db("habit-tracker");

    const settingsDoc = await db.collection("settings").findOne({ _id: "api_token" as any });

    if (!settingsDoc || !settingsDoc.token) {
      return NextResponse.json({ hasToken: false, token: null });
    }

    return NextResponse.json({
      hasToken: true,
      token: settingsDoc.token,
      createdAt: settingsDoc.createdAt,
    });
  } catch (error: unknown) {
    console.error("Error fetching API token:", error);
    return NextResponse.json({ error: "Failed to fetch API token" }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    const client = await clientPromise;
    const db = client.db("habit-tracker");

    // Generate token: hab_ + 24 random hex chars
    const newToken = `hab_${crypto.randomBytes(16).toString("hex")}`;
    const createdAt = new Date().toISOString();

    await db.collection("settings").updateOne(
      { _id: "api_token" as any },
      { $set: { token: newToken, createdAt } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      hasToken: true,
      token: newToken,
      createdAt,
    });
  } catch (error: unknown) {
    console.error("Error generating API token:", error);
    return NextResponse.json({ error: "Failed to generate API token" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }
    const client = await clientPromise;
    const db = client.db("habit-tracker");

    await db.collection("settings").deleteOne({ _id: "api_token" as any });

    return NextResponse.json({ success: true, hasToken: false, token: null });
  } catch (error: unknown) {
    console.error("Error revoking API token:", error);
    return NextResponse.json({ error: "Failed to revoke API token" }, { status: 500 });
  }
}
