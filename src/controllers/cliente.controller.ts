import type { Response } from "express";
import clienteService from "../services/cliente.service.js";
import type { AuthenticatedRequest } from "../middlewares/request.types.js";
import type { ICreateClienteDTO, IUpdateClienteDTO } from "../models/cliente.types.js";

class ClienteController {
  async create(this: void, req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { name, email, telefone, foto, senha, password } = req.body;
    const cliente = await clienteService.create({
      name: name ?? "",
      email: email ?? "",
      telefone,
      foto,
      senha: senha ?? password ?? "",
    } as ICreateClienteDTO);

    return res.status(201).json(cliente);
  }

  async getAll(this: void, _req: AuthenticatedRequest, res: Response) {
    const clientes = await clienteService.getAll();
    return res.status(200).json(clientes);
  }

  async getById(this: void, req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id ?? "");
    const cliente = await clienteService.getById(id);
    return res.status(200).json(cliente);
  }

  async getMe(this: void, req: AuthenticatedRequest, res: Response) {
    const cliente = await clienteService.getById(req.user?.id ?? "");
    return res.status(200).json(cliente);
  }

  async update(this: void, req: AuthenticatedRequest, res: Response) {
    const id = req.targetId ?? "";
    const { name, email, telefone, foto, senha, password } = req.body;
    const cliente = await clienteService.update(id, {
      name,
      email,
      telefone,
      foto,
      senha: senha ?? password,
    } as IUpdateClienteDTO);

    return res.status(200).json(cliente);
  }

  async delete(this: void, req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id ?? "");
    const cliente = await clienteService.delete(id);
    return res.status(200).json(cliente);
  }
}

export default new ClienteController();
