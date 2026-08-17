import cors from "cors"
import express from "express"
import routes from "../routes/index.js"
import { handleError } from "../middlewares/error.middleware.js"
import { setupSwagger } from "./swagger.js"

const app = express()
const corsOptions = {
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

setupSwagger(app)
app.use("/api/v1", routes)
app.use(handleError)

export default app
