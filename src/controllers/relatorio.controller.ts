import type { Request, Response } from "express"
import relatorioService from "../services/relatorio.service.js"

class RelatorioController {

    async create(req: Request, res: Response): Promise<Response> {
        const {
            total_clientes,
            total_animais,
            total_servicos,
            total_cancelamentos,
            total_faltas
        } = req.body ?? {}

        const relatorio = await relatorioService.create({
            total_clientes,
            total_animais,
            total_servicos,
            total_cancelamentos,
            total_faltas
        })

        return res.status(201).json(relatorio)
    }

    async getAll(_req: Request, res: Response): Promise<Response> {
        const relatorios = await relatorioService.getAll()

        return res.status(200).json(relatorios)
    }

    async getById(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const id = req.params.id

        const relatorio = await relatorioService.getById(id)

        return res.status(200).json(relatorio)
    }

    async update(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const id = req.params.id

        const {
            total_clientes,
            total_animais,
            total_servicos,
            total_cancelamentos,
            total_faltas
        } = req.body ?? {}

        const relatorio = await relatorioService.update(id, {
            total_clientes,
            total_animais,
            total_servicos,
            total_cancelamentos,
            total_faltas
        })

        return res.status(200).json(relatorio)
    }

    async delete(req: Request<{ id: string }>, res: Response): Promise<Response> {
        const id = req.params.id

        const relatorio = await relatorioService.delete(id)

        return res.status(200).json(relatorio)
    }

}

export default new RelatorioController()