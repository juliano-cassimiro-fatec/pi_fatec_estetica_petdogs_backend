import { Router } from "express"
import clienteController from "../controllers/cliente.controller.js"

const clienteRoutes = Router()

clienteRoutes.get("/me", clienteController.getMe)
clienteRoutes.put("/me", clienteController.update)
clienteRoutes.post("/", clienteController.create)
clienteRoutes.get("/", clienteController.getAll)
clienteRoutes.get("/:id", clienteController.getById)
clienteRoutes.put("/:id", clienteController.update)
clienteRoutes.delete("/:id", clienteController.delete)

export default clienteRoutes
