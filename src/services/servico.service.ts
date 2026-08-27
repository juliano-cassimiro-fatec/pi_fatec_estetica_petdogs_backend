import Servico from "../models/servico.model.js";
import type { ICreateServicoDTO, IUpdateServicoDTO } from "../models/servico.types.js";
import { notFound, badRequest, conflict } from "../errors/app-error.js";
import { assertObjectId } from "../utils/validation.js";
import Agendamento from "../models/agendamento.model.js";

class ServicoService {
  private validate(data: ICreateServicoDTO): void {
    if (!data.name?.trim()) {
      throw new Error("Nome do serviço é obrigatório");
    }

    if (!data.descricao?.trim()) {
      throw new Error("Descrição do serviço é obrigatória");
    }

    if (!Number.isFinite(Number(data.duracao_min)) || Number(data.duracao_min) <= 0) {
      throw new Error("Duração inválida");
    }

    if (!Number.isFinite(Number(data.preco)) || Number(data.preco) < 0) {
      throw new Error("Preço inválido");
    }
  }

  public async create(data: ICreateServicoDTO) {
    this.validate(data);

    return Servico.create({
      name: data.name.trim(),
      descricao: data.descricao.trim(),
      duracao_min: Number(data.duracao_min),
      preco: Number(data.preco),
    });
  }

  public async findAll() {
    return Servico.find().sort({ name: 1 });
  }

  public async findById(id: string) {
    assertObjectId(id);
    const servico = await Servico.findById(id);
    if (!servico) throw notFound("Serviço não encontrado");
    return servico;
  }

  public async delete(id: string) {
    assertObjectId(id);
    if (await Agendamento.exists({ servico: id }))
      throw conflict("Serviço possui agendamentos e não pode ser removido");
    const servico = await Servico.findByIdAndDelete(id);
    if (!servico) throw notFound("Serviço não encontrado");
    return servico;
  }

  public async update(id: string, data: IUpdateServicoDTO) {
    assertObjectId(id);
    const payload: IUpdateServicoDTO = {};

    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.descricao !== undefined) payload.descricao = data.descricao.trim();
    if (data.duracao_min !== undefined) {
      if (!Number.isFinite(Number(data.duracao_min)) || Number(data.duracao_min) <= 0)
        throw badRequest("Duração inválida");
      payload.duracao_min = Number(data.duracao_min);
    }
    if (data.preco !== undefined) {
      if (!Number.isFinite(Number(data.preco)) || Number(data.preco) < 0)
        throw badRequest("Preço inválido");
      payload.preco = Number(data.preco);
    }

    const servico = await Servico.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!servico) throw notFound("Serviço não encontrado");
    return servico;
  }
}

export default new ServicoService();
