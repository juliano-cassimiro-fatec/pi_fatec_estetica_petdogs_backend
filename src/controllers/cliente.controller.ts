import type { Response } from "express"
import clienteService from "../services/cliente.service.js"
import type { AuthenticatedRequest } from "../middlewares/request.types.js"

class ClienteController {
    async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const { name, email, telefone, foto, senha, password } = req.body ?? {}
            const cliente = await clienteService.create({ name, email, telefone, foto, senha: senha ?? password })

            return res.status(201).json(cliente)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao cadastrar cliente"
            return res.status(400).json({ message })
        }
    }

    async getAll(_req: AuthenticatedRequest, res: Response) {
        const clientes = await clienteService.getAll()
        return res.status(200).json(clientes)
    }

    async getById(req: AuthenticatedRequest, res: Response) {
        const id = String(req.params.id ?? "")
        const cliente = await clienteService.getById(id)
        return res.status(200).json(cliente)
    }

    async getMe(req: AuthenticatedRequest, res: Response) {
        const cliente = await clienteService.getById(req.user?.id ?? "")
        return res.status(200).json(cliente)
    }

    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.targetId ?? ""
            const { name, email, telefone, foto, senha, password } = req.body ?? {}
            const cliente = await clienteService.update(id, { name, email, telefone, foto, senha: senha ?? password })

            return res.status(200).json(cliente)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao atualizar cliente"
            return res.status(400).json({ message })
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        const id = String(req.params.id ?? "")
        const cliente = await clienteService.delete(id)
        return res.status(200).json(cliente)
    }
}

export default new ClienteController()
