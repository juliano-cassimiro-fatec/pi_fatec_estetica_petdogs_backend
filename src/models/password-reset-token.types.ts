import type { Types } from "mongoose";

export interface IPasswordResetToken {
  userId: Types.ObjectId;
  userRole: "cliente" | "profissional";
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
