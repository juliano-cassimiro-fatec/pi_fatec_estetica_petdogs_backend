import { Router } from "express"
import agendamentoRoutes from "./agendamento.routes.js"
import animalRoutes from "./animal.routes.js"
import authRoutes from "./auth.routes.js"
import clienteRoutes from "./cliente.routes.js"
import profissionalRoutes from "./profissional.routes.js"
import relatorioRoutes from "./relatorio.routes.js"
import servicoRoutes from "./servico.routes.js"

const routes = Router()

routes.get("/health", (_request, response) => {
    return response.status(200).json({
        message: "API Rodando OK!!",
    })
})

routes.use("/auth", authRoutes)
routes.use("/clientes", clienteRoutes)
routes.use("/pets", animalRoutes)
routes.use("/animais", animalRoutes)
routes.use("/servicos", servicoRoutes)
routes.use("/agendamentos", agendamentoRoutes)
routes.use("/profissionais", profissionalRoutes)
routes.use("/relatorios", relatorioRoutes)

export default routes
