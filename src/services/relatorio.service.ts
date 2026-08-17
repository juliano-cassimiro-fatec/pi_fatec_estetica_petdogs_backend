import Relatorio from "../models/relatorio.model.js"
import type { ICreateRelatorioDTO, IUpdateRelatorioDTO } from "../models/relatorio.types.js"

class RelatorioService {

    async create(data: ICreateRelatorioDTO) {
        return Relatorio.create(data)
    }

    async getAll() {
        return Relatorio.find()
    }

    async getById(id: string) {
        return Relatorio.findById(id)
    }

    async update(id: string, data: IUpdateRelatorioDTO) {
        return Relatorio.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id: string) {
        return Relatorio.findByIdAndDelete(id)
    }

}

export default new RelatorioService()