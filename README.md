# PetDogs — API de Estética Pet

API REST do sistema PetDogs para clientes, profissionais, pets, serviços e agendamentos. Este repositório contém **somente o backend**; não há uma aplicação React, telas, React Router, AuthContext, cliente HTTP ou configuração Cypress versionados nele. A API expõe os endpoints necessários para que o frontend os integre.

## Tecnologias e estrutura

- Node.js, Express 5 e TypeScript;
- MongoDB com Mongoose;
- JWT HS256 assinado com segredo de ambiente;
- `crypto.scrypt` para hashes de senha e SMTP seguro (STARTTLS) nativo do Node.js para e-mail.

```text
src/app/            Express, CORS e documentação OpenAPI
src/config/         ambiente, MongoDB e uploads
src/controllers/    adaptadores HTTP
src/services/       regras de negócio, autenticação e SMTP
src/models/         schemas Mongoose
src/middlewares/    autenticação, autorização, rate limit e erros
src/routes/         endpoints /api/v1
```

## Pré-requisitos

- Node.js 20+ e npm;
- MongoDB 7+ local ou um cluster MongoDB Atlas acessível;
- para recuperação de senha real, uma conta Gmail com autenticação em duas etapas e uma **App Password** (ou outro servidor SMTP compatível).

## Configuração e execução do backend

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o exemplo e preencha os valores locais, sem versionar o arquivo:

   ```bash
   cp .env.example .env
   ```

3. Inicie o MongoDB local e mantenha `MONGO_URI=mongodb://localhost:27017/petdogs`, ou substitua por uma URI Atlas. A API registra `Connected to MongoDB` ao conectar.
4. Inicie em desenvolvimento:

   ```bash
   npm run dev
   ```

O valor padrão de `PORT` é **3001**, portanto a API está em `http://localhost:3001` e a documentação interativa em `http://localhost:3001/api/docs`. Para executar a compilação gerada, use `npm run build` e depois `npm start`.

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example); `.env` está ignorado pelo Git.

| Variável                                      | Uso                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `PORT`                                        | Porta HTTP da API (3001 no exemplo).                                                |
| `MONGO_URI`                                   | URI do banco MongoDB.                                                               |
| `JWT_SECRET`                                  | Segredo aleatório de ao menos 32 caracteres para assinatura.                        |
| `JWT_EXPIRES_IN`                              | Duração do access token: `15m`, `1h` ou `7d`.                                       |
| `JWT_ISSUER` / `JWT_AUDIENCE`                 | Claims validadas em todo JWT.                                                       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Administrador configurado pelo ambiente. A senha deve ter 12+ caracteres.           |
| `FRONTEND_URL`                                | Origem CORS permitida e base do link `/reset-password`.                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`       | Servidor SMTP; Gmail usa `smtp.gmail.com`, `587`, `false`.                          |
| `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`     | Conta SMTP, App Password e remetente. Nunca exponha esses dados ao frontend ou Git. |
| `UPLOAD_DIR`                                  | Diretório de imagens carregadas.                                                    |

Para Gmail, crie uma App Password na conta Google com 2FA habilitado e use-a em `SMTP_PASSWORD`; a senha normal da conta não deve ser usada. O envio usa STARTTLS e `AUTH PLAIN` somente após a conexão TLS. Sem SMTP configurado, a solicitação de recuperação continua respondendo de forma genérica, mas nenhum e-mail é entregue.

## Como o frontend se conecta

O frontend não faz parte deste repositório. Quando ele estiver disponível, configure a URL da API como `http://localhost:3001/api/v1`, defina `FRONTEND_URL` com a origem efetiva (por exemplo, `http://localhost:5173`) e envie `Authorization: Bearer <token>` apenas nas rotas protegidas. O CORS permite apenas essa origem, não `*`.

Fluxo esperado no frontend: cadastro/login → armazenar sessão de modo consciente (o projeto não fornece uma política de storage) → interceptor/wrapper adiciona o Bearer token → recebe `401` e limpa a sessão → logout remove token e estado. As telas de login, cadastro, recuperação e rotas protegidas devem ser implementadas no repositório React correspondente, sem expor `JWT_SECRET` ou SMTP.

## Autenticação, autorização e recuperação

