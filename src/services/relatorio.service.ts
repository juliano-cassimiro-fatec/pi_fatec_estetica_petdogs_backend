import Relatorio from "../models/relatorio.model.js"
import type { ICreateRelatorioDTO, IUpdateRelatorioDTO } from "../models/relatorio.types.js"

class RelatorioService {

    async create(data: ICreateRelatorioDTO) {
        try {
            return await Relatorio.create(data)
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    async getAll() {
        try {
            return await Relatorio.find()
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    async getById(id: string) {
        try {
            return await Relatorio.findById(id)
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    async update(id: string, data: IUpdateRelatorioDTO) {
        try {
            return await Relatorio.findByIdAndUpdate(id, data, { new: true })
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    async delete(id: string) {
        try {
            return await Relatorio.findByIdAndDelete(id)
        } catch (e) {
            console.log(e)
            throw e
        }
    }

}

export default new RelatorioService()