import type { Response } from "express"
import agendamentoService from "../services/agendamento.service.js"
import type { AuthenticatedRequest } from "../middlewares/request.types.js"

class AgendamentoController {
    public async availability(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const profissionalId = String(req.query.profissionalId ?? req.query.profissional ?? "")
            const servicoId = String(req.query.servicoId ?? req.query.servico ?? "")
            const date = String(req.query.date ?? "")

            const availability = await agendamentoService.getAvailability({ profissionalId, servicoId, date })

            return res.status(200).json(availability)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao consultar disponibilidade"
            return res.status(400).json({ message })
        }
    }

    public async availabilityMonth(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const profissionalId = String(req.query.profissionalId ?? req.query.profissional ?? "")
            const servicoId = String(req.query.servicoId ?? req.query.servico ?? "")
            const month = String(req.query.month ?? "")

            const availability = await agendamentoService.getMonthlyAvailability({ profissionalId, servicoId, month })

            return res.status(200).json(availability)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao consultar calendário"
            return res.status(400).json({ message })
        }
    }

    public async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const { data_hora, dateTime, animal, animalId, pet, petId, servico, servicoId, service, serviceId, profissional, profissionalId, professional, professionalId } = req.body ?? {}
            const agendamento = await agendamentoService.create({
                data_hora: data_hora ?? dateTime,
                animal: animal ?? animalId ?? pet ?? petId,
                servico: servico ?? servicoId ?? service ?? serviceId,
                profissional: profissional ?? profissionalId ?? professional ?? professionalId,
                cliente: req.user?.id ?? "",
            })

            return res.status(201).json(agendamento)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao agendar serviço"
            return res.status(400).json({ message })
        }
    }

    public async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const { data_hora, dateTime, animal, animalId, pet, petId, servico, servicoId, service, serviceId, profissional, profissionalId, professional, professionalId, status } = req.body ?? {}
            const agendamento = await agendamentoService.update(String(req.params.id ?? ""), {
                data_hora: data_hora ?? dateTime,
                animal: animal ?? animalId ?? pet ?? petId,
                servico: servico ?? servicoId ?? service ?? serviceId,
                profissional: profissional ?? profissionalId ?? professional ?? professionalId,
                status,
            }, { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

            return res.status(200).json(agendamento)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao atualizar agendamento"
            return res.status(400).json({ message })
        }
    }

    public async getAll(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const agendamentos = await agendamentoService.getAll({ id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

        return res.status(200).json(agendamentos)
    }

    public async cancel(req: AuthenticatedRequest, res: Response): Promise<Response> {
        try {
            const agendamento = await agendamentoService.cancel(String(req.params.id ?? ""), { id: req.user?.id ?? "", role: req.user?.role ?? "cliente" })

            return res.status(200).json(agendamento)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao cancelar agendamento"
            return res.status(400).json({ message })
        }
    }
}

export default new AgendamentoController()
