import 'dotenv/config'
import mongoose from "mongoose"
import { env } from "./env.js"

export async function connectDatabase(): Promise<void> {
    await mongoose.connect(env("MONGO_URI"))
    console.log("Connected to MongoDB")
}
