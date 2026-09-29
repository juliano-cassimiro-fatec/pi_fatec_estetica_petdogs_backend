import mongoose, { Schema } from "mongoose";
import type { IPasswordResetToken } from "./password-reset-token.types.js";

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ["cliente", "profissional"],
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    usedAt: {
      type: Date,
      default: undefined,
    },
    verifiedAt: {
      type: Date,
      default: undefined,
    },
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index({ userId: 1, userRole: 1, usedAt: 1, expiresAt: 1 });

const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema,
);

export default PasswordResetToken;
