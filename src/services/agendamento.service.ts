import Agendamento from "../models/agendamento.model.js"
import Animal from "../models/animal.model.js"
import Profissional from "../models/profissional.model.js"
import Servico from "../models/servico.model.js"
import type { UserRole } from "../models/auth.types.js"
import type { IAvailabilityQuery, ICreateAgendamentoDTO } from "../models/agendamento.types.js"

const SLOT_STEP_MINUTES = 15
const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]
const DEFAULT_WORKING_START = "08:00"
const DEFAULT_WORKING_END = "18:00"

interface TimeInterval {
    start: number
    end: number
}

class AgendamentoService {
    private parseDate(value: Date | string): Date {
        const date = new Date(value)

        if (Number.isNaN(date.getTime())) {
            throw new Error("Data e hora inválidas")
        }

        return date
    }

    private parseTime(value?: string, fallback = DEFAULT_WORKING_START): string {
        if (!value) return fallback
        if (/^\d{2}:\d{2}$/.test(value.trim())) return value.trim()

        const date = new Date(value)
        if (!Number.isNaN(date.getTime())) {
            return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
        }

        return fallback
    }

    private toMinutes(value: string): number {
        const [hours = 0, minutes = 0] = value.split(":").map(Number)
        return (hours * 60) + minutes
    }

