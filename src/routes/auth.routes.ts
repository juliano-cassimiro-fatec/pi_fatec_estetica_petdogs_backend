import { Router } from "express"
import authController from "../controllers/auth.controller.js"

const authRoutes = Router()
authRoutes.get("/me", authController.me)
authRoutes.post("/register", authController.register)
authRoutes.post("/otp/send", authController.sendOtp)
authRoutes.post("/otp/verify", authController.verifyOtp)
authRoutes.post("/login", authController.login)
authRoutes.post("/forgot-password", authController.forgotPassword)
authRoutes.post("/reset-password", authController.resetPassword)

export default authRoutes
