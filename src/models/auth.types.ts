export type UserRole = "admin" | "profissional" | "cliente"

export interface IRegisterDTO {
    name: string
    email: string
    password: string
    telefone?: string
    foto?: string
    verificationToken: string
}

export interface ISendOtpDTO {
    email: string
}

export interface IVerifyOtpDTO {
    email: string
    codigo: string
}

export interface ILoginDTO {
    email: string
    password: string
}

export interface IForgotPasswordDTO {
    email: string
}

export interface IResetPasswordDTO {
    token: string
    password: string
}
