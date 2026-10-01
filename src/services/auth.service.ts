import crypto from "crypto";
import Cliente from "../models/cliente.model.js";
import EmailVerificationToken from "../models/email-verification-token.model.js";
import PasswordResetToken from "../models/password-reset-token.model.js";
import Profissional from "../models/profissional.model.js";
import type {
  IChangePasswordDTO,
  IForgotPasswordDTO,
  ILoginDTO,
  IResendEmailVerificationDTO,
  IRegisterDTO,
  IResetPasswordDTO,
  IVerifyEmailDTO,
  IVerifyResetCodeDTO,
  UserRole,
} from "../models/auth.types.js";
import { env } from "../config/env.js";
import { AppError, badRequest, conflict, forbidden, unauthorized } from "../errors/app-error.js";
import { assertEmail } from "../utils/validation.js";
import { validateStoredImagePath } from "./upload.service.js";
import emailService from "./email.service.js";

const RESET_CODE_EXPIRATION_MS = 10 * 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_EXPIRATION_MS = 10 * 60 * 1000;
const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;

type PersistedRole = Exclude<UserRole, "admin">;
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  foto?: string;
  authVersion?: number;
  mustChangePassword?: boolean;
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
        mustChangePassword: user.mustChangePassword ?? false,
        ...(user.foto ? { foto: user.foto } : {}),
      },
      token: this.createToken(user),
    };
  }

  private async issueEmailVerificationCode(user: { id: string; email: string; name: string }) {
    const code = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${user.id}:${code}:email-verification`)
      .digest("hex");

    await EmailVerificationToken.deleteMany({ userId: user.id, usedAt: { $exists: false } });
    await EmailVerificationToken.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRATION_MS),
    });

    try {
      await emailService.sendEmailVerificationCode(user.email, user.name, code);
    } catch (error) {
      console.error(
        "Falha ao enviar código de verificação de e-mail",
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async findPersistedUser(id: string, role: PersistedRole): Promise<AuthUser | undefined> {
    if (role === "cliente") {
      const cliente = await Cliente.findById(id).select(
        "+authVersion +mustChangePassword +emailVerified",
      );
      if (!cliente || !cliente.ative || !cliente.emailVerified) return undefined;
      return {
        id: cliente.id,
        name: cliente.name,
        email: cliente.email,
        role,
        ...(cliente.foto ? { foto: cliente.foto } : {}),
        authVersion: cliente.authVersion,
        mustChangePassword: cliente.mustChangePassword,
      };
    }
    const user = await Profissional.findById(id).select("+authVersion +mustChangePassword");
    if (!user) return undefined;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      ...(user.foto ? { foto: user.foto } : {}),
      authVersion: user.authVersion,
      mustChangePassword: user.mustChangePassword,
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
        emailVerified: false,
        ...(data.telefone?.trim() ? { telefone: data.telefone.trim() } : {}),
        ...(data.foto?.trim() ? { foto: validateStoredImagePath(data.foto) } : {}),
      });
      await this.issueEmailVerificationCode({ id: cliente.id, email, name });
      return {
        message: "Cadastro criado. Enviamos um código para confirmar seu e-mail.",
        email,
        requiresEmailVerification: true,
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

    const profissional = await Profissional.findOne({ email }).select(
      "+senha +authVersion +mustChangePassword",
    );
    if (profissional?.senha && (await this.comparePassword(data.password, profissional.senha))) {
      return this.buildSession({
        id: profissional.id,
        name: profissional.name,
        email: profissional.email,
        role: "profissional",
        ...(profissional.foto ? { foto: profissional.foto } : {}),
        authVersion: profissional.authVersion,
        mustChangePassword: profissional.mustChangePassword,
      });
    }

    const cliente = await Cliente.findOne({ email, ative: true }).select(
      "+senha +authVersion +mustChangePassword +emailVerified",
    );
    if (!cliente || !(await this.comparePassword(data.password, cliente.senha))) {
      throw unauthorized("Credenciais inválidas");
    }
    if (!cliente.emailVerified) {
      throw new AppError(403, "Confirme seu e-mail antes de entrar", "EMAIL_VERIFICATION_REQUIRED");
    }
    return this.buildSession({
      id: cliente.id,
      name: cliente.name,
      email: cliente.email,
      role: "cliente",
      ...(cliente.foto ? { foto: cliente.foto } : {}),
      authVersion: cliente.authVersion,
      mustChangePassword: cliente.mustChangePassword,
    });
  }

  public async verifyEmail(data: IVerifyEmailDTO) {
    if (!/^\d{6}$/.test(data.code ?? "")) throw badRequest("Código inválido ou expirado");
    const email = this.normalizeEmail(data.email);
    const cliente = await Cliente.findOne({ email, ative: true }).select("+emailVerified");
    if (!cliente || cliente.emailVerified) throw badRequest("Código inválido ou expirado");

    const tokenHash = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${cliente.id}:${data.code}:email-verification`)
      .digest("hex");
    const now = new Date();
    const verification = await EmailVerificationToken.findOneAndUpdate(
      {
        userId: cliente.id,
        tokenHash,
        expiresAt: { $gt: now },
        usedAt: { $exists: false },
        attempts: { $lt: EMAIL_VERIFICATION_MAX_ATTEMPTS },
      },
      { usedAt: now },
      { new: true },
    );
    if (!verification) {
      await EmailVerificationToken.updateOne(
        {
          userId: cliente.id,
          expiresAt: { $gt: now },
          usedAt: { $exists: false },
          attempts: { $lt: EMAIL_VERIFICATION_MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
      );
      throw badRequest("Código inválido ou expirado");
    }

    const verifiedCliente = await Cliente.findOneAndUpdate(
      { _id: cliente.id, emailVerified: false },
      { emailVerified: true },
      { new: true },
    ).select("+authVersion +mustChangePassword +emailVerified");
    if (!verifiedCliente) throw badRequest("Código inválido ou expirado");

    return {
      message: "E-mail confirmado com sucesso",
      ...this.buildSession({
        id: verifiedCliente.id,
        name: verifiedCliente.name,
        email: verifiedCliente.email,
        role: "cliente",
        ...(verifiedCliente.foto ? { foto: verifiedCliente.foto } : {}),
        authVersion: verifiedCliente.authVersion,
        mustChangePassword: verifiedCliente.mustChangePassword,
      }),
    };
  }

  public async resendEmailVerification(data: IResendEmailVerificationDTO) {
    const email = this.normalizeEmail(data.email);
    const cliente = await Cliente.findOne({ email, ative: true, emailVerified: false });
    if (cliente) {
      await this.issueEmailVerificationCode({
        id: cliente.id,
        email: cliente.email,
        name: cliente.name,
      });
    }

    return {
      message: "Se houver um cadastro pendente para este e-mail, enviaremos um novo código.",
    };
  }

  public async changePassword(user: { id: string; role: UserRole }, data: IChangePasswordDTO) {
    if (user.role === "admin")
      throw forbidden("A senha do administrador é configurada no ambiente");
    this.assertPassword(data.password);

    const currentAccount =
      user.role === "cliente"
        ? await Cliente.findById(user.id).select("+senha +authVersion")
        : await Profissional.findById(user.id).select("+senha +authVersion");
    if (!currentAccount) throw unauthorized("Usuário não encontrado");
    if (await this.comparePassword(data.password, currentAccount.senha)) {
      throw badRequest("A nova senha deve ser diferente da senha provisória");
    }

    const update = {
      senha: await this.hashPassword(data.password),
      mustChangePassword: false,
      $inc: { authVersion: 1 },
    };
    const account =
      user.role === "cliente"
        ? await Cliente.findOneAndUpdate(
            { _id: user.id, senha: currentAccount.senha, authVersion: currentAccount.authVersion },
            update,
            { new: true, runValidators: true },
          ).select("+authVersion +mustChangePassword")
        : await Profissional.findOneAndUpdate(
            { _id: user.id, senha: currentAccount.senha, authVersion: currentAccount.authVersion },
            update,
            {
              new: true,
              runValidators: true,
            },
          ).select("+authVersion +mustChangePassword");
    if (!account) throw unauthorized("Sessão desatualizada; faça login novamente");

    return {
      message: "Senha alterada com sucesso",
      ...this.buildSession({
        id: account.id,
        name: account.name,
        email: account.email,
        role: user.role,
        ...(account.foto ? { foto: account.foto } : {}),
        authVersion: account.authVersion,
        mustChangePassword: account.mustChangePassword,
      }),
    };
  }

  public async forgotPassword(data: IForgotPasswordDTO) {
    const email = this.normalizeEmail(data.email);
    const genericResponse = {
      message: "Se o e-mail estiver cadastrado, enviaremos um código para redefinição.",
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

    const code = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${user.id}:${code}`)
      .digest("hex");
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRATION_MS);
    await PasswordResetToken.deleteMany({
      userId: user.id,
      userRole: role,
      usedAt: { $exists: false },
    });
    await PasswordResetToken.create({ userId: user.id, userRole: role, tokenHash, expiresAt });

    if (emailService.isConfigured()) {
      try {
        await emailService.sendPasswordResetCode(email, code);
      } catch (error) {
        console.error(
          "Falha ao enviar e-mail de recuperação",
          error instanceof Error ? error.message : error,
        );
      }
    }
    return genericResponse;
  }

  public async verifyResetCode(data: IVerifyResetCodeDTO) {
    if (!/^\d{6}$/.test(data.code ?? "")) throw badRequest("Código inválido ou expirado");
    const email = this.normalizeEmail(data.email);
    const cliente = await Cliente.findOne({ email, ative: true });
    const profissional = cliente ? undefined : await Profissional.findOne({ email });
    const account = cliente ?? profissional;
    const role: PersistedRole | undefined = cliente
      ? "cliente"
      : profissional
        ? "profissional"
        : undefined;
    if (!account || !role) throw badRequest("Código inválido ou expirado");

    const tokenHash = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${account.id}:${data.code}`)
      .digest("hex");
    const now = new Date();
    const resetToken = crypto.randomBytes(32).toString("base64url");
    const verifiedCode = await PasswordResetToken.findOneAndUpdate(
      {
        userId: account.id,
        userRole: role,
        tokenHash,
        expiresAt: { $gt: now },
        usedAt: { $exists: false },
        verifiedAt: { $exists: false },
        attempts: { $lt: RESET_CODE_MAX_ATTEMPTS },
      },
      {
        tokenHash: crypto.createHash("sha256").update(resetToken).digest("hex"),
        verifiedAt: now,
      },
      { new: true },
    ).select("+tokenHash");
    if (!verifiedCode) {
      await PasswordResetToken.updateOne(
        {
          userId: account.id,
          userRole: role,
          expiresAt: { $gt: now },
          usedAt: { $exists: false },
          verifiedAt: { $exists: false },
          attempts: { $lt: RESET_CODE_MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
      );
      throw badRequest("Código inválido ou expirado");
    }

    return { resetToken };
  }

  public async resetPassword(data: IResetPasswordDTO) {
    if (!data.resetToken?.trim()) throw badRequest("Token de redefinição inválido ou expirado");
    this.assertPassword(data.password);
    const tokenHash = crypto.createHash("sha256").update(data.resetToken).digest("hex");
    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        tokenHash,
        verifiedAt: { $exists: true },
        expiresAt: { $gt: new Date() },
        usedAt: { $exists: false },
      },
      { usedAt: new Date() },
      { new: true },
    ).select("+tokenHash");
    if (!resetToken) throw badRequest("Token de redefinição inválido ou expirado");

    const update = {
      senha: await this.hashPassword(data.password),
      mustChangePassword: false,
      $inc: { authVersion: 1 },
    };
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
