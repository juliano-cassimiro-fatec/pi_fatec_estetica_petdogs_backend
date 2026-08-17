import express from "express"
import type { Express } from "express"
import cors from "cors";
import routes from "../routes/index.js";

class App {
  public server: Express

  constructor() {
    this.server = express()
    this.middlewares()
    this.routes()
  }

  private middlewares(): void {
    const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:5173"
    const corsOptions = {
      origin: allowedOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }

    this.server.use(cors(corsOptions))
    this.server.options(/.*/, cors(corsOptions))
    this.server.use(express.json({ limit: "10mb" }))
    this.server.use(express.urlencoded({ extended: true, limit: "10mb" }))
  }

  private routes(): void {
    this.server.use("/api/v1", routes)
  }
}

export default new App().server