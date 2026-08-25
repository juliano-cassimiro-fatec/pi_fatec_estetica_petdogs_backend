import path from "node:path"

export const UPLOAD_URL_PREFIX = "/uploads"

export function getUploadDirectory(): string {
    const configuredDirectory = process.env.UPLOAD_DIR?.trim()
    if (!configuredDirectory) throw new Error("Variável de ambiente UPLOAD_DIR não configurada")
    return path.resolve(configuredDirectory)
}
