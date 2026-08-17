import type { Request, Response } from "express"
import servicoService from "../services/servico.service.js"

class ServicoController {
    public async create(request: Request, response: Response): Promise<Response> {
        try {
            const { name, descricao, duracao_min, preco } = request.body ?? {}
            const servico = await servicoService.create({ name, descricao, duracao_min, preco })

            return response.status(201).json(servico)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao cadastrar serviço"
            return response.status(400).json({ message })
        }
    }

    public async findAll(_request: Request, response: Response): Promise<Response> {
        const servicos = await servicoService.findAll()

        return response.status(200).json(servicos)
    }

    public async delete(request: Request, response: Response): Promise<Response> {
        const id = String(request.params.id ?? "")
        await servicoService.delete(id)

        return response.status(200).json({ message: "Serviço removido com sucesso" })
    }

    public async findById(request: Request, response: Response): Promise<Response> {
        const id = String(request.params.id ?? "")
        const servico = await servicoService.findById(id)

        return response.status(200).json(servico)
    }

    public async update(request: Request, response: Response): Promise<Response> {
        const id = String(request.params.id ?? "")
        const { name, descricao, duracao_min, preco } = request.body ?? {}
        const servico = await servicoService.update(id, { name, descricao, duracao_min, preco })

        return response.status(200).json(servico)
    }
}

export default new ServicoController()
