import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  targetId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    foto?: string;
    role: "admin" | "profissional" | "cliente";
  };
}
