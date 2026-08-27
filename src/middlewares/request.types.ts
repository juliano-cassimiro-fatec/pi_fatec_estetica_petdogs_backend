import type { Request } from "express";

export interface ApiRequestBody {
  age?: number;
  almoco_fim?: string;
  almoco_inicio?: string;
  animal?: string;
  animalId?: string;
  breed?: string;
  cliente?: string;
  clienteId?: string;
  data_hora?: Date | string;
  dateTime?: Date | string;
  descricao?: string;
  dias_trabalho?: number[] | string;
  disponibilidade_fim?: Date | string;
  disponibilidade_inicio?: Date | string;
  duracao_min?: number;
  email?: string;
  especialidade?: string;
  foto?: string;
  horario_fim?: string;
  horario_inicio?: string;
  idade?: number;
  name?: string;
  nome?: string;
  password?: string;
  pet?: string;
  petId?: string;
  porte?: "pequeno" | "medio" | "grande";
  preco?: number;
  professional?: string;
  professionalId?: string;
  profissional?: string;
  profissionalId?: string;
  raca?: string;
  senha?: string;
  service?: string;
  serviceId?: string;
  servico?: string;
  servicoId?: string;
  size?: "pequeno" | "medio" | "grande";
  status?: string;
  telefone?: string;
  token?: string;
}

export type ApiRequest = Request<
  Record<string, string>,
  unknown,
  ApiRequestBody,
  Record<string, string | undefined>
>;

export interface AuthenticatedRequest extends ApiRequest {
  targetId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    foto?: string;
    role: "admin" | "profissional" | "cliente";
  };
}
