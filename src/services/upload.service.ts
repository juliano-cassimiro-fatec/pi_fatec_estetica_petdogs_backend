import crypto from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { getUploadDirectory, UPLOAD_URL_PREFIX } from "../config/uploads.js"
import { AppError } from "../errors/app-error.js"

const supportedTypes: Readonly<Record<string, string>> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export async function saveUploadedImage(content: Buffer, contentType?: string): Promise<string> {
    const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase() ?? ""
    const extension = supportedTypes[mediaType]
    if (!extension) throw new AppError(415, "Formato de imagem não suportado", "UNSUPPORTED_MEDIA_TYPE")
    if (!content.length) throw new AppError(400, "Arquivo de imagem vazio", "EMPTY_FILE")

    const directory = getUploadDirectory()
    await mkdir(directory, { recursive: true })
    const fileName = `${crypto.randomUUID()}${extension}`
    await writeFile(path.join(directory, fileName), content, { flag: "wx" })
    return `${UPLOAD_URL_PREFIX}/${fileName}`
}

export function validateStoredImagePath(value: string): string {
    const normalized = value.trim()
    if (!/^\/uploads\/[0-9a-f-]+\.(?:jpg|png|webp|gif)$/.test(normalized)) {
        throw new AppError(400, "Foto deve conter o caminho retornado pelo upload", "INVALID_IMAGE_PATH")
    }
    return normalized
}

/**
 * Keeps the existing API contract: clients may continue sending a Base64 data URL
 * in `foto`. The value is converted to a local file before a model is persisted.
 */
export async function storeImageInput(value: string): Promise<string> {
    const normalized = value.trim()
    if (normalized.startsWith(`${UPLOAD_URL_PREFIX}/`)) return validateStoredImagePath(normalized)

    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(normalized)
    if (!match?.[1] || !match[2]) {
        throw new AppError(400, "Foto deve ser uma imagem Base64 ou um caminho de upload válido", "INVALID_IMAGE")
    }

    const content = Buffer.from(match[2], "base64")
    if (content.length > MAX_IMAGE_SIZE) {
        throw new AppError(413, "Imagem excede o limite de 5 MB", "IMAGE_TOO_LARGE")
    }
    return saveUploadedImage(content, match[1])
}
