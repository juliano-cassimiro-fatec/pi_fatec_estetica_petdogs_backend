import mongoose, { Schema } from "mongoose"
import type { IServico } from "./servico.types.js"

const servicoSchema = new Schema<IServico>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        descricao: {
            type: String,
            required: true,
            trim: true,
        },
        duracao_min: {
            type: Number,
            required: true,
            min: 1,
        },
        preco: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { timestamps: true }
)

const Servico = mongoose.model<IServico>("Servico", servicoSchema)

export default Servico
