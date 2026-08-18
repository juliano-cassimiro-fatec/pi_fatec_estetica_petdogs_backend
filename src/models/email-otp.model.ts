import mongoose, { Schema } from "mongoose"

interface IEmailOtp {
    email: string
    codeHash: string
    expiresAt: Date
    resendAvailableAt: Date
    attempts: number
}

const emailOtpSchema = new Schema<IEmailOtp>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        codeHash: { type: String, required: true, select: false },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        resendAvailableAt: { type: Date, required: true },
        attempts: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
)

const EmailOtp = mongoose.model<IEmailOtp>("EmailOtp", emailOtpSchema)

export default EmailOtp
