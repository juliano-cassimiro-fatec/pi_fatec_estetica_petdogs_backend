import mongoose from "mongoose"
import { badRequest } from "../errors/app-error.js"

export function assertObjectId(value: string, field = "id"): void {
    if (!mongoose.isValidObjectId(value)) throw badRequest(`${field} inválido`)
}

export function assertEmail(value: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw badRequest("E-mail inválido")
}

export function assertTime(value: string, field: string): void {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw badRequest(`${field} inválido`)
}
