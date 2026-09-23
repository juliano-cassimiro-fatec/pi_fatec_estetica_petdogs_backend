import type { Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { saveUploadedImage } from "../services/upload.service.js";

interface UploadBody {
  arquivo?: unknown;
  base64?: unknown;
  contentType?: unknown;
  file?: unknown;
  mimeType?: unknown;
}

function getUploadContent(req: Request): { content: Buffer; contentType: string | undefined } {
  if (Buffer.isBuffer(req.body)) {
    return { content: req.body, contentType: req.headers["content-type"] };
  }

  if (typeof req.body !== "object" || req.body === null) {
    throw new AppError(400, "Arquivo não enviado", "FILE_REQUIRED");
  }

  const body = req.body as UploadBody;
  const encoded = body.file ?? body.arquivo ?? body.base64;

  if (typeof encoded !== "string" || !encoded.trim()) {
    throw new AppError(400, "Arquivo não enviado", "FILE_REQUIRED");
  }

  const dataUri = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(encoded);
  const base64 = dataUri?.[2] ?? encoded;
  const contentType = dataUri?.[1] ?? body.contentType ?? body.mimeType;

  if (typeof contentType !== "string") {
    throw new AppError(400, "Tipo do arquivo não informado", "FILE_TYPE_REQUIRED");
  }

  return { content: Buffer.from(base64, "base64"), contentType };
}

class UploadController {
  public async create(req: Request, res: Response): Promise<Response> {
    const { content, contentType } = getUploadContent(req);
    const caminho = await saveUploadedImage(content, contentType);
    const partesDoCaminho = caminho.split("/");
    const nome = partesDoCaminho[partesDoCaminho.length - 1];
    const url = `${req.protocol}://${req.get("host")}${caminho}`;

    return res.status(201).json({ caminho, nome, tipo: contentType, url });
  }
}

export default new UploadController();
