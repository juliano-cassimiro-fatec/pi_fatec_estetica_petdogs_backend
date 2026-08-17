import authService from "./auth.service.js"
import Cliente from "../models/cliente.model.js"
import Profissional from "../models/profissional.model.js"
import type { ICreateProfissionaleDTO, IUpdateProfissionalDTO } from "../models/profissional.types.js"
import { assertEmail, assertObjectId } from "../utils/validation.js"
import { badRequest, conflict, notFound } from "../errors/app-error.js"
import { env } from "../config/env.js"
import Agendamento from "../models/agendamento.model.js"

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]
const DEFAULT_WORKING_START = "08:00"
const DEFAULT_WORKING_END = "18:00"

class ProfissionalService {
    private parseDate(value: Date | string, field: string): Date {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) throw new Error(`${field} inválida`)
        return date
    }

    private parseDays(value?: number[] | string): number[] {
        if (Array.isArray(value)) {
            const days = value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6)
            return [...new Set(days)]
        }

        if (!value) {
            return DEFAULT_WORKING_DAYS
        }

        return value
            .split(",")
            .map((item) => Number(item.trim()))
            .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6)
    }

    private parseTime(value?: string | Date, fallback = DEFAULT_WORKING_START): string {
        if (!value) return fallback
        if (value instanceof Date) {
            return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
        }

        const normalized = value.trim()
        if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
            return normalized
        }

        const date = new Date(normalized)
        if (!Number.isNaN(date.getTime())) {
            return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
        }

        throw badRequest("Horário inválido")
    }

    private resolveWorkingConfig(data: ICreateProfissionaleDTO | IUpdateProfissionalDTO) {
        return {
            dias_trabalho: this.parseDays(data.dias_trabalho),
            horario_inicio: this.parseTime(data.horario_inicio ?? data.disponibilidade_inicio, DEFAULT_WORKING_START),
            horario_fim: this.parseTime(data.horario_fim ?? data.disponibilidade_fim, DEFAULT_WORKING_END),
            almoco_inicio: data.almoco_inicio ? this.parseTime(data.almoco_inicio, "") : undefined,
            almoco_fim: data.almoco_fim ? this.parseTime(data.almoco_fim, "") : undefined,
        }
    }

    async create(data: ICreateProfissionaleDTO) {
        const name = data.name?.trim()
        const email = data.email?.trim().toLowerCase()
        const senha = data.senha

        if (!name || !email || !senha || !data.especialidade?.trim()) {
            throw new Error("Nome, e-mail, senha e especialidade são obrigatórios")
        }

        authService.assertPassword(senha)
        assertEmail(email)

        const emailInUse = await Profissional.findOne({ email })
        const clientEmailInUse = await Cliente.findOne({ email })

        if (emailInUse || clientEmailInUse || email === env("ADMIN_EMAIL").toLowerCase()) {
            throw new Error("E-mail já cadastrado")
        }

        const payload: Record<string, unknown> = {
            name,
            email,
            senha: await authService.hashPassword(senha),
            role: "profissional",
            especialidade: data.especialidade.trim(),
            disponibilidade_inicio: data.disponibilidade_inicio ? this.parseDate(data.disponibilidade_inicio, "Disponibilidade inicial") : new Date(),
            disponibilidade_fim: data.disponibilidade_fim ? this.parseDate(data.disponibilidade_fim, "Disponibilidade final") : new Date(),
        }

        const workingConfig = this.resolveWorkingConfig(data)
        if (workingConfig.horario_inicio >= workingConfig.horario_fim) throw badRequest("Horário inicial deve ser anterior ao final")
        if ((workingConfig.almoco_inicio && !workingConfig.almoco_fim) || (!workingConfig.almoco_inicio && workingConfig.almoco_fim)) throw badRequest("Intervalo de almoço incompleto")
        payload.dias_trabalho = workingConfig.dias_trabalho
        payload.horario_inicio = workingConfig.horario_inicio
        payload.horario_fim = workingConfig.horario_fim
        if (workingConfig.almoco_inicio) payload.almoco_inicio = workingConfig.almoco_inicio
        if (workingConfig.almoco_fim) payload.almoco_fim = workingConfig.almoco_fim

        if (data.telefone?.trim()) payload.telefone = data.telefone.trim()
        if (data.foto?.trim()) payload.foto = data.foto.trim()

        return Profissional.create(payload)
    }

    async getAll() {
        return Profissional.find().sort({ name: 1 })
    }

    async getById(id: string) {
        assertObjectId(id, "Profissional")
        const profissional = await Profissional.findById(id)
        if (!profissional) throw notFound("Profissional não encontrado")
        return profissional
    }

    async update(id: string, data: IUpdateProfissionalDTO) {
        assertObjectId(id, "Profissional")
        const payload: Record<string, unknown> = {}

        if (data.name !== undefined) payload.name = data.name.trim()
        if (data.email !== undefined) {
            const email = data.email.trim().toLowerCase(); assertEmail(email)
            if (email === env("ADMIN_EMAIL").toLowerCase() || await Cliente.exists({ email })) throw conflict("E-mail já cadastrado")
            payload.email = email
        }
        if (data.telefone !== undefined) payload.telefone = data.telefone.trim()
        if (data.foto !== undefined) payload.foto = data.foto.trim()
        if (data.especialidade !== undefined) payload.especialidade = data.especialidade.trim()
        if (data.dias_trabalho !== undefined) payload.dias_trabalho = this.parseDays(data.dias_trabalho)
        if (data.horario_inicio !== undefined) payload.horario_inicio = this.parseTime(data.horario_inicio, DEFAULT_WORKING_START)
        if (data.horario_fim !== undefined) payload.horario_fim = this.parseTime(data.horario_fim, DEFAULT_WORKING_END)
        if (data.almoco_inicio !== undefined) payload.almoco_inicio = this.parseTime(data.almoco_inicio, "")
        if (data.almoco_fim !== undefined) payload.almoco_fim = this.parseTime(data.almoco_fim, "")
        if (data.disponibilidade_inicio !== undefined) payload.disponibilidade_inicio = this.parseDate(data.disponibilidade_inicio, "Disponibilidade inicial")
        if (data.disponibilidade_fim !== undefined) payload.disponibilidade_fim = this.parseDate(data.disponibilidade_fim, "Disponibilidade final")
        if (data.senha !== undefined && data.senha.trim()) {
            authService.assertPassword(data.senha)
            payload.senha = await authService.hashPassword(data.senha)
        }

        const profissional = await Profissional.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        if (!profissional) throw notFound("Profissional não encontrado")
        return profissional
    }

    async delete(id: string) {
        assertObjectId(id, "Profissional")
        if (await Agendamento.exists({ profissional: id })) throw conflict("Profissional possui agendamentos e não pode ser removido")
        const profissional = await Profissional.findByIdAndDelete(id)
        if (!profissional) throw notFound("Profissional não encontrado")
        return profissional
    }
}

export default new ProfissionalService()
