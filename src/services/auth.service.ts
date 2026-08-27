import crypto from "crypto";
import Cliente from "../models/cliente.model.js";
import Profissional from "../models/profissional.model.js";
import type {
  IForgotPasswordDTO,
  ILoginDTO,
  IRegisterDTO,
  IResetPasswordDTO,
  UserRole,
} from "../models/auth.types.js";
import { badRequest } from "../errors/app-error.js";
import { env } from "../config/env.js";
import { assertEmail } from "../utils/validation.js";
import { storeImageInput } from "./upload.service.js";

const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

class AuthService {
  private normalizeEmail(email: string | undefined): string {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) throw badRequest("E-mail inválido");
    assertEmail(normalized);
    return normalized;
  }

  public assertPassword(password: string): void {
    if (!password || password.length < 6) {
      throw badRequest("A senha deve ter pelo menos 6 caracteres");
    }
  }

  public async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await derivePassword(password, salt);
    return `scrypt:${salt}:${hash.toString("hex")}`;
  }

  private async comparePassword(password: string, storedPassword: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedPassword.split(":");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const storedHash = Buffer.from(hash, "hex");
    const derivedHash = await derivePassword(password, salt);

    return (
      storedHash.length === derivedHash.length && crypto.timingSafeEqual(storedHash, derivedHash)
    );
  }

  private base64Url(input: Buffer | string): string {
    return Buffer.from(input).toString("base64url");
  }

  private createToken(payload: Record<string, unknown>): string {
    const header = { alg: "HS256", typ: "JWT" };
    const body = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_SECONDS,
    };
    const unsignedToken = `${this.base64Url(JSON.stringify(header))}.${this.base64Url(JSON.stringify(body))}`;
    const signature = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(unsignedToken)
      .digest("base64url");

    return `${unsignedToken}.${signature}`;
  }

  private buildSession(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    foto?: string | undefined;
  }) {
    return {
      user,
      token: this.createToken({
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    };
  }

  public async verifyToken(
    token: string,
  ): Promise<{ id: string; email: string; name: string; role: UserRole }> {
    const [header, payload, signature] = token.split(".");

    if (!header || !payload || !signature) {
      throw new Error("Token inválido");
    }

    const expectedSignature = crypto
      .createHmac("sha256", env("JWT_SECRET"))
      .update(`${header}.${payload}`)
      .digest("base64url");

    const receivedSignature = Buffer.from(signature);
    const validSignature = Buffer.from(expectedSignature);
    if (
      receivedSignature.length !== validSignature.length ||
      !crypto.timingSafeEqual(receivedSignature, validSignature)
    ) {
      throw new Error("Token inválido");
    }

    const decodedHeader: unknown = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (
      typeof decodedHeader !== "object" ||
      decodedHeader === null ||
      !("alg" in decodedHeader) ||
      decodedHeader.alg !== "HS256"
    )
      throw new Error("Token inválido");
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      name?: string;
      role?: UserRole;
      exp?: number;
    };

    if (
      !decodedPayload.sub ||
      !decodedPayload.email ||
      !decodedPayload.name ||
      !decodedPayload.exp ||
      !decodedPayload.role ||
      !["admin", "profissional", "cliente"].includes(decodedPayload.role)
    ) {
      throw new Error("Token inválido");
    }

    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expirado");
    }

    if (decodedPayload.role !== "admin") {
      const exists =
        decodedPayload.role === "profissional"
          ? await Profissional.exists({ _id: decodedPayload.sub })
          : await Cliente.exists({ _id: decodedPayload.sub });
      if (!exists) throw new Error("Usuário não encontrado");
    } else if (decodedPayload.sub !== "admin" || decodedPayload.email !== env("ADMIN_EMAIL"))
      throw new Error("Token inválido");

    return {
      id: decodedPayload.sub,
      email: decodedPayload.email,
      name: decodedPayload.name,
      role: decodedPayload.role,
    };
  }

  public async register(data: IRegisterDTO) {
    const name = data.name.trim();
    const email = this.normalizeEmail(data.email);
    const password = data.password;

    if (!name || !password) {
      throw new Error("Nome, e-mail e senha são obrigatórios");
    }

    this.assertPassword(password);
    const emailInUse = await Cliente.findOne({ email });
    const professionalEmailInUse = await Profissional.findOne({ email });

    if (emailInUse || professionalEmailInUse || email === env("ADMIN_EMAIL").toLowerCase()) {
      throw new Error("E-mail já cadastrado");
    }

    const clientePayload: Record<string, string> = {
      name,
      email,
      senha: await this.hashPassword(password),
      role: "cliente",
    };

    if (data.telefone?.trim()) clientePayload.telefone = data.telefone.trim();
    if (data.foto?.trim()) clientePayload.foto = await storeImageInput(data.foto);

    const cliente = await Cliente.create(clientePayload);

    return this.buildSession({
      id: cliente.id,
      name: cliente.name,
      email: cliente.email,
      role: "cliente",
      foto: cliente.foto,
    });
  }

  public async login(data: ILoginDTO) {
    const email = data.email.trim().toLowerCase();

    if (!email || !data.password) {
      throw new Error("E-mail e senha são obrigatórios");
    }

    if (email === env("ADMIN_EMAIL").toLowerCase() && data.password === env("ADMIN_PASSWORD")) {
      return this.buildSession({
        id: "admin",
        name: env("ADMIN_NAME"),
        email: env("ADMIN_EMAIL"),
        role: "admin",
      });
    }

    const profissional = await Profissional.findOne({ email }).select("+senha");

    if (profissional?.senha && (await this.comparePassword(data.password, profissional.senha))) {
      return this.buildSession({
        id: profissional.id,
        name: profissional.name,
        email: profissional.email,
        role: "profissional",
        foto: profissional.foto,
      });
    }

    const cliente = await Cliente.findOne({ email }).select("+senha");

    if (!cliente || !(await this.comparePassword(data.password, cliente.senha))) {
      throw new Error("Credenciais inválidas");
    }

    return this.buildSession({
      id: cliente.id,
      name: cliente.name,
      email: cliente.email,
      role: "cliente",
      foto: cliente.foto,
    });
  }

  public async forgotPassword(data: IForgotPasswordDTO) {
    const email = data.email.trim().toLowerCase();

    if (!email) throw badRequest("E-mail inválido");
    assertEmail(email);

    const cliente = await Cliente.findOne({ email });

    const genericResponse = {
      message: "Se o e-mail existir, as instruções de recuperação serão enviadas",
    };
    if (!cliente) return genericResponse;

    const plainToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto.createHash("sha256").update(plainToken).digest("hex");

    await Cliente.findByIdAndUpdate(cliente.id, {
      resetPasswordToken,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
    });

    const webhook = process.env.PASSWORD_RESET_WEBHOOK;
    if (webhook) {
      void fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token: plainToken }),
      }).catch((error: unknown) => console.error("Falha ao entregar recuperação de senha", error));
    }
    return genericResponse;
  }

  public async resetPassword(data: IResetPasswordDTO) {
    if (!data.token) {
      throw new Error("Token é obrigatório");
    }

    this.assertPassword(data.password);

    const resetPasswordToken = crypto.createHash("sha256").update(data.token).digest("hex");
    const cliente = await Cliente.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!cliente) {
      throw new Error("Token inválido ou expirado");
    }

    await Cliente.findByIdAndUpdate(cliente.id, {
      senha: await this.hashPassword(data.password),
      $unset: {
        resetPasswordToken: "",
        resetPasswordExpires: "",
      },
    });

    return { message: "Senha redefinida com sucesso" };
  }
}

export default new AuthService();
