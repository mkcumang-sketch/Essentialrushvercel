import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export class MongoConnectionError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MongoConnectionError";
    this.cause = cause;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unknown MongoDB error";
}

export default async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new MongoConnectionError(
      "MONGODB_URI is not defined. Add it to .env.local (see .env.local.example)."
    );
  }

  // Check if connection is already established
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV === "development",
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;

    if (error instanceof MongoConnectionError) {
      throw error;
    }

    throw new MongoConnectionError(
      `Failed to connect to MongoDB: ${toErrorMessage(error)}`,
      error
    );
  }
}