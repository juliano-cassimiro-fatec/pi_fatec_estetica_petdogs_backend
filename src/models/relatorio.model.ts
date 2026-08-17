import mongoose, { Schema } from "mongoose"
import type { IRelatorio } from "./relatorio.types.js"

const relatorioSchema = new Schema<IRelatorio>(
    {
        total_clientes: {
            type: Number,
            required: true,
        },
        total_animais: {
            type: Number,
            required: true,
        },
        total_servicos: {
            type: Number,
            required: true,
        },
        total_cancelamentos: {
            type: Number,
            required: true,
        },
        total_faltas: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
)

const Relatorio = mongoose.model<IRelatorio>("Relatorio", relatorioSchema)

export default Relatorio