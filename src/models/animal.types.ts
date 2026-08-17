import type { Types } from "mongoose"

export interface IAnimal {
    nome: string
    raca: string
    idade: number
    porte: "pequeno" | "medio" | "grande"
    foto?: string
    cliente: Types.ObjectId | string
    createdAt: Date
    updatedAt?: Date
}

export interface ICreateAnimalDTO {
    nome: string
    raca: string
    idade: number
    porte: "pequeno" | "medio" | "grande"
    foto?: string
    cliente: string
}

export interface IUpdateAnimalDTO {
    nome?: string
    raca?: string
    idade?: number
    porte?: "pequeno" | "medio" | "grande"
    foto?: string
}
