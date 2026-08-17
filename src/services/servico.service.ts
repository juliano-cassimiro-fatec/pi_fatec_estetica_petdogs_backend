import Servico from "../models/servico.model.js"
import type { ICreateServicoDTO, IUpdateServicoDTO } from "../models/servico.types.js"

class ServicoService {
    private validate(data: ICreateServicoDTO): void {
        if (!data.name?.trim()) {
            throw new Error("Nome do serviço é obrigatório")
        }

        if (!data.descricao?.trim()) {
            throw new Error("Descrição do serviço é obrigatória")
        }

        if (!Number.isFinite(Number(data.duracao_min)) || Number(data.duracao_min) <= 0) {
            throw new Error("Duração inválida")
        }

        if (!Number.isFinite(Number(data.preco)) || Number(data.preco) < 0) {
            throw new Error("Preço inválido")
        }
    }

    public async create(data: ICreateServicoDTO) {
        this.validate(data)

        return Servico.create({
            name: data.name.trim(),
            descricao: data.descricao.trim(),
            duracao_min: Number(data.duracao_min),
            preco: Number(data.preco),
        })
    }

    public async findAll() {
        return Servico.find().sort({ name: 1 })
    }

    public async findById(id: string) {
        return Servico.findById(id)
    }

    public async delete(id: string) {
        return Servico.findByIdAndDelete(id)
    }

    public async update(id: string, data: IUpdateServicoDTO) {
        const payload: IUpdateServicoDTO = {}

        if (data.name !== undefined) payload.name = data.name.trim()
        if (data.descricao !== undefined) payload.descricao = data.descricao.trim()
        if (data.duracao_min !== undefined) payload.duracao_min = Number(data.duracao_min)
        if (data.preco !== undefined) payload.preco = Number(data.preco)

        return Servico.findByIdAndUpdate(id, payload, { new: true })
    }
}

export default new ServicoService()
