import { Router } from "express"
import servicoController from "../controllers/servico.controller.js"
import { ensureAuthenticated, ensureRoles } from "../middlewares/auth.middleware.js"

const servicoRoutes = Router()

servicoRoutes.get("/", servicoController.findAll)
servicoRoutes.get("/:id", servicoController.findById)
servicoRoutes.post("/", ensureAuthenticated, ensureRoles(["admin"]), servicoController.create)
servicoRoutes.delete("/:id", ensureAuthenticated, ensureRoles(["admin"]), servicoController.delete)
servicoRoutes.put("/:id", ensureAuthenticated, ensureRoles(["admin"]), servicoController.update)

export default servicoRoutes
