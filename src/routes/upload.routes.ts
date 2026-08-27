import express, { Router } from "express";
import uploadController from "../controllers/upload.controller.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

const uploadRoutes = Router();

uploadRoutes.post(
  "/",
  ensureAuthenticated,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], limit: "5mb" }),
  uploadController.create,
);

export default uploadRoutes;
