# Recuperação de senha com OTP no frontend

Este guia descreve a integração da tela de recuperação com a API PetDogs. A API base local é `http://localhost:3001/api/v1`; em produção, use a URL HTTPS configurada para o backend.

## Fluxo

1. A pessoa informa o e-mail na tela “Esqueci minha senha”.
2. O frontend envia `POST /auth/forgot-password` com `{ "email": "pessoa@exemplo.com" }`.
3. Mostre a resposta genérica e avance para a etapa de código. A mesma resposta é usada quando o e-mail não existe, para não revelar contas cadastradas.
4. A pessoa informa o código de 6 dígitos recebido por e-mail e a nova senha.
5. O frontend envia `POST /auth/reset-password` com `email`, `code` e `password`.
6. Em caso de sucesso, confirme a redefinição e ofereça retorno ao login. O usuário precisará entrar novamente porque sessões anteriores são invalidadas.

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

Redefinir senha:

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "email": "pessoa@exemplo.com",
  "code": "123456",
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

- Código inválido, expirado, já utilizado ou após 5 tentativas: `400` com `Código inválido ou expirado`.
- E-mail ou senha inválidos: `400`.
- Limite excedido: `429`; mantenha a tela e informe que a pessoa tente novamente mais tarde.
- Código válido: expira em 10 minutos e só pode ser usado uma vez.
- Solicitar outro código invalida o anterior; mantenha o e-mail informado para a etapa de confirmação.
- Os endpoints de recuperação não exigem JWT. Não envie tokens de sessão nessas chamadas.

O limite atual de autenticação é de 10 chamadas por IP a cada 15 minutos. Não registre OTP nem senha em logs, analytics ou armazenamento persistente no navegador.

## Diagnóstico de e-mail

O backend só envia o código quando as variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `MAIL_FROM` (ou `SMTP_USER` como remetente) estão configuradas. A senha SMTP nunca deve ir para o frontend. O erro SMTP `535` significa que o servidor recusou a autenticação; para Gmail, configure uma App Password da conta com autenticação em duas etapas, não a senha normal da conta. Consulte a seção de variáveis de ambiente e Troubleshooting no README principal.
