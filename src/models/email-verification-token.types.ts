import type { Types } from "mongoose";

export interface IEmailVerificationToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  attempts: number;
  usedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
