import crypto from "crypto";
import Cliente from "../models/cliente.model.js";
import PasswordResetToken from "../models/password-reset-token.model.js";
import Profissional from "../models/profissional.model.js";
import type {
  IForgotPasswordDTO,
  ILoginDTO,
  IRegisterDTO,
  IResetPasswordDTO,
  UserRole,
} from "../models/auth.types.js";
import { env } from "../config/env.js";
import { badRequest, conflict, unauthorized } from "../errors/app-error.js";
import { assertEmail } from "../utils/validation.js";
import { validateStoredImagePath } from "./upload.service.js";
import emailService from "./email.service.js";

const RESET_TOKEN_EXPIRATION_MS = 30 * 60 * 1000;

type PersistedRole = Exclude<UserRole, "admin">;
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  foto?: string;
  authVersion?: number;
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

function parseDuration(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error("JWT_EXPIRES_IN deve usar o formato 15m, 1h ou 7d");
  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return amount * multiplier;
}

class AuthService {
  private normalizeEmail(email: string | undefined): string {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) throw badRequest("E-mail inválido");
    assertEmail(normalized);
    return normalized;
  }

  public assertPassword(password: string): void {
    if (!password || password.length < 8) {
      throw badRequest("A senha deve ter pelo menos 8 caracteres");
    }
  }

  public async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await derivePassword(password, salt);
    return `scrypt:${salt}:${hash.toString("hex")}`;
  }

  private async comparePassword(password: string, storedPassword: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedPassword.split(":");
    if (algorithm !== "scrypt" || !salt || !hash) return false;
    const storedHash = Buffer.from(hash, "hex");
    const derivedHash = await derivePassword(password, salt);
    return (
      storedHash.length === derivedHash.length && crypto.timingSafeEqual(storedHash, derivedHash)
    );
  }

  private createToken(user: AuthUser): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      role: user.role,
      av: user.authVersion ?? 0,
      iss: env("JWT_ISSUER"),
      aud: env("JWT_AUDIENCE"),
      iat: now,
      exp: now + parseDuration(env("JWT_EXPIRES_IN")),
    };
    const unsignedToken = `${Buffer.from(JSON.stringify(header)).toString("base64url")}.${Buffer.from(
      JSON.stringify(payload),
    ).toString("base64url")}`;
    const signature = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(unsignedToken)
      .digest("base64url");
    return `${unsignedToken}.${signature}`;
  }

  private buildSession(user: AuthUser) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.foto ? { foto: user.foto } : {}),
      },
      token: this.createToken(user),
    };
  }

  private async findPersistedUser(id: string, role: PersistedRole): Promise<AuthUser | undefined> {
    if (role === "cliente") {
      const cliente = await Cliente.findById(id).select("+authVersion");
      if (!cliente || !cliente.ative) return undefined;
      return {
        id: cliente.id,
        name: cliente.name,
        email: cliente.email,
        role,
        ...(cliente.foto ? { foto: cliente.foto } : {}),
        authVersion: cliente.authVersion,
      };
    }
    const user = await Profissional.findById(id).select("+authVersion");
    if (!user) return undefined;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      ...(user.foto ? { foto: user.foto } : {}),
      authVersion: user.authVersion,
    };
  }

  public async verifyToken(token: string): Promise<AuthUser> {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) throw unauthorized("Token inválido");

    const expectedSignature = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      throw unauthorized("Token inválido");
    }

    try {
      const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as {
        alg?: string;
        typ?: string;
      };
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
        sub?: string;
        role?: UserRole;
        av?: number;
        iss?: string;
        aud?: string;
        exp?: number;
      };
      if (
        header.alg !== "HS256" ||
        header.typ !== "JWT" ||
        !payload.sub ||
        !payload.role ||
        !Number.isInteger(payload.av) ||
        !Number.isFinite(payload.exp) ||
        payload.iss !== env("JWT_ISSUER") ||
        payload.aud !== env("JWT_AUDIENCE") ||
        !["admin", "cliente", "profissional"].includes(payload.role)
      ) {
        throw unauthorized("Token inválido");
      }
      const expiresAt = payload.exp!;
      if (expiresAt <= Math.floor(Date.now() / 1000)) throw unauthorized("Token expirado");

      if (payload.role === "admin") {
        if (payload.sub !== "admin") throw unauthorized("Token inválido");
        return {
          id: "admin",
          name: env("ADMIN_NAME"),
          email: env("ADMIN_EMAIL").toLowerCase(),
          role: "admin",
          authVersion: 0,
        };
      }

      const user = await this.findPersistedUser(payload.sub, payload.role);
      if (!user || user.authVersion !== payload.av) throw unauthorized("Token inválido");
      return user;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) throw error;
      throw unauthorized("Token inválido");
    }
  }

  public async register(data: IRegisterDTO) {
    const name = data.name?.trim();
    const email = this.normalizeEmail(data.email);
    if (!name || !data.password) throw badRequest("Nome, e-mail e senha são obrigatórios");
    this.assertPassword(data.password);

    const emailInUse = await Cliente.exists({ email });
    const professionalEmailInUse = await Profissional.exists({ email });
    if (emailInUse || professionalEmailInUse || email === env("ADMIN_EMAIL").toLowerCase()) {
      throw conflict("E-mail já cadastrado");
    }

    try {
      const cliente = await Cliente.create({
        name,
        email,
        senha: await this.hashPassword(data.password),
        role: "cliente",
        ...(data.telefone?.trim() ? { telefone: data.telefone.trim() } : {}),
        ...(data.foto?.trim() ? { foto: validateStoredImagePath(data.foto) } : {}),
      });
      return {
        message: "Usuário cadastrado com sucesso",
        ...this.buildSession({
          id: cliente.id,
          name: cliente.name,
          email: cliente.email,
          role: "cliente",
          ...(cliente.foto ? { foto: cliente.foto } : {}),
          authVersion: cliente.authVersion,
        }),
      };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        throw conflict("E-mail já cadastrado");
      }
      throw error;
    }
  }

  public async login(data: ILoginDTO) {
    const email = this.normalizeEmail(data.email);
    if (!data.password) throw badRequest("E-mail e senha são obrigatórios");

    if (email === env("ADMIN_EMAIL").toLowerCase() && data.password === env("ADMIN_PASSWORD")) {
      return this.buildSession({
        id: "admin",
        name: env("ADMIN_NAME"),
        email,
        role: "admin",
        authVersion: 0,
      });
    }

    const profissional = await Profissional.findOne({ email }).select("+senha +authVersion");
    if (profissional?.senha && (await this.comparePassword(data.password, profissional.senha))) {
      return this.buildSession({
        id: profissional.id,
        name: profissional.name,
        email: profissional.email,
        role: "profissional",
        ...(profissional.foto ? { foto: profissional.foto } : {}),
        authVersion: profissional.authVersion,
      });
    }

    const cliente = await Cliente.findOne({ email, ative: true }).select("+senha +authVersion");
    if (!cliente || !(await this.comparePassword(data.password, cliente.senha))) {
      throw unauthorized("Credenciais inválidas");
    }
    return this.buildSession({
      id: cliente.id,
      name: cliente.name,
      email: cliente.email,
      role: "cliente",
      ...(cliente.foto ? { foto: cliente.foto } : {}),
      authVersion: cliente.authVersion,
    });
  }

  public async forgotPassword(data: IForgotPasswordDTO) {
    const email = this.normalizeEmail(data.email);
    const genericResponse = {
      message: "Se o e-mail estiver cadastrado, enviaremos instruções para redefinição.",
    };
    const cliente = await Cliente.findOne({ email, ative: true });
    const profissional = cliente ? undefined : await Profissional.findOne({ email });
    const user = cliente ?? profissional;
    const role: PersistedRole | undefined = cliente
      ? "cliente"
      : profissional
        ? "profissional"
        : undefined;
    if (!user || !role) return genericResponse;

    const plainToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);
    await PasswordResetToken.deleteMany({
      userId: user.id,
      userRole: role,
      usedAt: { $exists: false },
    });
    await PasswordResetToken.create({ userId: user.id, userRole: role, tokenHash, expiresAt });

    if (emailService.isConfigured()) {
      const resetUrl = new URL("/reset-password", env("FRONTEND_URL"));
      resetUrl.searchParams.set("token", plainToken);
      try {
        await emailService.sendPasswordResetEmail(email, resetUrl.toString());
      } catch (error) {
        console.error(
          "Falha ao enviar e-mail de recuperação",
          error instanceof Error ? error.message : error,
        );
      }
    }
    return genericResponse;
  }

  public async resetPassword(data: IResetPasswordDTO) {
    if (!data.token?.trim()) throw badRequest("Token é obrigatório");
    this.assertPassword(data.password);
    const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");
    const resetToken = await PasswordResetToken.findOneAndUpdate(
      { tokenHash, expiresAt: { $gt: new Date() }, usedAt: { $exists: false } },
      { usedAt: new Date() },
      { new: true },
    ).select("+tokenHash");
    if (!resetToken) throw badRequest("Token inválido ou expirado");

    const update = { senha: await this.hashPassword(data.password), $inc: { authVersion: 1 } };
    const user =
      resetToken.userRole === "cliente"
        ? await Cliente.findByIdAndUpdate(resetToken.userId, update, {
            new: true,
            runValidators: true,
          })
        : await Profissional.findByIdAndUpdate(resetToken.userId, update, {
            new: true,
            runValidators: true,
          });
    if (!user) throw badRequest("Token inválido ou expirado");
    return { message: "Senha redefinida com sucesso" };
  }
}

export default new AuthService();
