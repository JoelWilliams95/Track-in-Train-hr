import { MongoClient, Db } from 'mongodb'
import mongoose from 'mongoose'

// MongoDB connection string - you'll need to replace this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/track-n-train-hr'

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

// Global variable to cache the connection (Mongo driver)
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

// MongoDB Native Driver Connection
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()

  const db = client.db('track-n-train-hr')

  cachedClient = client
  cachedDb = db

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Connected to MongoDB (native driver)')
  }
  return { client, db }
}

// Hot-reload safe Mongoose connection cache
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const mongooseCached = global._mongoose || { conn: null, promise: null }
if (!global._mongoose) global._mongoose = mongooseCached

// Mongoose Connection (for schema-based operations)
export async function connectToMongoose(): Promise<void> {
  if (mongooseCached.conn) return

  if (!mongooseCached.promise) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Connecting to MongoDB via Mongoose...')
    }
    mongooseCached.promise = mongoose.connect(MONGODB_URI)
  }

  await mongooseCached.promise
  mongooseCached.conn = mongoose

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Connected to MongoDB via Mongoose')
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray()
      console.log('🔍 Available collections:', collections.map((c) => c.name))
    }
  }
}

// Disconnect function
export async function disconnectFromMongoDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
  }

  if (mongooseCached.conn) {
    await mongoose.disconnect()
    mongooseCached.conn = null
    mongooseCached.promise = null
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Disconnected from MongoDB')
  }
}

// Database collections
export const COLLECTIONS = {
  USERS: 'users',
  PERSONNEL_RECORDS: 'personnelRecords',
  NOTIFICATIONS: 'notifications',
  LOGS: 'logs',
  COMMENTS: 'comments',
} as const

// Helper function to get a collection
export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase()
  return db.collection(collectionName)
}
