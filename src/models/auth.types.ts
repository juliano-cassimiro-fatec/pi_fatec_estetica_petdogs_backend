export type UserRole = "admin" | "profissional" | "cliente";

export interface IRegisterDTO {
  name: string;
  email: string;
  password: string;
  telefone?: string;
  foto?: string;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IForgotPasswordDTO {
  email: string;
}

export interface IVerifyResetCodeDTO {
  email: string;
  code: string;
}

export interface IResetPasswordDTO {
  resetToken: string;
  password: string;
}
