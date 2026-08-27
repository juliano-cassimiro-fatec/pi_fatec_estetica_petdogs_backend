import authService from "./auth.service.js";
import Cliente from "../models/cliente.model.js";
import type { ICreateClienteDTO, IUpdateClienteDTO } from "../models/cliente.types.js";
import Profissional from "../models/profissional.model.js";
import { env } from "../config/env.js";
import { notFound, conflict } from "../errors/app-error.js";
import { assertEmail, assertObjectId } from "../utils/validation.js";
import Animal from "../models/animal.model.js";
import Agendamento from "../models/agendamento.model.js";
import { storeImageInput } from "./upload.service.js";

class ClienteService {
  async create(data: ICreateClienteDTO) {
    if (!data.name.trim() || !data.email.trim() || !data.senha.trim()) {
      throw new Error("Nome, e-mail e senha são obrigatórios");
    }

    authService.assertPassword(data.senha);
    assertEmail(data.email.trim());
    if (
      data.email.trim().toLowerCase() === env("ADMIN_EMAIL").toLowerCase() ||
      (await Profissional.exists({ email: data.email.trim().toLowerCase() }))
    )
      throw conflict("E-mail já cadastrado");

    const payload: Record<string, string> = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      senha: await authService.hashPassword(data.senha),
      role: "cliente",
    };

    if (data.telefone?.trim()) payload.telefone = data.telefone.trim();
    if (data.foto?.trim()) payload.foto = await storeImageInput(data.foto);

    return Cliente.create(payload);
  }

  async getAll() {
    return Cliente.find().sort({ name: 1 });
  }

  async getById(id: string) {
    assertObjectId(id);
    const cliente = await Cliente.findById(id);
    if (!cliente) throw notFound("Cliente não encontrado");
    return cliente;
  }

  async update(id: string, data: IUpdateClienteDTO) {
    assertObjectId(id);
    const payload: IUpdateClienteDTO = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.email !== undefined) {
      assertEmail(data.email.trim());
      const email = data.email.trim().toLowerCase();
      if (email === env("ADMIN_EMAIL").toLowerCase() || (await Profissional.exists({ email })))
        throw conflict("E-mail já cadastrado");
      payload.email = email;
    }
    if (data.telefone !== undefined) payload.telefone = data.telefone.trim();
    if (data.foto?.trim()) payload.foto = await storeImageInput(data.foto);
    if (data.senha?.trim()) {
      authService.assertPassword(data.senha);
      payload.senha = await authService.hashPassword(data.senha);
    }

    const cliente = await Cliente.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!cliente) throw notFound("Cliente não encontrado");
    return cliente;
  }

  async delete(id: string) {
    assertObjectId(id);
    if ((await Animal.exists({ cliente: id })) || (await Agendamento.exists({ cliente: id })))
      throw conflict("Cliente possui pets ou agendamentos e não pode ser removido");
    const cliente = await Cliente.findByIdAndDelete(id);
    if (!cliente) throw notFound("Cliente não encontrado");
    return cliente;
  }
}

export default new ClienteService();
