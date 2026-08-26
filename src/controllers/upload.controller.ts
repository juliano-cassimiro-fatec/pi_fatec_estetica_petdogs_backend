import type { Request, Response } from "express"
import { saveUploadedImage } from "../services/upload.service.js"

class UploadController {
    public async create(req: Request, res: Response): Promise<Response> {
        const caminho = await saveUploadedImage(req.body as Buffer, req.headers["content-type"])
        return res.status(201).json({ caminho })
    }
}

export default new UploadController()
