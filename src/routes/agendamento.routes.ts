import { Router } from "express";
import agendamentoController from "../controllers/agendamento.controller.js";
import {
  ensureAuthenticated,
  ensurePasswordChangeComplete,
} from "../middlewares/auth.middleware.js";
import { ensureRoles } from "../middlewares/authorization.middleware.js";

const agendamentoRoutes = Router();

agendamentoRoutes.use(ensureAuthenticated, ensurePasswordChangeComplete);
agendamentoRoutes.get("/disponibilidade", agendamentoController.availability);
agendamentoRoutes.get("/disponibilidade/mes", agendamentoController.availabilityMonth);
agendamentoRoutes.post("/", ensureRoles(["cliente"]), agendamentoController.create);
agendamentoRoutes.put("/:id", agendamentoController.update);
agendamentoRoutes.get("/", agendamentoController.getAll);
agendamentoRoutes.patch("/:id/cancel", agendamentoController.cancel);
agendamentoRoutes.delete("/:id", agendamentoController.cancel);

export default agendamentoRoutes;
