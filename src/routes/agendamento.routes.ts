import { Router } from "express"
import agendamentoController from "../controllers/agendamento.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

const agendamentoRoutes = Router()

agendamentoRoutes.use(ensureAuthenticated)
agendamentoRoutes.get("/disponibilidade", agendamentoController.availability)
agendamentoRoutes.get("/disponibilidade/mes", agendamentoController.availabilityMonth)
agendamentoRoutes.post("/", agendamentoController.create)
agendamentoRoutes.put("/:id", agendamentoController.update)
agendamentoRoutes.get("/", agendamentoController.getAll)
agendamentoRoutes.patch("/:id/cancel", agendamentoController.cancel)
agendamentoRoutes.delete("/:id", agendamentoController.cancel)

export default agendamentoRoutes