    private fromMinutes(date: Date, minutes: number): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes, 0, 0)
    }

    private getWorkingDays(profissional: { dias_trabalho?: number[] }) {
        return profissional.dias_trabalho?.length ? profissional.dias_trabalho : DEFAULT_WORKING_DAYS
    }

    private getWorkingWindow(profissional: { horario_inicio?: string; horario_fim?: string }) {
        return {
            start: this.parseTime(profissional.horario_inicio, DEFAULT_WORKING_START),
            end: this.parseTime(profissional.horario_fim, DEFAULT_WORKING_END),
        }
    }

    private getLunchWindow(profissional: { almoco_inicio?: string; almoco_fim?: string }) {
        if (!profissional.almoco_inicio || !profissional.almoco_fim) return null

        const start = this.parseTime(profissional.almoco_inicio, "")
        const end = this.parseTime(profissional.almoco_fim, "")

        if (!start || !end || this.toMinutes(start) >= this.toMinutes(end)) {
            return null
        }

        return { start, end }
    }

    private overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
        return startA < endB && endA > startB
    }

    private getDayBounds(date: Date) {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(date)
        end.setHours(23, 59, 59, 999)
        return { start, end }
    }

    private toInterval(startDate: Date, durationMinutes: number): TimeInterval {
        return {
            start: startDate.getHours() * 60 + startDate.getMinutes(),
            end: startDate.getHours() * 60 + startDate.getMinutes() + durationMinutes,
        }
    }

    private mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
        if (intervals.length === 0) return []

        const sorted = [...intervals].sort((left, right) => left.start - right.start)
        const first = sorted[0]!
        if (!first) return []

        const merged: TimeInterval[] = [{ ...first }]

        for (let index = 1; index < sorted.length; index += 1) {
            const current = sorted[index]!

            const previous = merged[merged.length - 1]!

            if (current.start <= previous.end) {
                previous.end = Math.max(previous.end, current.end)
                continue
            }

            merged.push({ ...current })
        }

        return merged
    }

    private subtractIntervals(workingWindow: TimeInterval, blockedIntervals: TimeInterval[]) {
        const mergedBlocks = this.mergeIntervals(blockedIntervals)
        const freeIntervals: TimeInterval[] = []
        let cursor = workingWindow.start

        for (const blocked of mergedBlocks) {
            if (blocked.end <= cursor) continue
            if (blocked.start > cursor) {
                freeIntervals.push({ start: cursor, end: Math.min(blocked.start, workingWindow.end) })
            }
            cursor = Math.max(cursor, blocked.end)
            if (cursor >= workingWindow.end) break
        }

        if (cursor < workingWindow.end) {
            freeIntervals.push({ start: cursor, end: workingWindow.end })
        }

        return freeIntervals.filter((interval) => interval.end > interval.start)
    }

    private getLunchInterval(profissional: { almoco_inicio?: string; almoco_fim?: string }) {
        const lunch = this.getLunchWindow(profissional)
        if (!lunch) return null

        return {
            start: this.toMinutes(lunch.start),
            end: this.toMinutes(lunch.end),
        }
    }

    private async getBlockedIntervals(profissionalId: string, date: Date, durationMinutes: number, excludeId?: string) {
        const profissional = await Profissional.findById(profissionalId)
        if (!profissional) throw new Error("Profissional não encontrado")

        const conflicts = await this.getScheduleConflicts(profissionalId, date, excludeId)

        const blockedIntervals = conflicts.map((item) => {
            const itemStart = new Date(item.data_hora)
            const itemDuration = (item.servico as { duracao_min?: number } | null | undefined)?.duracao_min ?? durationMinutes
            return this.toInterval(itemStart, itemDuration)
        })

        const lunch = this.getLunchInterval(profissional)
        if (lunch) {
            blockedIntervals.push(lunch)
        }

        return {
            professional: profissional,
            blockedIntervals,
        }
    }

    private getAvailableStarts(date: Date, workingWindow: TimeInterval, blockedIntervals: TimeInterval[], durationMinutes: number) {
        const freeIntervals = this.subtractIntervals(workingWindow, blockedIntervals)
        const slotStarts: Date[] = []

        for (const interval of freeIntervals) {
            const firstAlignedStart = Math.ceil(interval.start / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES
            for (let minute = firstAlignedStart; minute + durationMinutes <= interval.end; minute += SLOT_STEP_MINUTES) {
                const slot = new Date(date)
                slot.setHours(0, minute, 0, 0)
                slotStarts.push(slot)
            }
        }

        return slotStarts
    }

    private async getScheduleConflicts(profissionalId: string, date: Date, excludeId?: string) {
        const { start, end } = this.getDayBounds(date)
        const filter: Record<string, unknown> = {
            profissional: profissionalId,
            status: "scheduled",
            data_hora: { $gte: start, $lte: end },
        }

        if (excludeId) {
            filter._id = { $ne: excludeId }
        }

        return await Agendamento.find(filter).populate("servico", "duracao_min")
    }

    private async validateAvailability(profissionalId: string, servicoId: string, dataHora: Date, excludeId?: string) {
        const servico = await Servico.findById(servicoId)
        if (!servico) throw new Error("Serviço não encontrado")

        const profissional = await Profissional.findById(profissionalId)
        if (!profissional) throw new Error("Profissional não encontrado")

        const workingDays = this.getWorkingDays(profissional)
        if (!workingDays.includes(dataHora.getDay())) {
            throw new Error("Profissional não trabalha neste dia da semana")
        }

        const window = this.getWorkingWindow(profissional)
        const selectedStartMinutes = dataHora.getHours() * 60 + dataHora.getMinutes()
        const selectedEndMinutes = selectedStartMinutes + servico.duracao_min
        const windowStartMinutes = this.toMinutes(window.start)
        const windowEndMinutes = this.toMinutes(window.end)

        if (selectedStartMinutes < windowStartMinutes || selectedEndMinutes > windowEndMinutes) {
            throw new Error("Horário fora da jornada de trabalho do profissional")
        }

        const { blockedIntervals } = await this.getBlockedIntervals(profissionalId, dataHora, servico.duracao_min, excludeId)
        const targetInterval = this.toInterval(dataHora, servico.duracao_min)

        const hasConflict = blockedIntervals.some((blocked) => this.overlaps(
            this.fromMinutes(dataHora, targetInterval.start),
            this.fromMinutes(dataHora, targetInterval.end),
            this.fromMinutes(dataHora, blocked.start),
            this.fromMinutes(dataHora, blocked.end)
        ))

        if (hasConflict) {
            throw new Error("Horário indisponível para este profissional")
        }

        return { servico, profissional, window }
    }

    public async create(data: ICreateAgendamentoDTO) {
        if (!data.animal || !data.servico || !data.profissional || !data.data_hora || !data.cliente) {
            throw new Error("Pet, serviço, profissional, data e hora são obrigatórios")
        }

        const dataHora = this.parseDate(data.data_hora)

        const animal = await Animal.findOne({ _id: data.animal, cliente: data.cliente })

        if (!animal) {
            throw new Error("Pet não encontrado para o usuário autenticado")
        }

        await this.validateAvailability(data.profissional, data.servico, dataHora)

        return await Agendamento.create({
            data_hora: dataHora,
            status: "scheduled",
            cliente: data.cliente,
            animal: data.animal,
            servico: data.servico,
            profissional: data.profissional,
        })
    }

    public async update(id: string, data: Partial<ICreateAgendamentoDTO> & { status?: "scheduled" | "canceled" }, user: { id: string; role: UserRole }) {
        const existing = await Agendamento.findById(id)
        if (!existing) {
            throw new Error("Agendamento não encontrado")
        }

        const canManage = user.role === "admin" || String(existing.cliente) === user.id || String(existing.profissional) === user.id
        if (!canManage) {
            throw new Error("Você não tem permissão para editar este agendamento")
        }

        const nextProfessional = data.profissional ?? String(existing.profissional)
        const nextService = data.servico ?? String(existing.servico)
        const nextDateTime = data.data_hora ? this.parseDate(data.data_hora) : new Date(existing.data_hora)

        await this.validateAvailability(nextProfessional, nextService, nextDateTime, id)

        const nextStatus = data.status ?? existing.status
        const nextAnimal = data.animal ?? String(existing.animal)

        return await Agendamento.findByIdAndUpdate(
            id,
            {
                data_hora: nextDateTime,
                status: nextStatus,
                animal: nextAnimal,
                servico: nextService,
                profissional: nextProfessional,
            },
            { new: true }
        )
    }

    public async getAvailability(query: IAvailabilityQuery) {
        if (!query.profissionalId || !query.servicoId || !query.date) {
            throw new Error("Profissional, serviço e data são obrigatórios")
        }

        const date = this.parseDate(query.date)
        const servico = await Servico.findById(query.servicoId)
        if (!servico) throw new Error("Serviço não encontrado")

        const profissional = await Profissional.findById(query.profissionalId)
        if (!profissional) throw new Error("Profissional não encontrado")

        const workingDays = this.getWorkingDays(profissional)
        const window = this.getWorkingWindow(profissional)

        if (!workingDays.includes(date.getDay())) {
            return {
                date: query.date,
                available: false,
                slots: [],
                workingDays,
                window,
                duration_min: servico.duracao_min,
            }
        }

        const dayBounds = this.getDayBounds(date)
        const startMinutes = this.toMinutes(window.start)
        const endMinutes = this.toMinutes(window.end)
        const dayWindow = { start: startMinutes, end: endMinutes }
        const { blockedIntervals } = await this.getBlockedIntervals(profissional.id, date, servico.duracao_min)
        const availableStarts = this.getAvailableStarts(date, dayWindow, blockedIntervals, servico.duracao_min)

        const slots: Array<{ time: string; datetime: string; available: boolean }> = availableStarts.map((slotStart) => ({
            time: `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`,
            datetime: slotStart.toISOString(),
            available: slotStart >= dayBounds.start && new Date(slotStart.getTime() + (servico.duracao_min * 60000)) <= dayBounds.end,
        }))

        const fullSlots: Array<{ time: string; datetime: string; available: boolean }> = []

        for (let minutes = startMinutes; minutes <= endMinutes - servico.duracao_min; minutes += SLOT_STEP_MINUTES) {
            const slotStart = this.fromMinutes(date, minutes)
            slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + (servico.duracao_min * 60000))
            const available = slots.some((slot) => slot.datetime === slotStart.toISOString()) && slotStart >= dayBounds.start && slotEnd <= dayBounds.end

            fullSlots.push({
                time: `${String(slotStart.getHours()).padStart(2, "0")}:${String(slotStart.getMinutes()).padStart(2, "0")}`,
                datetime: slotStart.toISOString(),
                available,
            })
        }

        return {
            date: query.date,
            available: fullSlots.some((slot) => slot.available),
            slots: fullSlots,
            workingDays,
            window,
            duration_min: servico.duracao_min,
        }
    }

    public async getMonthlyAvailability(query: { profissionalId: string; servicoId: string; month: string }) {
        if (!query.profissionalId || !query.servicoId || !query.month) {
            throw new Error("Profissional, serviço e mês são obrigatórios")
        }

        const [year, month] = query.month.split("-").map(Number)
        if (!year || !month) throw new Error("Mês inválido")

        const lastDay = new Date(year, month, 0).getDate()
        const days = [] as Array<{ date: string; available: boolean; slotsCount: number; workingDay: boolean }>

        for (let day = 1; day <= lastDay; day += 1) {
            const currentDate = new Date(year, month - 1, day)
            const availability = await this.getAvailability({
                profissionalId: query.profissionalId,
                servicoId: query.servicoId,
                date: currentDate.toISOString(),
            })

            days.push({
                date: currentDate.toISOString().slice(0, 10),
                available: availability.available,
                slotsCount: availability.slots.filter((slot) => slot.available).length,
                workingDay: availability.workingDays.includes(currentDate.getDay()),
            })
        }

        return {
            month: query.month,
            days,
        }
    }

    public async getAll(user: { id: string; role: UserRole }) {
        const filter = user.role === "admin" ? {} : user.role === "profissional" ? { profissional: user.id } : { cliente: user.id }

        return await Agendamento.find(filter)
            .populate("cliente", "name email telefone foto")
            .populate("animal")
            .populate("servico")
            .populate("profissional", "name email especialidade telefone foto")
            .sort({ data_hora: 1 })
    }

    public async cancel(id: string, user: { id: string; role: UserRole }) {
        const filter = user.role === "admin" ? { _id: id, status: "scheduled" } : { _id: id, cliente: user.id, status: "scheduled" }
        const agendamento = await Agendamento.findOneAndUpdate(filter, { status: "canceled" }, { new: true })

        if (!agendamento) {
            throw new Error("Agendamento não encontrado")
        }

        return agendamento
    }
}

export default new AgendamentoService()
