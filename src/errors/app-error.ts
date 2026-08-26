export class AppError extends Error {
    constructor(public readonly statusCode: number, message: string, public readonly code = "REQUEST_ERROR") {
        super(message)
    }
}

export const badRequest = (message: string) => new AppError(400, message, "BAD_REQUEST")
export const forbidden = (message = "Acesso negado") => new AppError(403, message, "FORBIDDEN")
export const notFound = (message: string) => new AppError(404, message, "NOT_FOUND")
export const conflict = (message: string) => new AppError(409, message, "CONFLICT")
