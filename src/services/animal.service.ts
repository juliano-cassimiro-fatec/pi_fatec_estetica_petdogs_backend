import Animal from "../models/animal.model.js";
import type { UserRole } from "../models/auth.types.js";
import type { ICreateAnimalDTO, IUpdateAnimalDTO } from "../models/animal.types.js";
import { assertObjectId } from "../utils/validation.js";
import Agendamento from "../models/agendamento.model.js";
import { conflict } from "../errors/app-error.js";
import { storeImageInput } from "./upload.service.js";

class AnimalService {
  private validateCreate(data: ICreateAnimalDTO): void {
    if (!data.nome?.trim() || !data.raca?.trim() || !data.porte?.trim() || !data.cliente) {
      throw new Error("Nome, raça, porte e tutor são obrigatórios");
    }

    if (!Number.isFinite(Number(data.idade)) || Number(data.idade) < 0) {
      throw new Error("Idade inválida");
    }
    if (!["pequeno", "medio", "grande"].includes(data.porte.trim().toLowerCase()))
      throw new Error("Porte inválido");
  }

  private buildScope(user: { id: string; role: UserRole }, id?: string) {
    const scope: Record<string, string> = {};
    if (id) scope._id = id;
    if (user.role !== "admin") scope.cliente = user.id;
    return scope;
  }

  public async create(data: ICreateAnimalDTO) {
    this.validateCreate(data);
    assertObjectId(data.cliente, "Tutor");

    const payload: Record<string, string | number> = {
      nome: data.nome.trim(),
      raca: data.raca.trim(),
      idade: Number(data.idade),
      porte: data.porte.trim().toLowerCase(),
      cliente: data.cliente,
    };

    if (data.foto?.trim()) payload.foto = await storeImageInput(data.foto);

    return Animal.create(payload);
  }

  public async getAll(user: { id: string; role: UserRole }) {
    return Animal.find(this.buildScope(user))
      .populate("cliente", "name email telefone foto")
      .sort({ createdAt: -1 });
  }

  public async getById(id: string, user: { id: string; role: UserRole }) {
    assertObjectId(id, "Pet");
    const animal = await Animal.findOne(this.buildScope(user, id)).populate(
      "cliente",
      "name email telefone foto",
    );

    if (!animal) {
      throw new Error("Pet não encontrado");
    }

    return animal;
  }

  public async update(
    id: string,
    user: { id: string; role: UserRole },
    data: IUpdateAnimalDTO & { cliente?: string },
  ) {
    assertObjectId(id, "Pet");
    const payload: IUpdateAnimalDTO & { cliente?: string } = {};

    if (data.nome !== undefined) payload.nome = data.nome.trim();
    if (data.raca !== undefined) payload.raca = data.raca.trim();
    if (data.porte !== undefined) {
      const porte = data.porte.trim().toLowerCase();
      if (!["pequeno", "medio", "grande"].includes(porte)) throw new Error("Porte inválido");
      payload.porte = porte as NonNullable<IUpdateAnimalDTO["porte"]>;
    }
    if (data.foto?.trim()) payload.foto = await storeImageInput(data.foto);
    if (data.cliente !== undefined && user.role === "admin") payload.cliente = data.cliente;
    if (data.idade !== undefined) {
      if (!Number.isFinite(Number(data.idade)) || Number(data.idade) < 0) {
        throw new Error("Idade inválida");
      }
      payload.idade = Number(data.idade);
    }

    if (payload.cliente) assertObjectId(payload.cliente, "Tutor");
    const animal = await Animal.findOneAndUpdate(this.buildScope(user, id), payload, {
      new: true,
      runValidators: true,
    });

    if (!animal) {
      throw new Error("Pet não encontrado");
    }

    return animal;
  }

  public async delete(id: string, user: { id: string; role: UserRole }) {
    assertObjectId(id, "Pet");
    if (await Agendamento.exists({ animal: id }))
      throw conflict("Pet possui agendamentos e não pode ser removido");
    const animal = await Animal.findOneAndDelete(this.buildScope(user, id));

    if (!animal) {
      throw new Error("Pet não encontrado");
    }

    return animal;
  }
}

export default new AnimalService();
