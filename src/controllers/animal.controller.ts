import type { Response } from "express"
import animalService from "../services/animal.service.js"
import type { AuthenticatedRequest } from "../models/request.types.js"

class AnimalController {
    public async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
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
    }

    public async getAll(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const animais = await animalService.getAll({ id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

        return res.json(animais)
    }

    public async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const user = { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" }
        return res.json(await animalService.getById(String(req.params.id ?? ""), user))
    }

    public async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const { nome, name, raca, breed, idade, age, porte, size, foto, cliente, clienteId } = req.body ?? {}
        const animal = await animalService.update(String(req.params.id ?? ""), { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" }, {
            nome: nome ?? name,
            raca: raca ?? breed,
            idade: idade ?? age,
            porte: porte ?? size,
            foto,
            cliente: cliente ?? clienteId,
        })
        return res.json(animal)
    }

    public async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const user = { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" }
        return res.json(await animalService.delete(String(req.params.id ?? ""), user))
    }
}

export default new AnimalController()
