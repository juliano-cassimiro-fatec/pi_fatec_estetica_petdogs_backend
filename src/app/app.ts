import cors from "cors"
import express from "express"
import routes from "../routes/index.js"
import { handleError } from "../middlewares/error.middleware.js"
import { setupSwagger } from "./swagger.js"
import { getUploadDirectory, UPLOAD_URL_PREFIX } from "../config/uploads.js"

const app = express()
const corsOptions = {
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
// Base64 adds roughly 33% overhead; this keeps existing JSON requests compatible
// with the same 5 MB image limit enforced by the upload service.
app.use(express.json({ limit: "7mb" }))
app.use(express.urlencoded({ extended: true, limit: "7mb" }))

setupSwagger(app)
app.use(UPLOAD_URL_PREFIX, express.static(getUploadDirectory(), { index: false, fallthrough: false }))
app.use("/api/v1", routes)
app.use(handleError)

export default app
