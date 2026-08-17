import mongoose, { Schema } from "mongoose"
import type { IAgendamento } from "./agendamento.types.js"

const agendamentoSchema = new Schema<IAgendamento>(
    {
        data_hora: {
            type: Date,
            required: true,
            index: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["scheduled", "canceled"],
            default: "scheduled",
        },
        cliente: {
            type: Schema.Types.ObjectId,
            ref: "Cliente",
            required: true,
            index: true,
        },
        animal: {
            type: Schema.Types.ObjectId,
            ref: "Animal",
            required: true,
        },
        servico: {
            type: Schema.Types.ObjectId,
            ref: "Servico",
            required: true,
        },
        profissional: {
            type: Schema.Types.ObjectId,
            ref: "Profissional",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
)

const Agendamento = mongoose.model<IAgendamento>("Agendamento", agendamentoSchema)

export default Agendamento
