import { Router } from "express"
import authController from "../controllers/auth.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"
import { rateLimit } from "../middlewares/rate-limit.middleware.js"

const authRoutes = Router()
const authLimiter = rateLimit(10, 15 * 60 * 1000)

authRoutes.get("/me", ensureAuthenticated, authController.me)
authRoutes.post("/register", authLimiter, authController.register)
authRoutes.post("/login", authLimiter, authController.login)
authRoutes.post("/forgot-password", authLimiter, authController.forgotPassword)
authRoutes.post("/reset-password", authLimiter, authController.resetPassword)

export default authRoutes
