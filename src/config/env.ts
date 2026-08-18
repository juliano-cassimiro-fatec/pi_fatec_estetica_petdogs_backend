const required = ["MONGO_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME", "ONESIGNAL_APP_ID", "ONESIGNAL_API_KEY", "OTP_VERIFICATION_SECRET"] as const

export function validateEnvironment(): void {
    const missing = required.filter((key) => !process.env[key]?.trim())
    if (missing.length) throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`)
    if ((process.env.JWT_SECRET?.length ?? 0) < 32) throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres")
    if ((process.env.OTP_VERIFICATION_SECRET?.length ?? 0) < 32) throw new Error("OTP_VERIFICATION_SECRET deve ter pelo menos 32 caracteres")
    if ((process.env.ADMIN_PASSWORD?.length ?? 0) < 12) throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres")
}

export function env(name: typeof required[number]): string {
    const value = process.env[name]
    if (!value) throw new Error(`Variável de ambiente ${name} não configurada`)
    return value
}
