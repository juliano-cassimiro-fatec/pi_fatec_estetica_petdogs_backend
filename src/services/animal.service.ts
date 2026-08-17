import Animal from "../models/animal.model.js"
import type { UserRole } from "../models/auth.types.js"
import type { ICreateAnimalDTO, IUpdateAnimalDTO } from "../models/animal.types.js"

class AnimalService {
    private validateCreate(data: ICreateAnimalDTO): void {
        if (!data.nome?.trim() || !data.raca?.trim() || !data.porte?.trim() || !data.cliente) {
            throw new Error("Nome, raça, porte e tutor são obrigatórios")
        }

        if (!Number.isFinite(Number(data.idade)) || Number(data.idade) < 0) {
            throw new Error("Idade inválida")
        }
    }

    private buildScope(user: { id: string; role: UserRole }, id?: string) {
        const scope: Record<string, string> = {}
        if (id) scope._id = id
        if (user.role !== "admin") scope.cliente = user.id
        return scope
    }

    public async create(data: ICreateAnimalDTO) {
        this.validateCreate(data)

        const payload: Record<string, string | number> = {
            nome: data.nome.trim(),
            raca: data.raca.trim(),
            idade: Number(data.idade),
            porte: data.porte.trim().toLowerCase(),
            cliente: data.cliente,
        }

        if (data.foto?.trim()) payload.foto = data.foto.trim()

        return Animal.create(payload)
    }

    public async getAll(user: { id: string; role: UserRole }) {
        return Animal.find(this.buildScope(user)).populate("cliente", "name email telefone foto").sort({ createdAt: -1 })
    }

    public async getById(id: string, user: { id: string; role: UserRole }) {
        const animal = await Animal.findOne(this.buildScope(user, id)).populate("cliente", "name email telefone foto")

        if (!animal) {
            throw new Error("Pet não encontrado")
        }

        return animal
    }

    public async update(id: string, user: { id: string; role: UserRole }, data: IUpdateAnimalDTO & { cliente?: string }) {
        const payload: IUpdateAnimalDTO & { cliente?: string } = {}

        if (data.nome !== undefined) payload.nome = data.nome.trim()
        if (data.raca !== undefined) payload.raca = data.raca.trim()
        if (data.porte !== undefined) payload.porte = data.porte.trim().toLowerCase()
        if (data.foto !== undefined) payload.foto = data.foto.trim()
        if (data.cliente !== undefined && user.role === "admin") payload.cliente = data.cliente
        if (data.idade !== undefined) {
            if (!Number.isFinite(Number(data.idade)) || Number(data.idade) < 0) {
                throw new Error("Idade inválida")
            }
            payload.idade = Number(data.idade)
        }

        const animal = await Animal.findOneAndUpdate(this.buildScope(user, id), payload, { new: true })

        if (!animal) {
            throw new Error("Pet não encontrado")
        }

        return animal
    }

    public async delete(id: string, user: { id: string; role: UserRole }) {
        const animal = await Animal.findOneAndDelete(this.buildScope(user, id))

        if (!animal) {
            throw new Error("Pet não encontrado")
        }

        return animal
    }
}

export default new AnimalService()
