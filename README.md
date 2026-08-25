# PetDogs Estética Backend

## Projeto

Backend REST para uma estética pet. A API permite autenticar usuários, gerenciar clientes, profissionais, pets, serviços, agendamentos e relatórios simples.

## Tecnologias

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT implementado com `crypto`
- CORS

## Estrutura

```text
src/
├── app/              # Configuração do Express e Swagger
├── config/           # Configuração de banco de dados
├── controllers/      # Entrada HTTP: lê request, chama service e responde
├── models/           # Schemas Mongoose e tipos
├── routes/           # Rotas da API
├── services/         # Regras de negócio
└── server.ts         # Inicialização da aplicação
```

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` com as variáveis realmente usadas pela aplicação:

```env
MONGO_URI=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=
OTP_VERIFICATION_SECRET=
FRONTEND_URL=
PORT=
```

Observações:

- `MONGO_URI` é obrigatória para conectar ao MongoDB.
- `JWT_SECRET` deve ser definido em produção.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` configuram o login administrativo.
- `ONESIGNAL_APP_ID` e `ONESIGNAL_API_KEY` identificam a aplicação e autorizam o envio transacional de OTP por e-mail. A chave deve existir somente no backend.
- `OTP_VERIFICATION_SECRET` assina a comprovação temporária exigida pelo cadastro e deve ter pelo menos 32 caracteres.
- `FRONTEND_URL` controla a origem aceita pelo CORS; quando não informado, usa `http://localhost:5173`.
- `PORT` define a porta HTTP; quando não informado, usa `3000`.
- `PASSWORD_RESET_WEBHOOK` recebe, por POST servidor-a-servidor, o e-mail e token de recuperação; o token nunca é devolvido pela API pública.
- A aplicação recusa iniciar sem banco, segredos JWT/OTP, credenciais administrativas e configuração OneSignal; os segredos devem ter 32 caracteres e a senha administrativa, 12.

## Executar

Desenvolvimento:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Produção após o build:

```bash
npm start
```

Testes existentes:

```bash
npm test
```

> Atualmente o script de teste executa o build TypeScript.

## Banco de dados

O projeto usa MongoDB via Mongoose e não possui migrations versionadas. Configure `MONGO_URI` apontando para a base desejada e inicie a aplicação; os schemas são registrados automaticamente pelos models.

## Swagger

A documentação OpenAPI fica disponível em:

```text
/api/docs
```

O JSON OpenAPI fica disponível em:

```text
/api/docs/openapi.json
```

## Rotas principais

Todas as rotas da API ficam sob `/api/v1`, exceto a documentação Swagger em `/api/docs`.

- `GET /api/v1/health`
- `/api/v1/auth`
- `/api/v1/clientes`
- `/api/v1/pets` e alias `/api/v1/animais`
- `/api/v1/servicos`
- `/api/v1/profissionais`
- `/api/v1/agendamentos`
- `/api/v1/relatorios`
