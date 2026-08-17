export interface IProfissional {
    name: string
    email: string
    senha: string
    telefone?: string
    foto?: string
    role: "profissional"
    especialidade: string
    dias_trabalho: number[]
    horario_inicio: string
    horario_fim: string
    almoco_inicio?: string
    almoco_fim?: string
    disponibilidade_inicio?: Date
    disponibilidade_fim?: Date
    createdAt: string
    updatedAt?: string
}

export interface ICreateProfissionaleDTO {
    name: string
    email: string
    senha: string
    telefone?: string
    foto?: string
    especialidade: string
    dias_trabalho?: number[] | string
    horario_inicio?: string
    horario_fim?: string
    almoco_inicio?: string
    almoco_fim?: string
    disponibilidade_inicio?: Date | string
    disponibilidade_fim?: Date | string
}

export interface IUpdateProfissionalDTO {
    name?: string
    email?: string
    senha?: string
    telefone?: string
    foto?: string
    especialidade?: string
    dias_trabalho?: number[] | string
    horario_inicio?: string
    horario_fim?: string
    almoco_inicio?: string
    almoco_fim?: string
    disponibilidade_inicio?: Date | string
    disponibilidade_fim?: Date | string
}