- `POST /api/v1/auth/register` normaliza e valida e-mail, exige senha de 8 caracteres, cria um cliente e retorna a sessão sem `senha`/hash.
- `POST /api/v1/auth/login` autentica cliente, profissional ou administrador de ambiente e retorna `{ user, token }`.
- O JWT contém somente `sub`, `role`, versão da sessão, emissor, público, emissão e expiração. A cada requisição, o middleware valida assinatura, expiração, issuer/audience e consulta o usuário; não confia em dados fornecidos pelo cliente.
- O middleware `ensureRoles` aplica RBAC. Por exemplo, `GET /api/v1/admin/users`, `/clientes` e `/relatorios` são exclusivos de `admin`; usuário autenticado sem papel retorna `403`, enquanto token ausente/inválido retorna `401`.
- `POST /api/v1/auth/forgot-password` devolve a mesma mensagem para e-mails existentes ou não. Um token aleatório de 32 bytes é hasheado com SHA-256 e gravado em `PasswordResetToken`, com TTL de 30 minutos e uso único.
- `POST /api/v1/auth/reset-password` reivindica o token atomicamente, faz novo hash scrypt e incrementa a versão de sessão, invalidando JWTs anteriores daquele usuário.
- Login, cadastro, esqueci senha e redefinição usam limite em memória de 10 requisições por IP a cada 15 minutos. Em implantação com múltiplas instâncias, substitua-o por um rate limiter compartilhado (Redis, por exemplo).

## Endpoints principais

Base: `http://localhost:3001/api/v1`.

| Método e caminho             | Autenticação | Corpo / resultado                                                                                                              |
| ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `POST /auth/register`        | Não          | `{ "name", "email", "password", "telefone?", "foto?" }`; `201` com mensagem, usuário seguro e JWT. Erros: `400`, `409`, `429`. |
| `POST /auth/login`           | Não          | `{ "email", "password" }`; `200` com usuário seguro e JWT. Erros: `400`, `401`, `429`.                                         |
| `GET /auth/me`               | Bearer       | Usuário da sessão; `401` para token ausente, inválido ou expirado.                                                             |
| `POST /auth/forgot-password` | Não          | `{ "email" }`; sempre `200` com mensagem genérica. Erros: `400`, `429`.                                                        |
| `POST /auth/reset-password`  | Não          | `{ "token", "password" }`; `200` após redefinir. Erros: `400`, `429`.                                                          |
| `GET /admin/users`           | Bearer admin | Clientes ativos e profissionais sem hashes. Erros: `401`, `403`.                                                               |

As demais rotas de pets, serviços, agendamentos, profissionais, clientes, relatórios e uploads seguem o mesmo prefixo e estão em `/api/docs`.

## Testes e verificações

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

Os testes unitários disponíveis verificam que a senha não é persistida em texto puro e que a política mínima de senha é aplicada. Não há testes de integração MongoDB nem Cypress no estado original do repositório, e não foi adicionada uma suíte Cypress artificial porque não existe frontend/endereço de aplicação web neste repositório. Para validar e-mail real, configure SMTP e execute o fluxo contra uma caixa de teste; credenciais Gmail não são fornecidas nem podem ser testadas no repositório.

## Teste manual

1. Faça `POST /auth/register` com um e-mail novo e confirme que a resposta não possui `senha`.
2. Faça `POST /auth/login`, copie o `token` e chame `GET /auth/me` com `Authorization: Bearer <token>`.
3. Com um token de cliente, chame `GET /admin/users` e confirme `403`; sem token, confirme `401`.
4. Faça login com `ADMIN_EMAIL`/`ADMIN_PASSWORD` e chame `GET /admin/users` para confirmar `200`.
5. Faça `POST /auth/forgot-password`; para uma conta existente verifique a caixa SMTP, abra o link e envie seu token e nova senha a `POST /auth/reset-password`.
6. Confirme que a senha antiga falha, a nova senha autentica e o token anterior passa a retornar `401`.

## Troubleshooting

- **Frontend não conecta / CORS:** confira a origem exata em `FRONTEND_URL`, reinicie a API e use o prefixo `/api/v1`.
- **MongoDB não conecta:** inicie `mongod`, verifique host/porta/banco em `MONGO_URI` e, no Atlas, libere o IP e crie usuário de banco.
- **Variáveis não carregam:** garanta que `.env` está na raiz e que todas as variáveis obrigatórias do exemplo foram preenchidas; `JWT_SECRET` precisa ter 32+ caracteres.
- **Porta ocupada:** altere `PORT` no `.env` e use a nova porta no frontend.
- **Gmail não envia:** use App Password, `SMTP_HOST=smtp.gmail.com`, porta `587`, `SMTP_SECURE=false` e confira bloqueios/restrições da conta.
- **401:** token ausente, expirado, issuer/audience incorretos ou sessão invalidada após reset. Faça login novamente.
- **403:** o token é válido, mas o papel não possui permissão; use uma conta admin para recursos administrativos.
