import mongoose, { Schema } from "mongoose"
import type { IProfissional } from "./profissional.types.js"

const profissionalSchema = new Schema<IProfissional>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        senha: {
            type: String,
            required: true,
            trim: true,
            select: false,
        },
        telefone: {
            type: String,
            trim: true,
        },
        foto: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ["profissional"],
            default: "profissional",
            required: true,
        },
        especialidade: {
            type: String,
            required: true,
            trim: true,
        },
        dias_trabalho: {
            type: [Number],
            default: [1, 2, 3, 4, 5],
        },
        horario_inicio: {
            type: String,
            default: "08:00",
            trim: true,
        },
        horario_fim: {
            type: String,
            default: "18:00",
            trim: true,
        },
        almoco_inicio: {
            type: String,
            trim: true,
        },
        almoco_fim: {
            type: String,
            trim: true,
        },
        disponibilidade_inicio: {
            type: Date,
        },
        disponibilidade_fim: {
            type: Date,
        },
    },
    { timestamps: true }
)

const Profissional = mongoose.model<IProfissional>("Profissional", profissionalSchema)

export default Profissional
