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
├── middlewares/      # Autenticação, autorização e tratamento central de erros
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
UPLOAD_DIR=./uploads
```

Observações:

- `MONGO_URI` é obrigatória para conectar ao MongoDB.
- `JWT_SECRET` deve ser definido em produção.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` configuram o login administrativo.
- `ONESIGNAL_APP_ID` e `ONESIGNAL_API_KEY` identificam a aplicação e autorizam o envio transacional de OTP por e-mail. A chave deve existir somente no backend.
- `OTP_VERIFICATION_SECRET` assina a comprovação temporária exigida pelo cadastro e deve ter pelo menos 32 caracteres.
- `FRONTEND_URL` controla a origem aceita pelo CORS; quando não informado, usa `http://localhost:5173`.
- `PORT` define a porta HTTP; quando não informado, usa `3000`.
- `UPLOAD_DIR` é obrigatório e define o diretório local onde as imagens serão armazenadas.
- `PASSWORD_RESET_WEBHOOK` recebe, por POST servidor-a-servidor, o e-mail e token de recuperação; o token nunca é devolvido pela API pública.
- A aplicação recusa iniciar sem banco, segredos JWT/OTP, credenciais administrativas e configuração OneSignal; os segredos devem ter 32 caracteres e a senha administrativa, 12.

## Executar

## Upload de imagens

Envie o conteúdo binário da imagem para `POST /api/v1/uploads`, autenticado, com
`Content-Type: image/jpeg`, `image/png`, `image/webp` ou `image/gif`. A resposta
contém somente o caminho (por exemplo, `/uploads/<uuid>.jpg`), que deve ser usado
no campo `foto` ao criar ou atualizar um cadastro. As imagens podem ser recuperadas
por `GET /uploads/<uuid>.<ext>` e o MongoDB armazena apenas esse caminho.

Para manter compatibilidade com o frontend existente, o campo `foto` também aceita
o mesmo data URL Base64 já utilizado anteriormente. O backend salva esse conteúdo
automaticamente em `UPLOAD_DIR` e substitui o Base64 pelo caminho antes de gravar
o documento no MongoDB; portanto, nenhuma alteração no frontend é necessária.

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

No Swagger, use o botão **Authorize** para informar o token JWT no formato Bearer.

## Autenticação

A autenticação usa token JWT assinado com `JWT_SECRET`. Após login ou cadastro, a API retorna um token que deve ser enviado no header:

```text
Authorization: Bearer <token>
```

## Estrutura de autorização

```text
Authentication
→ identifica quem é o usuário pelo token JWT

Authorization
→ verifica se o papel do usuário permite executar a ação
```

Papéis usados pela API:

- `admin`: gerencia clientes, profissionais e serviços.
- `profissional`: acessa seus agendamentos e atualiza o próprio perfil.
- `cliente`: gerencia seus pets, perfil e agendamentos.

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
