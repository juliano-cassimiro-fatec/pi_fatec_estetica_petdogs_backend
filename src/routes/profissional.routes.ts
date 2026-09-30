import { Router } from "express";
import profissionalController from "../controllers/profissional.controller.js";
import {
  ensureAuthenticated,
  ensurePasswordChangeComplete,
} from "../middlewares/auth.middleware.js";
import { ensureRoles, resolveTargetIdForRole } from "../middlewares/authorization.middleware.js";

const profissionalRoutes = Router();

profissionalRoutes.use(ensureAuthenticated, ensurePasswordChangeComplete);
profissionalRoutes.get("/", profissionalController.getAll);
profissionalRoutes.post("/", ensureRoles(["admin"]), profissionalController.create);
profissionalRoutes.put(
  "/me",
  ensureRoles(["profissional"]),
  resolveTargetIdForRole("profissional"),
  profissionalController.update,
);
profissionalRoutes.get("/:id", profissionalController.getById);
profissionalRoutes.put(
  "/:id",
  ensureRoles(["admin"]),
  resolveTargetIdForRole("profissional"),
  profissionalController.update,
);
profissionalRoutes.delete("/:id", ensureRoles(["admin"]), profissionalController.delete);

export default profissionalRoutes;
