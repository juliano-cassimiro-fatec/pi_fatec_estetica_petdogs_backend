const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "JWT_ISSUER",
  "JWT_AUDIENCE",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_NAME",
  "FRONTEND_URL",
  "UPLOAD_DIR",
] as const;

export function validateEnvironment(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length)
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`);
  if ((process.env.JWT_SECRET?.length ?? 0) < 32)
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
  if ((process.env.ADMIN_PASSWORD?.length ?? 0) < 12)
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres");
}

export function env(name: (typeof required)[number]): string {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Variável de ambiente ${name} não configurada`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
