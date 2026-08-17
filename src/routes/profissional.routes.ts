import { Router } from "express"
import profissionalController from "../controllers/profissional.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"
import { ensureRoles, resolveTargetIdForRole } from "../middlewares/authorization.middleware.js"

const profissionalRoutes = Router()

profissionalRoutes.get("/", ensureAuthenticated, profissionalController.getAll)
profissionalRoutes.post("/", ensureAuthenticated, ensureRoles(["admin"]), profissionalController.create)
profissionalRoutes.put("/me", ensureAuthenticated, ensureRoles(["profissional"]), resolveTargetIdForRole("profissional"), profissionalController.update)
profissionalRoutes.get("/:id", ensureAuthenticated, profissionalController.getById)
profissionalRoutes.put("/:id", ensureAuthenticated, ensureRoles(["admin"]), resolveTargetIdForRole("profissional"), profissionalController.update)
profissionalRoutes.delete("/:id", ensureAuthenticated, ensureRoles(["admin"]), profissionalController.delete)

export default profissionalRoutes
