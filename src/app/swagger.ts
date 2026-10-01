import type { Express, Request, Response } from "express";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Estética PetDogs API",
    version: "1.0.0",
    description: "API para cadastro de clientes, profissionais, pets, serviços e agendamentos.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string" }, password: { type: "string" } },
      },
      ChangePassword: {
        type: "object",
        required: ["password"],
        properties: { password: { type: "string", minLength: 8 } },
      },
      Register: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
          telefone: { type: "string" },
          foto: { type: "string" },
        },
      },
      VerifyEmail: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: { type: "string", format: "email" },
          code: { type: "string", pattern: "^\\d{6}$" },
        },
      },
      ResendEmailVerification: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      Cliente: {
        type: "object",
        description: "A propriedade foto recebe o caminho retornado por POST /uploads.",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          telefone: { type: "string" },
          foto: { type: "string" },
          role: { type: "string", enum: ["cliente"] },
        },
      },
      Profissional: {
        type: "object",
        description: "A propriedade foto recebe o caminho retornado por POST /uploads.",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          especialidade: { type: "string" },
          dias_trabalho: { type: "array", items: { type: "number" } },
          horario_inicio: { type: "string" },
          horario_fim: { type: "string" },
          role: { type: "string", enum: ["profissional"] },
        },
      },
      ProfissionalInput: {
        type: "object",
        required: ["name", "email", "password", "especialidade"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          telefone: { type: "string" },
          foto: { type: "string", description: "Caminho retornado por POST /uploads." },
          especialidade: { type: "string" },
          dias_trabalho: {
            type: "array",
            description: "Dias JavaScript 0-6; também aceita 7 como domingo.",
            items: { type: "integer", minimum: 0, maximum: 7 },
          },
          horario_inicio: { type: "string", example: "08:00" },
          horario_fim: { type: "string", example: "18:00" },
          almoco_inicio: { type: "string", example: "12:00" },
          almoco_fim: { type: "string", example: "13:00" },
          disponibilidade_inicio: { type: "string", format: "date-time" },
          disponibilidade_fim: { type: "string", format: "date-time" },
        },
      },
      ProfissionalUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          telefone: { type: "string" },
          foto: { type: "string", description: "Caminho retornado por POST /uploads." },
          especialidade: { type: "string" },
          dias_trabalho: {
            type: "array",
            description: "Dias JavaScript 0-6; também aceita 7 como domingo.",
            items: { type: "integer", minimum: 0, maximum: 7 },
          },
          horario_inicio: { type: "string", example: "08:00" },
          horario_fim: { type: "string", example: "18:00" },
          almoco_inicio: { type: "string", example: "12:00" },
          almoco_fim: { type: "string", example: "13:00" },
          disponibilidade_inicio: { type: "string", format: "date-time" },
          disponibilidade_fim: { type: "string", format: "date-time" },
        },
      },
      Pet: {
        type: "object",
        description: "A propriedade foto recebe o caminho retornado por POST /uploads.",
        required: ["nome", "raca", "idade", "porte"],
        properties: {
          id: { type: "string" },
          nome: { type: "string" },
          raca: { type: "string" },
          idade: { type: "number" },
          porte: { type: "string", enum: ["pequeno", "medio", "grande"] },
          foto: { type: "string" },
          cliente: { type: "string" },
        },
      },
      PetUpdate: {
        type: "object",
        properties: {
          nome: { type: "string" },
          raca: { type: "string" },
          idade: { type: "integer", minimum: 0 },
          porte: { type: "string", enum: ["pequeno", "medio", "grande"] },
          foto: { type: "string", description: "Caminho retornado por POST /uploads." },
        },
      },
      ClienteUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          telefone: { type: "string" },
          foto: { type: "string", description: "Caminho retornado por POST /uploads." },
        },
      },
      Servico: {
        type: "object",
        required: ["name", "descricao", "duracao_min", "preco"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          descricao: { type: "string" },
          duracao_min: { type: "number" },
          preco: { type: "number" },
        },
      },
      ServicoInput: {
        type: "object",
        required: ["name", "descricao", "duracao_min", "preco"],
        properties: {
          name: { type: "string" },
          descricao: { type: "string" },
          duracao_min: { type: "integer", minimum: 1 },
          preco: { type: "number", minimum: 0 },
        },
      },
      ServicoUpdate: {
        type: "object",
        properties: {
          name: { type: "string" },
          descricao: { type: "string" },
          duracao_min: { type: "integer", minimum: 1 },
          preco: { type: "number", minimum: 0 },
        },
      },
      Agendamento: {
        type: "object",
        required: ["data_hora", "animal", "servico", "profissional"],
        properties: {
          id: { type: "string" },
          data_hora: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["agendado", "confirmado", "cancelado"] },
          animal: { type: "string" },
          servico: { type: "string" },
          profissional: { type: "string" },
          cliente: { type: "string" },
        },
      },
      AgendamentoInput: {
        type: "object",
        required: ["data_hora", "animal", "servico", "profissional"],
        properties: {
          data_hora: { type: "string", format: "date-time" },
          animal: { type: "string", description: "ID do pet." },
          servico: { type: "string", description: "ID do serviço." },
          profissional: { type: "string", description: "ID do profissional." },
        },
      },
      AgendamentoUpdate: {
        type: "object",
        properties: {
          data_hora: { type: "string", format: "date-time" },
          animal: { type: "string" },
          servico: { type: "string" },
          profissional: { type: "string" },
          status: { type: "string", enum: ["agendado", "confirmado", "cancelado"] },
        },
      },
      AvailabilitySlot: {
        type: "object",
        required: ["time", "datetime", "available"],
        properties: {
          time: { type: "string", example: "08:30" },
          datetime: { type: "string", format: "date-time" },
          available: { type: "boolean" },
        },
      },
      DailyAvailability: {
        type: "object",
        properties: {
          date: { type: "string", format: "date" },
          available: { type: "boolean" },
          slots: { type: "array", items: { $ref: "#/components/schemas/AvailabilitySlot" } },
          workingDays: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } },
          window: {
            type: "object",
            properties: { start: { type: "string" }, end: { type: "string" } },
          },
          duration_min: { type: "integer" },
        },
      },
      MonthlyAvailability: {
        type: "object",
        properties: {
          month: { type: "string", example: "2026-09" },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                available: { type: "boolean" },
                slotsCount: { type: "integer" },
                workingDay: { type: "boolean" },
              },
            },
          },
        },
      },
      Relatorio: {
        type: "object",
        properties: {
          total_clientes: { type: "number" },
          total_animais: { type: "number" },
          total_servicos: { type: "number" },
          total_cancelamentos: { type: "number" },
          total_faltas: { type: "number" },
        },
      },
      Error: {
        type: "object",
        description:
          "Data local do calendário em YYYY-MM-DD; não envie data-only convertida para UTC.",
        schema: { type: "string", format: "date", example: "2026-09-30" },
        message: { type: "string" },
        code: { type: "string" },
        responses: {
          "200": {
            description: "Slots da jornada; filtre slots pelo campo available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DailyAvailability" },
              },
            },
          },
          "400": { description: "Data ou parâmetros inválidos" },
          "401": { description: "Não autenticado" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Verifica se a API está online",
        responses: {
          "200": {
            description: "API online",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "API Rodando OK!!" } },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Inicia cadastro de cliente e envia código para confirmar o e-mail",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Register" } } },
        },
        responses: {
          "201": { description: "Cadastro pendente; ainda não retorna sessão" },
          "400": { description: "Dados inválidos" },
          "409": { description: "E-mail já cadastrado" },
          "429": { description: "Limite excedido" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        summary: "Confirma o e-mail com o OTP e inicia a sessão",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyEmail" },
            },
          },
        },
        responses: {
          "200": { description: "E-mail confirmado; retorna user e JWT" },
          "400": { description: "Código inválido ou expirado" },
          "429": { description: "Limite excedido" },
        },
      },
    },
    "/auth/resend-email-verification": {
      post: {
        summary: "Solicita reenvio do código de confirmação",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendEmailVerification" },
            },
          },
        },
        responses: {
          "200": { description: "Resposta genérica para cadastro pendente ou inexistente" },
          "400": { description: "E-mail inválido" },
          "429": { description: "Limite excedido" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Autentica usuário",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Login" } } },
        },
        responses: {
          "200": {
            description: "Login realizado; confira user.mustChangePassword antes de liberar o app",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        role: { type: "string", enum: ["admin", "cliente", "profissional"] },
                        mustChangePassword: { type: "boolean" },
                      },
                    },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { description: "Credenciais inválidas" },
          "403": { description: "E-mail não confirmado (EMAIL_VERIFICATION_REQUIRED)" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Retorna usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuário atual, incluindo mustChangePassword",
          },
          "401": { description: "Token inválido ou ausente" },
        },
      },
    },
    "/auth/change-password": {
      post: {
        summary: "Altera a senha provisória ou atual do usuário autenticado",
        description:
          "A troca é obrigatória para contas criadas pelo administrador. Após a troca, retorna uma nova sessão e invalida tokens anteriores.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePassword" },
            },
          },
        },
        responses: {
          "200": { description: "Senha alterada e sessão renovada" },
          "400": {
            description: "Senha inválida, menor que 8 caracteres ou igual à senha provisória",
          },
          "401": { description: "Sessão inválida" },
          "403": { description: "Administrador usa credenciais configuradas no ambiente" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Envia código OTP de recuperação sem revelar se a conta existe",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Solicitação processada" },
          "400": { description: "E-mail inválido" },
          "429": { description: "Limite excedido" },
        },
      },
    },
    "/auth/verify-reset-code": {
      post: {
        summary: "Valida OTP de recuperação e autoriza a próxima etapa",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string", pattern: "^\\d{6}$" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "OTP validado; retorna resetToken temporário" },
          "400": { description: "Código inválido ou expirado" },
          "429": { description: "Limite excedido" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Redefine senha usando autorização temporária após validar o OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["resetToken", "password"],
                properties: {
                  resetToken: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Senha redefinida" },
          "400": { description: "Token temporário inválido/expirado ou senha inválida" },
        },
      },
    },
    "/admin/users": {
      get: {
        summary: "Lista clientes e profissionais (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Usuários ativos" },
          "401": { description: "Token inválido ou ausente" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/clientes": {
      get: {
        summary: "Lista clientes (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Clientes" },
          "401": { description: "Não autenticado" },
          "403": { description: "Acesso negado" },
        },
      },
      post: {
        summary:
          "Cria cliente (admin), exige troca de senha no primeiro acesso e notifica por e-mail",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Register" } } },
        },
        responses: {
          "201": { description: "Cliente criado" },
          "400": { description: "Dados inválidos" },
          "409": { description: "E-mail já cadastrado" },
        },
      },
    },
    "/clientes/me": {
      get: {
        summary: "Busca perfil do cliente autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cliente" },
          "401": { description: "Não autenticado" },
          "403": { description: "Acesso negado" },
        },
      },
      put: {
        summary: "Atualiza perfil do cliente autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ClienteUpdate" } },
          },
        },
        responses: {
          "200": { description: "Cliente atualizado" },
          "400": { description: "Dados inválidos" },
          "401": { description: "Não autenticado" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/clientes/{id}": {
      get: {
        summary: "Busca cliente por id (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Cliente" } },
      },
      put: {
        summary: "Atualiza cliente (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ClienteUpdate" } },
          },
        },
        responses: {
          "200": { description: "Cliente atualizado" },
          "400": { description: "Dados inválidos" },
          "403": { description: "Acesso negado" },
        },
      },
      delete: {
        summary: "Desativa cliente (soft delete, admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Cliente removido" } },
      },
    },
    "/pets": {
      get: {
        summary: "Lista pets do usuário ou todos para admin",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Pets" } },
      },
      post: {
        summary: "Cria pet",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } },
        },
        responses: { "201": { description: "Pet criado" } },
      },
    },
    "/pets/{id}": {
      get: {
        summary: "Busca pet",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Pet" } },
      },
      put: {
        summary: "Atualiza pet",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PetUpdate" } },
          },
        },
        responses: { "200": { description: "Pet atualizado" } },
      },
      delete: {
        summary: "Remove pet",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Pet removido" } },
      },
    },
    "/animais": { $ref: "#/paths/~1pets" },
    "/animais/{id}": { $ref: "#/paths/~1pets~1{id}" },
    "/servicos": {
      get: { summary: "Lista serviços", responses: { "200": { description: "Serviços" } } },
      post: {
        summary: "Cria serviço (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ServicoInput" } },
          },
        },
        responses: {
          "201": { description: "Serviço criado" },
          "400": { description: "Dados inválidos" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/servicos/{id}": {
      get: {
        summary: "Busca serviço",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Serviço" } },
      },
      put: {
        summary: "Atualiza serviço (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ServicoUpdate" } },
          },
        },
        responses: {
          "200": { description: "Serviço atualizado" },
          "403": { description: "Acesso negado" },
        },
      },
      delete: {
        summary: "Remove serviço (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Serviço removido" } },
      },
    },
    "/profissionais": {
      get: {
        summary: "Lista profissionais",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profissionais" } },
      },
      post: {
        summary:
          "Cria profissional (admin), exige troca de senha no primeiro acesso e notifica por e-mail",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ProfissionalInput" } },
          },
        },
        responses: {
          "201": { description: "Profissional criado" },
          "400": { description: "Dados inválidos" },
          "409": { description: "E-mail já cadastrado" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/profissionais/me": {
      put: {
        summary: "Atualiza perfil do profissional autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ProfissionalUpdate" } },
          },
        },
        responses: {
          "200": { description: "Profissional atualizado" },
          "400": { description: "Dados inválidos" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/profissionais/{id}": {
      get: {
        summary: "Busca profissional",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Profissional" } },
      },
      put: {
        summary: "Atualiza profissional (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ProfissionalUpdate" } },
          },
        },
        responses: {
          "200": { description: "Profissional atualizado" },
          "403": { description: "Acesso negado" },
        },
      },
      delete: {
        summary: "Remove profissional (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Profissional removido" } },
      },
    },
    "/agendamentos": {
      get: {
        summary: "Lista agendamentos conforme papel",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Agendamentos" } },
      },
      post: {
        summary: "Cria agendamento para o cliente autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AgendamentoInput" } },
          },
        },
        responses: {
          "201": { description: "Agendamento criado" },
          "400": { description: "Dados ou horário inválidos" },
          "403": { description: "Acesso negado" },
          "409": { description: "Horário indisponível" },
        },
      },
    },
    "/agendamentos/disponibilidade": {
      get: {
        summary: "Consulta horários disponíveis",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "profissionalId",
            in: "query",
            required: true,
            description: "Também aceito como profissional.",
            schema: { type: "string" },
          },
          {
            name: "servicoId",
            in: "query",
            required: true,
            description: "Também aceito como servico.",
            schema: { type: "string" },
          },
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Disponibilidade" } },
      },
    },
    "/agendamentos/disponibilidade/mes": {
      get: {
        summary: "Consulta disponibilidade mensal",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "profissionalId", in: "query", required: true, schema: { type: "string" } },
          { name: "servicoId", in: "query", required: true, schema: { type: "string" } },
          {
            name: "month",
            in: "query",
            required: true,
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2026-08" },
          },
        ],
        responses: {
          "200": {
            description: "Dias locais do mês e contagem de horários livres",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MonthlyAvailability" },
              },
            },
          },
          "400": { description: "Mês ou parâmetros inválidos" },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/agendamentos/{id}": {
      put: {
        summary: "Atualiza agendamento permitido ao usuário",
        description:
          "Admin ou profissional pode confirmar com status=confirmado. A confirmação e o cancelamento enviam notificações para cliente e profissional.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AgendamentoUpdate" } },
          },
        },
        responses: {
          "200": { description: "Agendamento atualizado" },
          "400": { description: "Dados inválidos" },
          "403": { description: "Acesso negado" },
          "409": { description: "Horário indisponível" },
        },
      },
      delete: {
        summary: "Cancela agendamento",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Agendamento cancelado" } },
      },
    },
    "/agendamentos/{id}/cancel": {
      patch: {
        summary: "Cancela agendamento",
        description: "Envia e-mail de cancelamento para cliente e profissional.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Agendamento cancelado" } },
      },
    },
    "/relatorios": {
      get: {
        summary: "Calcula indicadores atuais (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Indicadores calculados" },
          "403": { description: "Acesso negado" },
        },
      },
    },
    "/uploads": {
      post: {
        summary: "Envia uma imagem",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "image/jpeg": { schema: { type: "string", format: "binary" } },
            "image/png": { schema: { type: "string", format: "binary" } },
            "image/webp": { schema: { type: "string", format: "binary" } },
            "image/gif": { schema: { type: "string", format: "binary" } },
            "application/json": {
              schema: {
                type: "object",
                required: ["base64", "contentType"],
                properties: {
                  base64: { type: "string" },
                  contentType: { type: "string", example: "image/png" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Imagem salva e URL pública retornada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    caminho: { type: "string", example: "/uploads/uuid.png" },
                    nome: { type: "string", example: "uuid.png" },
                    tipo: { type: "string", example: "image/png" },
                    url: {
                      type: "string",
                      format: "uri",
                      example: "http://localhost:3001/uploads/uuid.png",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Arquivo ausente ou inválido" },
          "401": { description: "Não autenticado" },
          "413": { description: "Imagem excede 5 MB" },
          "415": { description: "Formato não suportado" },
        },
      },
    },
  },
};

const swaggerHtml = `<!doctype html><html><head><title>Estética PetDogs API Docs</title><meta charset="utf-8"><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/api/docs/openapi.json',dom_id:'#swagger-ui',persistAuthorization:true});</script></body></html>`;

export function setupSwagger(app: Express): void {
  app.get("/api/docs/openapi.json", (_req: Request, res: Response) => res.json(openApiDocument));
  app.get("/api/docs", (_req: Request, res: Response) => res.type("html").send(swaggerHtml));
}
