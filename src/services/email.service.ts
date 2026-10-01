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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function encodeBase64Lines(value: string): string {
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return encoded.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function emailLayout(preheader: string, title: string, content: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f2f6f3;font-family:Arial,Helvetica,sans-serif;color:#18352f;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f6f3;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dce7df;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:24px 32px;background:#145a4a;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px;">ESTÉTICA PETDOGS</td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:#173d32;">${title}</h1>
            ${content}
          </td></tr>
          <tr><td style="padding:20px 32px;background:#f7faf8;border-top:1px solid #e4ece6;color:#61736b;font-size:12px;line-height:1.6;">
            Estética PetDogs<br>Esta mensagem foi enviada automaticamente. Não responda a este e-mail.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
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

  private async sendMessage(
    email: string,
    subject: string,
    textBody: string[],
    htmlBody: string,
  ): Promise<void> {
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
      const boundary = `petdogs-${randomUUID()}`;
      const content = [
        `From: ${encodeHeader("Estética PetDogs")} <${configuration.from}>`,
        `To: <${email}>`,
        `Subject: ${encodeHeader(subject)}`,
        `Message-ID: ${messageId}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodeBase64Lines(textBody.join("\r\n")),
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodeBase64Lines(htmlBody),
        `--${boundary}--`,
      ].join("\r\n");
      await command(socket, `${toCrlf(content)}\r\n.`, [250]);
      await command(socket, "QUIT", [221]);
    } finally {
      socket?.destroy();
    }
  }

  public async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const safeCode = escapeHtml(code);
    const textBody = [
      "Olá! Recebemos uma solicitação para redefinir sua senha da Estética PetDogs.",
      "",
      `Seu código de verificação é: ${code}`,
      "Ele expira em 10 minutos e pode ser usado uma única vez.",
      "",
      "Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá inalterada.",
    ];
    const htmlBody = emailLayout(
      "Use seu código para continuar com a redefinição de senha.",
      "Vamos recuperar seu acesso",
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá! Recebemos uma solicitação para redefinir sua senha da Estética PetDogs.</p>
       <p style="margin:0 0 10px;font-size:14px;color:#52675e;">Seu código de verificação</p>
       <div style="margin:0 0 18px;padding:18px;text-align:center;background:#eff6f1;border:1px solid #d7e7db;border-radius:8px;color:#145a4a;font-size:32px;font-weight:bold;letter-spacing:8px;">${safeCode}</div>
       <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52675e;">O código expira em <strong>10 minutos</strong> e pode ser usado uma única vez.</p>
       <p style="margin:0;font-size:13px;line-height:1.6;color:#61736b;">Se você não solicitou esta alteração, ignore esta mensagem. Sua senha permanecerá inalterada.</p>`,
    );
    await this.sendMessage(
      email,
      "Seu código de recuperação da Estética PetDogs",
      textBody,
      htmlBody,
    );
  }

  public async sendEmailVerificationCode(email: string, name: string, code: string): Promise<void> {
    const safeName = escapeHtml(name.replace(/[\r\n]+/g, " ").trim());
    const safeCode = escapeHtml(code);
    const textBody = [
      `Olá, ${name}! Recebemos seu pedido de cadastro na Estética PetDogs.`,
      "",
      `Seu código para confirmar o e-mail é: ${code}`,
      "Ele expira em 10 minutos e pode ser usado uma única vez.",
      "",
      "Se você não iniciou este cadastro, ignore esta mensagem.",
    ];
    const htmlBody = emailLayout(
      "Confirme seu e-mail para concluir seu cadastro na Estética PetDogs.",
      "Só falta confirmar seu e-mail",
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá, <strong>${safeName}</strong>! Que bom ter você com a gente.</p>
       <p style="margin:0 0 10px;font-size:14px;color:#52675e;">Digite este código para confirmar seu e-mail</p>
       <div style="margin:0 0 18px;padding:18px;text-align:center;background:#eff6f1;border:1px solid #d7e7db;border-radius:8px;color:#145a4a;font-size:32px;font-weight:bold;letter-spacing:8px;">${safeCode}</div>
       <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52675e;">O código expira em <strong>10 minutos</strong> e pode ser usado uma única vez.</p>
       <p style="margin:0;font-size:13px;line-height:1.6;color:#61736b;">Se você não iniciou este cadastro, ignore esta mensagem.</p>`,
    );
    await this.sendMessage(email, "Confirme seu e-mail | Estética PetDogs", textBody, htmlBody);
  }

  public async sendAccountCreatedEmail(
    email: string,
    name: string,
    temporaryPassword: string,
  ): Promise<void> {
    const loginUrl = new URL("/login", env("FRONTEND_URL")).toString();
    const safeName = name.replace(/[\r\n]+/g, " ").trim();
    const safeEmail = escapeHtml(email);
    const safeHtmlName = escapeHtml(safeName);
    const safePassword = escapeHtml(temporaryPassword);
    const safeLoginUrl = escapeHtml(loginUrl);
    const textBody = [
      `Olá, ${safeName}!`,
      "",
      "Criamos seu acesso à Estética PetDogs. Seja bem-vindo!",
      `E-mail de acesso: ${email}`,
      `Senha provisória: ${temporaryPassword}`,
      "Por segurança, no primeiro acesso você precisará criar uma nova senha antes de continuar.",
      `Acesse sua conta: ${loginUrl}`,
      "",
      "Se não reconhece este cadastro, entre em contato com nossa equipe de atendimento.",
    ];
    const htmlBody = emailLayout(
      "Seu acesso à Estética PetDogs está pronto. Veja os próximos passos.",
      "Seu acesso está pronto",
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Olá, <strong>${safeHtmlName}</strong>! Seja bem-vindo à Estética PetDogs.</p>
       <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#52675e;">Criamos seu acesso para você acompanhar e aproveitar nossos serviços.</p>
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f7faf8;border:1px solid #e0eae2;border-radius:8px;">
         <tr><td style="padding:16px 18px 6px;color:#61736b;font-size:12px;text-transform:uppercase;">E-mail de acesso</td></tr>
         <tr><td style="padding:0 18px 16px;color:#18352f;font-size:15px;word-break:break-word;">${safeEmail}</td></tr>
         <tr><td style="padding:14px 18px 6px;border-top:1px solid #e0eae2;color:#61736b;font-size:12px;text-transform:uppercase;">Senha provisória</td></tr>
         <tr><td style="padding:0 18px 16px;color:#18352f;font-size:16px;font-weight:bold;word-break:break-word;">${safePassword}</td></tr>
       </table>
       <p style="margin:0 0 22px;padding:14px 16px;background:#fff8e8;border-left:4px solid #d7a744;color:#59451c;font-size:14px;line-height:1.6;"><strong>Próximo passo:</strong> no primeiro acesso, crie uma nova senha. Por segurança, as demais áreas ficam bloqueadas até concluir essa etapa.</p>
       <p style="margin:0 0 24px;"><a href="${safeLoginUrl}" style="display:inline-block;padding:13px 22px;border-radius:6px;background:#145a4a;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Acessar minha conta</a></p>
       <p style="margin:0;font-size:13px;line-height:1.6;color:#61736b;">Se não reconhece este cadastro, entre em contato com nossa equipe de atendimento.</p>`,
    );
    await this.sendMessage(email, "Seu acesso à Estética PetDogs está pronto", textBody, htmlBody);
  }

  public async sendAppointmentNotification(data: {
    email: string;
    recipientName: string;
    event: "created" | "confirmed" | "canceled";
    appointmentId: string;
    clientName: string;
    professionalName: string;
    animalName: string;
    serviceName: string;
    startsAt: Date;
    durationMinutes: number;
  }): Promise<void> {
    const eventContent = {
      created: {
        subject: "Recebemos seu agendamento",
        title: "Seu horário foi reservado",
        message: "Seu agendamento foi criado com sucesso.",
      },
      confirmed: {
        subject: "Seu agendamento foi confirmado",
        title: "Está confirmado!",
        message: "Seu horário está confirmado. Esperamos você!",
      },
      canceled: {
        subject: "Seu agendamento foi cancelado",
        title: "Agendamento cancelado",
        message: "O agendamento abaixo foi cancelado.",
      },
    }[data.event];
    const dateTime = data.startsAt.toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const safeName = escapeHtml(data.recipientName);
    const safeClient = escapeHtml(data.clientName);
    const safeProfessional = escapeHtml(data.professionalName);
    const safeAnimal = escapeHtml(data.animalName);
    const safeService = escapeHtml(data.serviceName);
    const safeDateTime = escapeHtml(dateTime);
    const details = [
      `Agendamento: ${data.appointmentId}`,
      `Pet: ${data.animalName}`,
      `Serviço: ${data.serviceName}`,
      `Profissional: ${data.professionalName}`,
      `Cliente: ${data.clientName}`,
      `Data e horário: ${dateTime}`,
      `Duração: ${data.durationMinutes} minutos`,
    ];
    const textBody = [
      `Olá, ${data.recipientName}!`,
      "",
      eventContent.message,
      "",
      ...details,
      "",
      "Estética PetDogs",
    ];
    const htmlBody = emailLayout(
      eventContent.message,
      eventContent.title,
      `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Olá, <strong>${safeName}</strong>! ${eventContent.message}</p>
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;background:#f7faf8;border:1px solid #e0eae2;border-radius:8px;">
         <tr><td style="padding:16px 18px 6px;color:#61736b;font-size:12px;text-transform:uppercase;">Pet</td></tr>
         <tr><td style="padding:0 18px 14px;color:#18352f;font-size:15px;">${safeAnimal}</td></tr>
         <tr><td style="padding:12px 18px 6px;border-top:1px solid #e0eae2;color:#61736b;font-size:12px;text-transform:uppercase;">Serviço</td></tr>
         <tr><td style="padding:0 18px 14px;color:#18352f;font-size:15px;">${safeService} · ${data.durationMinutes} min</td></tr>
         <tr><td style="padding:12px 18px 6px;border-top:1px solid #e0eae2;color:#61736b;font-size:12px;text-transform:uppercase;">Data e horário</td></tr>
         <tr><td style="padding:0 18px 14px;color:#18352f;font-size:15px;">${safeDateTime}</td></tr>
         <tr><td style="padding:12px 18px 6px;border-top:1px solid #e0eae2;color:#61736b;font-size:12px;text-transform:uppercase;">Profissional</td></tr>
         <tr><td style="padding:0 18px 14px;color:#18352f;font-size:15px;">${safeProfessional}</td></tr>
         <tr><td style="padding:12px 18px 6px;border-top:1px solid #e0eae2;color:#61736b;font-size:12px;text-transform:uppercase;">Cliente</td></tr>
         <tr><td style="padding:0 18px 16px;color:#18352f;font-size:15px;">${safeClient}</td></tr>
       </table>
       <p style="margin:0;font-size:12px;color:#61736b;">Código do agendamento: ${escapeHtml(data.appointmentId)}</p>`,
    );
    await this.sendMessage(
      data.email,
      `${eventContent.subject} | Estética PetDogs`,
      textBody,
      htmlBody,
    );
  }
}

export default new EmailService();
