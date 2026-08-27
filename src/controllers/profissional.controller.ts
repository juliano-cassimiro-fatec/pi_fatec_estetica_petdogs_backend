import type { Response } from "express";
import profissionalService from "../services/profissional.service.js";
import type { AuthenticatedRequest } from "../middlewares/request.types.js";

class ProfissionalController {
  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const {
      name,
      email,
      senha,
      password,
      telefone,
      foto,
      especialidade,
      dias_trabalho,
      horario_inicio,
      horario_fim,
      almoco_inicio,
      almoco_fim,
      disponibilidade_inicio,
      disponibilidade_fim,
    } = req.body ?? {};
    const profissional = await profissionalService.create({
      name,
      email,
      senha: senha ?? password,
      telefone,
      foto,
      especialidade,
      dias_trabalho,
      horario_inicio,
      horario_fim,
      almoco_inicio,
      almoco_fim,
      disponibilidade_inicio,
      disponibilidade_fim,
    });

    return res.status(201).json(profissional);
  }

  async getAll(_req: AuthenticatedRequest, res: Response) {
    const profissional = await profissionalService.getAll();

    return res.status(200).json(profissional);
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id ?? "");
    const profissional = await profissionalService.getById(id);

    return res.status(200).json(profissional);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const id = req.targetId ?? "";
    const {
      name,
      email,
      senha,
      password,
      telefone,
      foto,
      especialidade,
      dias_trabalho,
      horario_inicio,
      horario_fim,
      almoco_inicio,
      almoco_fim,
      disponibilidade_inicio,
      disponibilidade_fim,
    } = req.body ?? {};
    const profissional = await profissionalService.update(id, {
      name,
      email,
      senha: senha ?? password,
      telefone,
      foto,
      especialidade,
      dias_trabalho,
      horario_inicio,
      horario_fim,
      almoco_inicio,
      almoco_fim,
      disponibilidade_inicio,
      disponibilidade_fim,
    });

    return res.status(200).json(profissional);
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id ?? "");
    const profissional = await profissionalService.delete(id);

    return res.status(200).json(profissional);
  }
}

export default new ProfissionalController();
