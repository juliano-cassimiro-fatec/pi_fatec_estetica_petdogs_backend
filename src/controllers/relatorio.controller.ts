import type { Request, Response } from "express";
import relatorioService from "../services/relatorio.service.js";

class RelatorioController {
  async getAll(this: void, _req: Request, res: Response): Promise<Response> {
    return res.status(200).json(await relatorioService.getAll());
  }
}

export default new RelatorioController();
