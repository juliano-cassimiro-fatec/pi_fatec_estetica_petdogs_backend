import type { Request, Response } from "express";
import Cliente from "../models/cliente.model.js";
import Profissional from "../models/profissional.model.js";

class AdminController {
  public async listUsers(this: void, _req: Request, res: Response): Promise<Response> {
    const [clientes, profissionais] = await Promise.all([
      Cliente.find({ ative: true }).select("name email foto role createdAt").sort({ name: 1 }),
      Profissional.find().select("name email foto role especialidade createdAt").sort({ name: 1 }),
    ]);
    return res.status(200).json({ clientes, profissionais });
  }
}

export default new AdminController();
