import mongoose, { Schema } from "mongoose"
import type { IAnimal } from "./animal.types.js"

const animalSchema = new Schema<IAnimal>(
    {
        nome: {
            type: String,
            required: true,
            trim: true,
        },
        raca: {
            type: String,
            required: true,
            trim: true,
        },
        idade: {
            type: Number,
            required: true,
            min: 0,
        },
        porte: {
            type: String,
            required: true,
            trim: true,
            enum: ["pequeno", "medio", "grande"],
        },
        foto: {
            type: String,
            trim: true,
        },
        cliente: {
            type: Schema.Types.ObjectId,
            ref: "Cliente",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
)

const Animal = mongoose.model<IAnimal>("Animal", animalSchema)

export default Animal
