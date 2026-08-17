import { Router } from "express"
import authController from "../controllers/auth.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

const authRoutes = Router()

authRoutes.get("/me", ensureAuthenticated, authController.me)
authRoutes.post("/register", authController.register)
authRoutes.post("/login", authController.login)
authRoutes.post("/forgot-password", authController.forgotPassword)
authRoutes.post("/reset-password", authController.resetPassword)

export default authRoutes
