import authService from "./auth.service.js";
import Cliente from "../models/cliente.model.js";
import Profissional from "../models/profissional.model.js";
import Animal from "../models/animal.model.js";
import Agendamento from "../models/agendamento.model.js";

import type { ICreateClienteDTO, IUpdateClienteDTO } from "../models/cliente.types.js";

import { env } from "../config/env.js";
import { notFound, conflict } from "../errors/app-error.js";
import { assertEmail, assertObjectId } from "../utils/validation.js";
import { validateStoredImagePath } from "./upload.service.js";

class ClienteService {
  async create(data: ICreateClienteDTO) {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const senha = data.senha;

    if (!name || !email || !senha) {
      throw new Error("Nome, e-mail e senha são obrigatórios");
    }

    authService.assertPassword(senha);
    assertEmail(email);

    const emailExists =
      email === env("ADMIN_EMAIL").toLowerCase() ||
      !!(await Profissional.exists({ email })) ||
      !!(await Cliente.exists({ email }));

    if (emailExists) {
      throw conflict("E-mail já cadastrado");
    }

    const payload: Record<string, string> = {
      name,
      email,
      senha: await authService.hashPassword(senha),
      role: "cliente",
    };

    if (data.telefone?.trim()) {
      payload.telefone = data.telefone.trim();
    }

    if (data.foto?.trim()) {
      payload.foto = validateStoredImagePath(data.foto);
    }

    return Cliente.create(payload);
  }

  async getAll() {
    return Cliente.find({ ative: true }).sort({ name: 1 });
  }

  async getById(id: string) {
    assertObjectId(id, "Cliente");

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      throw notFound("Cliente não encontrado");
    }

    return cliente;
  }

  async update(id: string, data: IUpdateClienteDTO) {
    assertObjectId(id, "Cliente");

    const payload: IUpdateClienteDTO = {};

    if (data.name !== undefined) {
      payload.name = data.name.trim();
    }

    if (data.email !== undefined) {
      const email = data.email.trim().toLowerCase();

      assertEmail(email);

      const emailExists =
        email === env("ADMIN_EMAIL").toLowerCase() ||
        !!(await Profissional.exists({ email })) ||
        !!(await Cliente.exists({
          email,
          _id: { $ne: id },
        }));

      if (emailExists) {
        throw conflict("E-mail já cadastrado");
      }

      payload.email = email;
    }

    if (data.telefone !== undefined) {
      payload.telefone = data.telefone.trim();
    }

    if (data.foto !== undefined) {
      payload.foto = data.foto.trim() ? validateStoredImagePath(data.foto) : "";
    }

    if (data.senha?.trim()) {
      authService.assertPassword(data.senha);
      payload.senha = await authService.hashPassword(data.senha);
    }

    if (data.ative !== undefined) {
      payload.ative = data.ative;
    }

    const cliente = await Cliente.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!cliente) {
      throw notFound("Cliente não encontrado");
    }

    return cliente;
  }

  async delete(id: string) {
    assertObjectId(id, "Cliente");

    const hasAnimal = await Animal.exists({ cliente: id });
    const hasAgendamento = await Agendamento.exists({ cliente: id });

    if (hasAnimal || hasAgendamento) {
      throw conflict("Cliente possui pets ou agendamentos e não pode ser removido");
    }

    const cliente = await Cliente.findByIdAndDelete(id);

    if (!cliente) {
      throw notFound("Cliente não encontrado");
    }

    return cliente;
  }
}

export default new ClienteService();
