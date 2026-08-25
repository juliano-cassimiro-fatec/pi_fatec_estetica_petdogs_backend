import { Router } from "express"
import profissionalController from "../controllers/profissional.controller.js"

const profissionalRoutes = Router()

profissionalRoutes.get("/", profissionalController.getAll)
profissionalRoutes.post("/", profissionalController.create)
profissionalRoutes.put("/me", profissionalController.update)
profissionalRoutes.get("/:id", profissionalController.getById)
profissionalRoutes.put("/:id", profissionalController.update)
profissionalRoutes.delete("/:id", profissionalController.delete)

export default profissionalRoutes
