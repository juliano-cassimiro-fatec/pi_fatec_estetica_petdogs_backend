import { Router } from "express"
import relatorioController from "../controllers/relatorio.controller.js"

const relatorioRoutes = Router()

relatorioRoutes.post("/", relatorioController.create)
relatorioRoutes.get("/", relatorioController.getAll)
relatorioRoutes.get("/:id", relatorioController.getById)
relatorioRoutes.put("/:id", relatorioController.update)
relatorioRoutes.delete("/:id", relatorioController.delete)

export default relatorioRoutes