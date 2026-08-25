import type { Express, Request, Response } from "express"

export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "PetDogs Estética API",
        version: "1.0.0",
        description: "API para cadastro de clientes, profissionais, pets, serviços e agendamentos.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
        schemas: {
            Login: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } },
            Register: { type: "object", required: ["name", "email", "password", "verificationToken"], properties: { name: { type: "string" }, email: { type: "string" }, password: { type: "string" }, verificationToken: { type: "string" }, telefone: { type: "string" }, foto: { type: "string" } } },
            Cliente: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" }, telefone: { type: "string" }, foto: { type: "string" }, role: { type: "string", enum: ["cliente"] } } },
            Profissional: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" }, especialidade: { type: "string" }, dias_trabalho: { type: "array", items: { type: "number" } }, horario_inicio: { type: "string" }, horario_fim: { type: "string" }, role: { type: "string", enum: ["profissional"] } } },
            Pet: { type: "object", required: ["nome", "raca", "idade", "porte"], properties: { id: { type: "string" }, nome: { type: "string" }, raca: { type: "string" }, idade: { type: "number" }, porte: { type: "string", enum: ["pequeno", "medio", "grande"] }, foto: { type: "string" }, cliente: { type: "string" } } },
            Servico: { type: "object", required: ["name", "descricao", "duracao_min", "preco"], properties: { id: { type: "string" }, name: { type: "string" }, descricao: { type: "string" }, duracao_min: { type: "number" }, preco: { type: "number" } } },
            Agendamento: { type: "object", required: ["data_hora", "animal", "servico", "profissional"], properties: { id: { type: "string" }, data_hora: { type: "string", format: "date-time" }, status: { type: "string", enum: ["scheduled", "canceled"] }, animal: { type: "string" }, servico: { type: "string" }, profissional: { type: "string" }, cliente: { type: "string" } } },
            Relatorio: { type: "object", properties: { total_clientes: { type: "number" }, total_animais: { type: "number" }, total_servicos: { type: "number" }, total_cancelamentos: { type: "number" }, total_faltas: { type: "number" } } },
            Error: { type: "object", properties: { message: { type: "string" } } },
        },
    },
    paths: {
        "/health": { get: { summary: "Verifica se a API está online", responses: { "200": { description: "API online" } } } },
        "/auth/register": { post: { summary: "Cadastra cliente", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Register" } } } }, responses: { "201": { description: "Cliente cadastrado e token gerado" }, "400": { description: "Dados inválidos" } } } },
        "/auth/otp/send": { post: { summary: "Envia OTP de cadastro por e-mail", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } } }, responses: { "200": { description: "Código enviado" }, "502": { description: "Falha no provedor de e-mail" } } } },
        "/auth/otp/verify": { post: { summary: "Valida OTP e retorna comprovação temporária", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email", "codigo"], properties: { email: { type: "string", format: "email" }, codigo: { type: "string", pattern: "^[0-9]{6}$" } } } } } }, responses: { "200": { description: "E-mail verificado e token temporário emitido" }, "400": { description: "Código inválido ou expirado" } } } },
        "/auth/login": { post: { summary: "Autentica usuário", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } } }, responses: { "200": { description: "Login realizado" }, "401": { description: "Credenciais inválidas" } } } },
        "/auth/me": { get: { summary: "Retorna usuário autenticado", responses: { "200": { description: "Usuário atual" } } } },
        "/auth/forgot-password": { post: { summary: "Envia instruções de recuperação sem revelar se a conta existe", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } } }, responses: { "200": { description: "Solicitação processada" }, "400": { description: "E-mail inválido" } } } },
        "/auth/reset-password": { post: { summary: "Redefine senha com token", responses: { "200": { description: "Senha redefinida" }, "400": { description: "Token ou senha inválidos" } } } },
        "/clientes": { get: { summary: "Lista clientes (admin)", responses: { "200": { description: "Clientes" } } }, post: { summary: "Cria cliente (admin)", responses: { "201": { description: "Cliente criado" } } } },
        "/clientes/me": { get: { summary: "Busca perfil do cliente autenticado", responses: { "200": { description: "Cliente" } } }, put: { summary: "Atualiza perfil do cliente autenticado", responses: { "200": { description: "Cliente atualizado" } } } },
        "/clientes/{id}": { get: { summary: "Busca cliente por id (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Cliente" } } }, put: { summary: "Atualiza cliente (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Cliente atualizado" } } }, delete: { summary: "Remove cliente (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Cliente removido" } } } },
        "/pets": { get: { summary: "Lista pets do usuário ou todos para admin", responses: { "200": { description: "Pets" } } }, post: { summary: "Cria pet", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } }, responses: { "201": { description: "Pet criado" } } } },
        "/pets/{id}": { get: { summary: "Busca pet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Pet" } } }, put: { summary: "Atualiza pet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Pet atualizado" } } }, delete: { summary: "Remove pet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Pet removido" } } } },
        "/servicos": { get: { summary: "Lista serviços", responses: { "200": { description: "Serviços" } } }, post: { summary: "Cria serviço (admin)", responses: { "201": { description: "Serviço criado" } } } },
        "/servicos/{id}": { get: { summary: "Busca serviço", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Serviço" } } }, put: { summary: "Atualiza serviço (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Serviço atualizado" } } }, delete: { summary: "Remove serviço (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Serviço removido" } } } },
        "/profissionais": { get: { summary: "Lista profissionais", responses: { "200": { description: "Profissionais" } } }, post: { summary: "Cria profissional (admin)", responses: { "201": { description: "Profissional criado" } } } },
        "/profissionais/me": { put: { summary: "Atualiza perfil do profissional autenticado", responses: { "200": { description: "Profissional atualizado" } } } },
        "/profissionais/{id}": { get: { summary: "Busca profissional", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Profissional" } } }, put: { summary: "Atualiza profissional (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Profissional atualizado" } } }, delete: { summary: "Remove profissional (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Profissional removido" } } } },
        "/agendamentos": { get: { summary: "Lista agendamentos conforme papel", responses: { "200": { description: "Agendamentos" } } }, post: { summary: "Cria agendamento para o cliente autenticado", responses: { "201": { description: "Agendamento criado" } } } },
        "/agendamentos/disponibilidade": { get: { summary: "Consulta horários disponíveis", parameters: [{ name: "profissionalId", in: "query", schema: { type: "string" } }, { name: "servicoId", in: "query", schema: { type: "string" } }, { name: "date", in: "query", schema: { type: "string", format: "date-time" } }], responses: { "200": { description: "Disponibilidade" } } } },
        "/agendamentos/disponibilidade/mes": { get: { summary: "Consulta disponibilidade mensal", parameters: [{ name: "profissionalId", in: "query", schema: { type: "string" } }, { name: "servicoId", in: "query", schema: { type: "string" } }, { name: "month", in: "query", schema: { type: "string", example: "2026-08" } }], responses: { "200": { description: "Calendário mensal" } } } },
        "/agendamentos/{id}": { put: { summary: "Atualiza agendamento permitido ao usuário", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Agendamento atualizado" } } }, delete: { summary: "Cancela agendamento", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Agendamento cancelado" } } } },
        "/agendamentos/{id}/cancel": { patch: { summary: "Cancela agendamento", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Agendamento cancelado" } } } },
        "/relatorios": { get: { summary: "Calcula indicadores atuais (admin)", responses: { "200": { description: "Indicadores calculados" } } } },
    },
}

const swaggerHtml = `<!doctype html><html><head><title>PetDogs API Docs</title><meta charset="utf-8"><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/api/docs/openapi.json',dom_id:'#swagger-ui',persistAuthorization:true});</script></body></html>`

export function setupSwagger(app: Express): void {
    app.get("/api/docs/openapi.json", (_req: Request, res: Response) => res.json(openApiDocument))
    app.get("/api/docs", (_req: Request, res: Response) => res.type("html").send(swaggerHtml))
}
