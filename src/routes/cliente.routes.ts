import { Router } from "express"
import clienteController from "../controllers/cliente.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"
import { ensureRoles, resolveTargetIdForRole } from "../middlewares/authorization.middleware.js"

const clienteRoutes = Router()

clienteRoutes.use(ensureAuthenticated)
clienteRoutes.get("/me", ensureRoles(["cliente"]), clienteController.getMe)
clienteRoutes.put("/me", ensureRoles(["cliente"]), resolveTargetIdForRole("cliente"), clienteController.update)
clienteRoutes.post("/", ensureRoles(["admin"]), clienteController.create)
clienteRoutes.get("/", ensureRoles(["admin"]), clienteController.getAll)
clienteRoutes.get("/:id", ensureRoles(["admin"]), clienteController.getById)
clienteRoutes.put("/:id", ensureRoles(["admin"]), resolveTargetIdForRole("cliente"), clienteController.update)
clienteRoutes.delete("/:id", ensureRoles(["admin"]), clienteController.delete)

export default clienteRoutes
