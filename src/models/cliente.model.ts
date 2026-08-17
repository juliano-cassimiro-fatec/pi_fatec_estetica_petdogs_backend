import mongoose, { Schema } from "mongoose"
import type { ICliente } from "./cliente.types.js"

const clienteSchema = new Schema<ICliente>(
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
            enum: ["cliente"],
            default: "cliente",
            required: true,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
        },
    },
    { timestamps: true }
)

const Cliente = mongoose.model<ICliente>("Cliente", clienteSchema)

export default Cliente
