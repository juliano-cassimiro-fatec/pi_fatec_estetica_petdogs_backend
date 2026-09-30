import { Router } from "express";
import adminController from "../controllers/admin.controller.js";
import {
  ensureAuthenticated,
  ensurePasswordChangeComplete,
} from "../middlewares/auth.middleware.js";
import { ensureRoles } from "../middlewares/authorization.middleware.js";

const adminRoutes = Router();

adminRoutes.use(ensureAuthenticated, ensurePasswordChangeComplete, ensureRoles(["admin"]));
adminRoutes.get("/users", adminController.listUsers);

export default adminRoutes;
