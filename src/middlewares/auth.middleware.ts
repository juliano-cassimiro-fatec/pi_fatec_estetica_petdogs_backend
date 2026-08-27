import type { NextFunction, Response } from "express";
import authService from "../services/auth.service.js";
import type { AuthenticatedRequest } from "./request.types.js";

export async function ensureAuthenticated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de autenticação não informado" });
  }

  try {
    const token = authorization.replace("Bearer ", "");
    req.user = await authService.verifyToken(token);

    next();
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token inválido";
    return res.status(401).json({ message });
  }
}
