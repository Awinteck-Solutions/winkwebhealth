import "./env";
import mongoose from "mongoose";

export async function connectDb(): Promise<void> {
  const uri = process.env.DB_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("DB_URL or MONGODB_URI is required");
  await mongoose.connect(uri);
  console.log(JSON.stringify({ level: "info", message: "Worker connected to MongoDB" }));
}

export { mongoose };
