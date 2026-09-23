import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getUploadDirectory, UPLOAD_URL_PREFIX } from "../config/uploads.js";

import { AppError } from "../errors/app-error.js";

const types: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_SIZE = 5 * 1024 * 1024;

export async function saveUploadedImage(content: Buffer, contentType?: string): Promise<string> {
  const type = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = types[type];

  if (!extension) {
    throw new AppError(415, "Formato de imagem não suportado", "UNSUPPORTED_MEDIA_TYPE");
  }

  if (!content.length) {
    throw new AppError(400, "Arquivo de imagem vazio", "EMPTY_FILE");
  }

  if (content.length > MAX_SIZE) {
    throw new AppError(413, "Imagem excede o limite de 5 MB", "IMAGE_TOO_LARGE");
  }

  const directory = getUploadDirectory();

  await mkdir(directory, { recursive: true });

  const fileName = `${crypto.randomUUID()}${extension}`;

  await writeFile(path.join(directory, fileName), content, { flag: "wx" });

  return `${UPLOAD_URL_PREFIX}/${fileName}`;
}

export function validateStoredImagePath(value: string): string {
  const pathValue = value.trim();

  const valid = new RegExp(`^${UPLOAD_URL_PREFIX}/[0-9a-f-]+\\.(jpg|png|webp|gif)$`, "i").test(
    pathValue,
  );

  if (!valid) {
    throw new AppError(400, "Caminho de imagem inválido", "INVALID_IMAGE_PATH");
  }

  return pathValue;
}
