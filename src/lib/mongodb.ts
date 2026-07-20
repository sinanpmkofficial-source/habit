import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR.
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  console.warn("MONGODB_URI env variable is not set. Falling back to local storage mode.");
}

export default clientPromise;

let indexesEnsured = false;

/**
 * Returns the habit-tracker Db instance and ensures indexes exist.
 * createIndex is idempotent — safe to call on every cold start.
 */
export async function getDb(): Promise<Db> {
  if (!clientPromise) throw new Error("MongoDB not configured");
  const mongoClient = await clientPromise;
  const db = mongoClient.db("habit-tracker");

  if (!indexesEnsured) {
    await Promise.all([
      // Tasks: fast lookups by date (used when filtering tasks for a selected day)
      db.collection("tasks").createIndex({ date: 1 }),
      // Tasks: fast lookups by completion status + date (useful for stats)
      db.collection("tasks").createIndex({ date: 1, completed: 1 }),
      // Habits: fast lookups by creation date (used to filter active habits per day)
      db.collection("habits").createIndex({ createdAt: 1 }),
      // Prayers: fast lookups by date
      db.collection("prayers").createIndex({ date: 1 }),
    ]);
    indexesEnsured = true;
  }

  return db;
}
