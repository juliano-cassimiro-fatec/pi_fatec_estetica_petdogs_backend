import Agendamento from "../models/agendamento.model.js"
import Animal from "../models/animal.model.js"
import Cliente from "../models/cliente.model.js"
import Servico from "../models/servico.model.js"

class RelatorioService {
    async getAll() {
        const [total_clientes, total_animais, total_servicos, total_cancelamentos] = await Promise.all([
            Cliente.countDocuments(),
            Animal.countDocuments(),
            Servico.countDocuments(),
            Agendamento.countDocuments({ status: "canceled" }),
        ])
        return { total_clientes, total_animais, total_servicos, total_cancelamentos, total_faltas: 0 }
    }
}

export default new RelatorioService()
