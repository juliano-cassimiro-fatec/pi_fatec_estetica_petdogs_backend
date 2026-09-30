import { Router } from "express";
import animalController from "../controllers/animal.controller.js";
import {
  ensureAuthenticated,
  ensurePasswordChangeComplete,
} from "../middlewares/auth.middleware.js";

const animalRoutes = Router();

animalRoutes.use(ensureAuthenticated, ensurePasswordChangeComplete);
animalRoutes.post("/", animalController.create);
animalRoutes.get("/", animalController.getAll);
animalRoutes.get("/:id", animalController.getById);
animalRoutes.put("/:id", animalController.update);
animalRoutes.delete("/:id", animalController.delete);

export default animalRoutes;
