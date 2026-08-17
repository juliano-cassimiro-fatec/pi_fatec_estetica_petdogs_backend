import type { ErrorRequestHandler } from "express"

export const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Erro interno do servidor"
    res.status(400).json({ message })
}
