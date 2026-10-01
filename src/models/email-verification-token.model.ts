import mongoose, { Schema } from "mongoose";
import type { IEmailVerificationToken } from "./email-verification-token.types.js";

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
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
    attempts: {
      type: Number,
      default: 0,
      required: true,
    },
    usedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true },
);

emailVerificationTokenSchema.index({ userId: 1, usedAt: 1, expiresAt: 1 });

const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  "EmailVerificationToken",
  emailVerificationTokenSchema,
);

export default EmailVerificationToken;
