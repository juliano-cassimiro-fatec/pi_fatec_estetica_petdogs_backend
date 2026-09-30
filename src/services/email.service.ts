import { randomUUID } from "crypto";
import net from "net";
import tls from "tls";
import { env, optionalEnv } from "../config/env.js";

type SmtpSocket = net.Socket | tls.TLSSocket;

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;
}

function toCrlf(value: string): string {
  return value.replace(/\r?\n/g, "\r\n");
}

function getMailConfiguration() {
  const host = optionalEnv("SMTP_HOST");
  const user = optionalEnv("SMTP_USER");
  const password = optionalEnv("SMTP_PASSWORD");
  const from = optionalEnv("MAIL_FROM") ?? user;
  const port = Number(optionalEnv("SMTP_PORT") ?? "587");

  if (!host || !user || !password || !from || !Number.isInteger(port) || port <= 0) {
    return undefined;
  }

  return { host, user, password, from, port, secure: optionalEnv("SMTP_SECURE") === "true" };
}

function waitForResponse(socket: SmtpSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let response = "";
    const onData = (chunk: Buffer) => {
      response += chunk.toString("utf8");
      const lines = response.trimEnd().split("\r\n");
      if (/^\d{3} /.test(lines[lines.length - 1] ?? "")) {
        cleanup();
        resolve(response);
      }
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function command(socket: SmtpSocket, value: string, expected: number[]): Promise<string> {
  socket.write(`${value}\r\n`);
  const response = await waitForResponse(socket);
  const code = Number(response.slice(0, 3));
  if (!expected.includes(code)) {
    const detail = response.trim().replace(/\r?\n/g, " ");
    throw new Error(`SMTP recusou o comando (${code}): ${detail}`);
  }
  return response;
}

function connect(host: string, port: number, secure: boolean): Promise<SmtpSocket> {
  return new Promise((resolve, reject) => {
    const socket = secure ? tls.connect({ host, port }) : net.connect({ host, port });
    socket.once("connect", () => resolve(socket));
    socket.once("error", reject);
  });
}

async function upgradeToTls(socket: SmtpSocket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const secured = tls.connect({ socket, servername: host });
    secured.once("secureConnect", () => resolve(secured));
    secured.once("error", reject);
  });
}

class EmailService {
  public isConfigured(): boolean {
    return Boolean(getMailConfiguration());
  }

  private async sendMessage(email: string, subject: string, body: string[]): Promise<void> {
    const configuration = getMailConfiguration();
    if (!configuration) throw new Error("Serviço de e-mail não configurado");

    let socket: SmtpSocket | undefined;
    try {
      socket = await connect(configuration.host, configuration.port, configuration.secure);
      let greeting = await waitForResponse(socket);
      if (!greeting.startsWith("220")) throw new Error("Servidor SMTP indisponível");

      let capabilities = await command(socket, "EHLO petdogs-api", [250]);
      if (!configuration.secure) {
        if (!/STARTTLS/i.test(capabilities)) throw new Error("Servidor SMTP não oferece STARTTLS");
        await command(socket, "STARTTLS", [220]);
        socket = await upgradeToTls(socket, configuration.host);
        greeting = await command(socket, "EHLO petdogs-api", [250]);
        capabilities = greeting;
      }

      if (!/AUTH/i.test(capabilities)) throw new Error("Servidor SMTP não oferece autenticação");
      const credentials = Buffer.from(
        `\u0000${configuration.user}\u0000${configuration.password}`,
      ).toString("base64");
      await command(socket, `AUTH PLAIN ${credentials}`, [235]);
      await command(socket, `MAIL FROM:<${configuration.from}>`, [250]);
      await command(socket, `RCPT TO:<${email}>`, [250, 251]);
      await command(socket, "DATA", [354]);

      const messageId = `<${randomUUID()}@petdogs>`;
      const content = [
        `From: ${encodeHeader("PetDogs Estética")} <${configuration.from}>`,
        `To: <${email}>`,
        `Subject: ${encodeHeader(subject)}`,
        `Message-ID: ${messageId}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "",
        ...body,
      ].join("\r\n");
      await command(socket, `${toCrlf(content)}\r\n.`, [250]);
      await command(socket, "QUIT", [221]);
    } finally {
      socket?.destroy();
    }
  }

  public async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.sendMessage(email, "Código para redefinir sua senha - PetDogs", [
      "Recebemos uma solicitação para redefinir a senha da sua conta PetDogs.",
      "",
      `Seu código de verificação é: ${code}`,
      "Ele expira em 10 minutos e pode ser usado uma única vez.",
      "",
      "Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá inalterada.",
    ]);
  }

  public async sendAccountCreatedEmail(
    email: string,
    name: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = new URL("/login", env("FRONTEND_URL")).toString();
    const safeName = name.replace(/[\r\n]+/g, " ").trim();
    await this.sendMessage(email, "Sua conta PetDogs foi criada", [
      `Olá, ${safeName}.`,
      "",
      "Sua conta PetDogs foi criada pelo administrador.",
      `E-mail de acesso: ${email}`,
      `Senha provisória: ${temporaryPassword}`,
      "No primeiro acesso, crie uma nova senha antes de continuar. As demais funcionalidades ficarão bloqueadas até a troca.",
      `Acesse: ${loginUrl}`,
      "",
      "Se você não esperava esta conta, entre em contato com o administrador.",
    ]);
  }
}

export default new EmailService();
