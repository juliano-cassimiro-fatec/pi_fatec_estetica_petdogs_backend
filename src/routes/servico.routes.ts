import { Router } from "express"
import servicoController from "../controllers/servico.controller.js"

const servicoRoutes = Router()

servicoRoutes.get("/", servicoController.findAll)
servicoRoutes.get("/:id", servicoController.findById)
servicoRoutes.post("/", servicoController.create)
servicoRoutes.delete("/:id", servicoController.delete)
servicoRoutes.put("/:id", servicoController.update)

export default servicoRoutes
