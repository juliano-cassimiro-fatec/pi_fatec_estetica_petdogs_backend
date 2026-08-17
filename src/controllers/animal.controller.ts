import type { Response } from "express"
import animalService from "../services/animal.service.js"
import type { AuthenticatedRequest } from "../middlewares/request.types.js"

class AnimalController {
    public async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const { nome, name, raca, breed, idade, age, porte, size, foto, cliente, clienteId } = req.body ?? {}
            const animal = await animalService.create({
                nome: nome ?? name,
                raca: raca ?? breed,
                idade: idade ?? age,
                porte: porte ?? size,
                foto,
                cliente: req.user?.role === "admin" ? cliente ?? clienteId : req.user?.id ?? "",
            })

            return res.status(201).json(animal)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao cadastrar pet"
            return res.status(400).json({ message })
        }
    }

    public async getAll(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const animais = await animalService.getAll({ id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

        return res.status(200).json(animais)
    }

    public async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const animal = await animalService.getById(String(req.params.id ?? ""), { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

            return res.status(200).json(animal)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao buscar pet"
            return res.status(404).json({ message })
        }
    }

    public async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const { nome, name, raca, breed, idade, age, porte, size, foto, cliente, clienteId } = req.body ?? {}
            const animal = await animalService.update(String(req.params.id ?? ""), { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" }, {
                nome: nome ?? name,
                raca: raca ?? breed,
                idade: idade ?? age,
                porte: porte ?? size,
                foto,
                cliente: cliente ?? clienteId,
            })

            return res.status(200).json(animal)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao atualizar pet"
            return res.status(400).json({ message })
        }
    }

    public async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const animal = await animalService.delete(String(req.params.id ?? ""), { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

            return res.status(200).json(animal)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao remover pet"
            return res.status(400).json({ message })
        }
    }
}

export default new AnimalController()
