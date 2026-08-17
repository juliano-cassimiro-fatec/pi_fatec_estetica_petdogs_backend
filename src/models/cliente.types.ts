export interface ICliente {
    name: string
    email: string
    telefone?: string
    foto?: string
    role: "cliente"
    senha: string
    resetPasswordToken?: string
    resetPasswordExpires?: Date
    createdAt: Date
    updatedAt?: Date
}

export interface ICreateClienteDTO {
    name: string
    email: string
    telefone?: string
    foto?: string
    senha: string
}

export interface IUpdateClienteDTO {
    name?: string
    email?: string
    telefone?: string
    foto?: string
    senha?: string
}
