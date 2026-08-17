import type { Types } from "mongoose"

export type AgendamentoStatus = "scheduled" | "canceled"

export interface IAgendamento {
    data_hora: Date
    status: AgendamentoStatus
    cliente: Types.ObjectId | string
    animal: Types.ObjectId | string
    servico: Types.ObjectId | string
    profissional: Types.ObjectId | string
    createdAt: string
    updatedAt?: string
}

export interface ICreateAgendamentoDTO {
    data_hora: Date | string
    cliente: string
    animal: string
    servico: string
    profissional: string
}

export interface IAvailabilityQuery {
    profissionalId: string
    servicoId: string
    date: string
}

export interface IUpdateAgendamentoDTO {
    data_hora?: Date | string
    status?: AgendamentoStatus
}
