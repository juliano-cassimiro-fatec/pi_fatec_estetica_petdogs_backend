import { Router } from "express"
import relatorioController from "../controllers/relatorio.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"
import { ensureRoles } from "../middlewares/authorization.middleware.js"

const relatorioRoutes = Router()
relatorioRoutes.use(ensureAuthenticated, ensureRoles(["admin"]))

relatorioRoutes.get("/", relatorioController.getAll)

export default relatorioRoutes
