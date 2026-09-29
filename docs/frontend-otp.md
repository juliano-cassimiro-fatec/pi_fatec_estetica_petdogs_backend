# Recuperação de senha com OTP no frontend

Este guia descreve a integração da tela de recuperação com a API PetDogs. A API base local é `http://localhost:3001/api/v1`; em produção, use a URL HTTPS configurada para o backend.

## Fluxo

1. **Esqueci minha senha:** a pessoa informa o e-mail.
2. O frontend envia `POST /auth/forgot-password` com `{ "email": "pessoa@exemplo.com" }`.
3. Mostre a resposta genérica e avance para a tela exclusiva de validação do código. A mesma resposta é usada quando o e-mail não existe, para não revelar contas cadastradas.
4. **Validar código:** a pessoa informa somente o OTP de 6 dígitos. Não mostre campos de senha nesta tela.
5. O frontend envia `POST /auth/verify-reset-code` com o e-mail e o código. Em sucesso, guarde `resetToken` apenas no estado em memória e avance para a tela de nova senha.
6. **Nova senha:** mostre somente os campos da senha e confirmação. Envie `POST /auth/reset-password` com `resetToken` e `password`.
7. Em caso de sucesso, confirme a redefinição e ofereça retorno ao login. Sessões anteriores são invalidadas.

## Chamadas HTTP

Solicitar código:

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "pessoa@exemplo.com"
}
```

Resposta `200`:

```json
{
  "message": "Se o e-mail estiver cadastrado, enviaremos um código para redefinição."
}
```

Validar o OTP (tela de código):

```http
POST /api/v1/auth/verify-reset-code
Content-Type: application/json

{
  "email": "pessoa@exemplo.com",
  "code": "123456"
}
```

Resposta `200`, usada para liberar a tela seguinte:

```json
{
  "resetToken": "token-temporario-retornado-pela-api"
}
```

Redefinir senha (tela seguinte):

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "resetToken": "token-temporario-retornado-pela-api",
  "password": "nova-senha-segura"
}
```

Resposta `200`:

```json
{
  "message": "Senha redefinida com sucesso"
}
```

## Estados para a interface

- Código inválido, expirado, já utilizado ou após 5 tentativas: `400` com `Código inválido ou expirado`; permaneça na tela de código.
- Token temporário inválido ou expirado: `400`; solicite um novo código.
- E-mail ou senha inválidos: `400`.
- Limite excedido: `429`; mantenha a tela e informe que a pessoa tente novamente mais tarde.
- Código e token temporário expiram 10 minutos após a solicitação; o código só pode ser validado uma vez.
- Solicitar outro código invalida o anterior; mantenha o e-mail informado para a etapa de confirmação.
- Os endpoints de recuperação não exigem JWT. Não envie tokens de sessão nessas chamadas; `resetToken` é temporário e deve ficar somente em memória até concluir ou abandonar o fluxo.

O limite atual de autenticação é de 10 chamadas por IP a cada 15 minutos. Não registre OTP nem senha em logs, analytics ou armazenamento persistente no navegador.

## Diagnóstico de e-mail

O backend só envia o código quando as variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM` (ou `SMTP_USER` como remetente) estão configuradas. A senha SMTP nunca deve ir para o frontend. O erro SMTP `535` significa que o servidor recusou a autenticação; para Gmail, configure uma App Password da conta com autenticação em duas etapas, não a senha normal da conta. Consulte a seção de variáveis de ambiente e Troubleshooting no README principal.
