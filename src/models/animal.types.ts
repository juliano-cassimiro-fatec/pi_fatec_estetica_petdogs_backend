import type { Types } from "mongoose"

export interface IAnimal {
    nome: string
    raca: string
    idade: number
    porte: string
    foto?: string
    cliente: Types.ObjectId | string
    createdAt: string
    updatedAt?: string
}

export interface ICreateAnimalDTO {
    nome: string
    raca: string
    idade: number
    porte: string
    foto?: string
    cliente: string
}

export interface IUpdateAnimalDTO {
    nome?: string
    raca?: string
    idade?: number
    porte?: string
    foto?: string
}
