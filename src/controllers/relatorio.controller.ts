import type { Request, Response } from "express"
import relatorioService from "../services/relatorio.service.js"

class RelatorioController {
    async create(req: Request, res: Response): Promise<Response> {
        const relatorio = await relatorioService.create(req.body)
        return res.status(201).json(relatorio)
    }

    async getAll(_req: Request, res: Response): Promise<Response> {
        const relatorios = await relatorioService.getAll()

        return res.status(200).json(relatorios)
    }

    async getById(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const relatorio = await relatorioService.getById(req.params.id)
        return res.status(200).json(relatorio)
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const relatorio = await relatorioService.update(req.params.id, req.body)
        return res.status(200).json(relatorio)
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const relatorio = await relatorioService.delete(req.params.id)
        return res.status(200).json(relatorio)
    }
}

export default new RelatorioController()
