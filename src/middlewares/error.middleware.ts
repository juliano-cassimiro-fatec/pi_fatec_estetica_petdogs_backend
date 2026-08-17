import type { ErrorRequestHandler } from "express"
import mongoose from "mongoose"
import { AppError } from "../errors/app-error.js"

export const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message, code: error.code })
        return
    }
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
        res.status(400).json({ message: "Dados inválidos", code: "VALIDATION_ERROR" })
        return
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        res.status(409).json({ message: "Registro duplicado", code: "CONFLICT" })
        return
    }
    console.error(error)
    res.status(500).json({ message: "Erro interno do servidor", code: "INTERNAL_ERROR" })
}
