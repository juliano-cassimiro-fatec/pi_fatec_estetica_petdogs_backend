import { Router } from "express"
import relatorioController from "../controllers/relatorio.controller.js"

const relatorioRoutes = Router()
relatorioRoutes.get("/", relatorioController.getAll)

export default relatorioRoutes
