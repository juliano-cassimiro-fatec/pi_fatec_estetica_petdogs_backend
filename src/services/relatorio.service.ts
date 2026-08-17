import Relatorio from "../models/relatorio.model.js"
import type { ICreateRelatorioDTO, IUpdateRelatorioDTO } from "../models/relatorio.types.js"

class RelatorioService {

    async create(data: ICreateRelatorioDTO) {
        return await Relatorio.create(data)
    }

    async getAll() {
        return await Relatorio.find()
    }

    async getById(id: string) {
        return await Relatorio.findById(id)
    }

    async update(id: string, data: IUpdateRelatorioDTO) {
        return await Relatorio.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id: string) {
        return await Relatorio.findByIdAndDelete(id)
    }

}

export default new RelatorioService()