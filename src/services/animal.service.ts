import Animal from "../models/animal.model.js";
import Agendamento from "../models/agendamento.model.js";

import type { UserRole } from "../models/auth.types.js";
import type { ICreateAnimalDTO, IUpdateAnimalDTO } from "../models/animal.types.js";

import { assertObjectId } from "../utils/validation.js";
import { conflict, notFound } from "../errors/app-error.js";
import { validateStoredImagePath } from "./upload.service.js";

class AnimalService {
  private validateCreate(data: ICreateAnimalDTO) {
    if (!data.nome?.trim() || !data.raca?.trim() || !data.porte?.trim() || !data.cliente) {
      throw new Error("Nome, raça, porte e tutor são obrigatórios");
    }

    if (!Number.isFinite(Number(data.idade)) || Number(data.idade) < 0) {
      throw new Error("Idade inválida");
    }

    if (!["pequeno", "medio", "grande"].includes(data.porte.trim().toLowerCase())) {
      throw new Error("Porte inválido");
    }
  }

  private scope(user: { id: string; role: UserRole }, id?: string) {
    const filter: Record<string, string> = {};

    if (id) filter._id = id;

    if (user.role !== "admin") {
      filter.cliente = user.id;
    }

    return filter;
  }

  async create(data: ICreateAnimalDTO) {
    this.validateCreate(data);
    assertObjectId(data.cliente, "Tutor");

    const payload: Record<string, unknown> = {
      nome: data.nome.trim(),
      raca: data.raca.trim(),
      idade: Number(data.idade),
      porte: data.porte.trim().toLowerCase(),
      cliente: data.cliente,
    };

    if (data.foto?.trim()) {
      payload.foto = validateStoredImagePath(data.foto);
    }

    return Animal.create(payload);
  }

  async getAll(user: { id: string; role: UserRole }) {
    return Animal.find(this.scope(user))
      .populate("cliente", "name email telefone foto")
      .sort({ createdAt: -1 });
  }

  async getById(id: string, user: { id: string; role: UserRole }) {
    assertObjectId(id, "Pet");

    const animal = await Animal.findOne(this.scope(user, id)).populate(
      "cliente",
      "name email telefone foto",
    );

    if (!animal) {
      throw notFound("Pet não encontrado");
    }

    return animal;
  }

  async update(
    id: string,
    user: { id: string; role: UserRole },
    data: IUpdateAnimalDTO & { cliente?: string },
  ) {
    assertObjectId(id, "Pet");

    const payload: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      payload.nome = data.nome.trim();
    }

    if (data.raca !== undefined) {
      payload.raca = data.raca.trim();
    }

    if (data.porte !== undefined) {
      const porte = data.porte.trim().toLowerCase();

      if (!["pequeno", "medio", "grande"].includes(porte)) {
        throw new Error("Porte inválido");
      }

      payload.porte = porte;
    }

    if (data.idade !== undefined) {
      const idade = Number(data.idade);

      if (!Number.isFinite(idade) || idade < 0) {
        throw new Error("Idade inválida");
      }

      payload.idade = idade;
    }

    if (data.foto !== undefined) {
      payload.foto = data.foto.trim() ? validateStoredImagePath(data.foto) : "";
    }

    if (data.cliente !== undefined && user.role === "admin") {
      assertObjectId(data.cliente, "Tutor");
      payload.cliente = data.cliente;
    }

    const animal = await Animal.findOneAndUpdate(this.scope(user, id), payload, {
      new: true,
      runValidators: true,
    });

    if (!animal) {
      throw notFound("Pet não encontrado");
    }

    return animal;
  }

  async delete(id: string, user: { id: string; role: UserRole }) {
    assertObjectId(id, "Pet");

    if (await Agendamento.exists({ animal: id })) {
      throw conflict("Pet possui agendamentos e não pode ser removido");
    }

    const animal = await Animal.findOneAndDelete(this.scope(user, id));

    if (!animal) {
      throw notFound("Pet não encontrado");
    }

    return animal;
  }
}

export default new AnimalService();
