export interface IServico {
  name: string;
  descricao: string;
  duracao_min: number;
  preco: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateServicoDTO {
  name: string;
  descricao: string;
  duracao_min: number;
  preco: number;
}

export interface IUpdateServicoDTO {
  name?: string;
  descricao?: string;
  duracao_min?: number;
  preco?: number;
}
