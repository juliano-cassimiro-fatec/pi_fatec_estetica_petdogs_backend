import type { Response } from "express";
import type { ApiRequest } from "../middlewares/request.types.js";
import type { IUpdateServicoDTO } from "../models/servico.types.js";
import servicoService from "../services/servico.service.js";

class ServicoController {
  public async create(this: void, request: ApiRequest, response: Response): Promise<Response> {
    const { name, descricao, duracao_min, preco } = request.body;
    const servico = await servicoService.create({
      name: name ?? "",
      descricao: descricao ?? "",
      duracao_min: duracao_min ?? Number.NaN,
      preco: preco ?? Number.NaN,
    });

    return response.status(201).json(servico);
  }

  public async findAll(this: void, _request: ApiRequest, response: Response): Promise<Response> {
    const servicos = await servicoService.findAll();

    return response.status(200).json(servicos);
  }

  public async delete(this: void, request: ApiRequest, response: Response): Promise<Response> {
    const id = String(request.params.id ?? "");
    await servicoService.delete(id);

    return response.status(200).json({ message: "Serviço removido com sucesso" });
  }

  public async findById(this: void, request: ApiRequest, response: Response): Promise<Response> {
    const id = String(request.params.id ?? "");
    const servico = await servicoService.findById(id);

    return response.status(200).json(servico);
  }

  public async update(this: void, request: ApiRequest, response: Response): Promise<Response> {
    const id = String(request.params.id ?? "");
    const { name, descricao, duracao_min, preco } = request.body;
    const servico = await servicoService.update(id, {
      name,
      descricao,
      duracao_min,
      preco,
    } as IUpdateServicoDTO);

    return response.status(200).json(servico);
  }
}

export default new ServicoController();
