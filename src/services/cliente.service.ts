import authService from "./auth.service.js"
import Cliente from "../models/cliente.model.js"
import type { ICreateClienteDTO, IUpdateClienteDTO } from "../models/cliente.types.js"

class ClienteService {
    async create(data: ICreateClienteDTO) {
        if (!data.name?.trim() || !data.email?.trim() || !data.senha?.trim()) {
            throw new Error("Nome, e-mail e senha são obrigatórios")
        }

        authService.assertPassword(data.senha)

        const payload: Record<string, string> = {
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            senha: await authService.hashPassword(data.senha),
            role: "cliente",
        }

        if (data.telefone?.trim()) payload.telefone = data.telefone.trim()
        if (data.foto?.trim()) payload.foto = data.foto.trim()

        return Cliente.create(payload)
    }

    async getAll() {
        return Cliente.find().sort({ name: 1 })
    }

    async getById(id: string) {
        return Cliente.findById(id)
    }

    async update(id: string, data: IUpdateClienteDTO) {
        const payload: IUpdateClienteDTO = {}
        if (data.name !== undefined) payload.name = data.name.trim()
        if (data.email !== undefined) payload.email = data.email.trim().toLowerCase()
        if (data.telefone !== undefined) payload.telefone = data.telefone.trim()
        if (data.foto !== undefined) payload.foto = data.foto.trim()
        if (data.senha !== undefined && data.senha.trim()) {
            authService.assertPassword(data.senha)
            payload.senha = await authService.hashPassword(data.senha)
        }

        return Cliente.findByIdAndUpdate(id, payload, { new: true })
    }

    async delete(id: string) {
        return Cliente.findByIdAndDelete(id)
    }
}

export default new ClienteService()
