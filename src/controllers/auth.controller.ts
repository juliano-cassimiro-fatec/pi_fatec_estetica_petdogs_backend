import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/request.types.js";
import Cliente from "../models/cliente.model.js";
import Profissional from "../models/profissional.model.js";
import authService from "../services/auth.service.js";

class AuthController {
  public async me(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    if (req.user.role === "admin") {
      return res.status(200).json({ user: { ...req.user, foto: undefined } });
    }

    if (req.user.role === "profissional") {
      const profissional = await Profissional.findById(req.user.id).select(
        "name email foto role especialidade dias_trabalho horario_inicio horario_fim almoco_inicio almoco_fim disponibilidade_inicio disponibilidade_fim telefone",
      );

      return res.status(200).json({
        user: profissional
          ? {
              id: profissional.id,
              name: profissional.name,
              email: profissional.email,
              foto: profissional.foto,
              role: "profissional" as const,
            }
          : req.user,
      });
    }

    const cliente = await Cliente.findById(req.user.id).select("name email foto role");

    return res.status(200).json({
      user: cliente
        ? {
            id: cliente.id,
            name: cliente.name,
            email: cliente.email,
            foto: cliente.foto,
            role: "cliente" as const,
          }
        : req.user,
    });
  }

  public async register(req: Request, res: Response): Promise<Response> {
    const { name, email, password, telefone, foto } = req.body ?? {};
    const result = await authService.register({ name, email, password, telefone, foto });

    return res.status(201).json(result);
  }

  public async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body ?? {};
    const result = await authService.login({ email, password });

    return res.status(200).json(result);
  }

  public async forgotPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body ?? {};
    const result = await authService.forgotPassword({ email });

    return res.status(200).json(result);
  }

  public async resetPassword(req: Request, res: Response): Promise<Response> {
    const { token, password } = req.body ?? {};
    const result = await authService.resetPassword({ token, password });

    return res.status(200).json(result);
  }
}

export default new AuthController();
