# Confirmar e-mail no primeiro cadastro

Este fluxo é para o cadastro público de clientes. O usuário não recebe sessão nem acessa áreas autenticadas até confirmar o endereço de e-mail.

API base local: `http://localhost:3001/api/v1`.

## Fluxo de telas

1. **Criar conta:** capture nome, e-mail, senha e campos opcionais; envie `POST /auth/register`.
2. **Confirmar e-mail:** após `201`, mostre a tela de código. Não armazene nem use JWT porque o cadastro ainda não recebe sessão.
3. **Concluir:** envie e-mail e código a `POST /auth/verify-email`. Só após `200` armazene o token retornado e direcione para o app.
4. Se o código não chegar, ofereça “Reenviar código” usando `POST /auth/resend-email-verification`.

## Criar conta

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Ana Silva",
  "email": "ana@example.com",
  "password": "senha-segura-123",
  "telefone": "11999990000"
}
```

Resposta `201`:

```json
{
  "message": "Cadastro criado. Enviamos um código para confirmar seu e-mail.",
  "email": "ana@example.com",
  "requiresEmailVerification": true
}
```

## Confirmar código

```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "ana@example.com",
  "code": "123456"
}
```

O `200` confirma o e-mail e retorna `{ message, user, token }`. Armazene o token e inicie a sessão somente nessa etapa.

## Reenviar código

```http
POST /api/v1/auth/resend-email-verification
Content-Type: application/json

{
  "email": "ana@example.com"
}
```

A resposta é genérica mesmo se não existir cadastro pendente; mostre a mensagem e permita que a pessoa confira a caixa de entrada e spam. Um novo código invalida o anterior.

## Estados e validações

- Código: 6 dígitos, válido por 10 minutos, uso único e até 5 tentativas.
- Código incorreto ou expirado: `400`; permaneça na tela de confirmação e permita solicitar outro.
- E-mail já cadastrado: `409`. Se a pessoa iniciou cadastro mas não confirmou, ofereça reenvio em vez de repetir o cadastro.
- Login antes de confirmar, mesmo com senha correta: `403` com `code: "EMAIL_VERIFICATION_REQUIRED"`; encaminhe para a confirmação.
- E-mail/senha inválidos no cadastro: `400`; limite por IP excedido: `429`.
- As chamadas de cadastro, confirmação e reenvio não exigem JWT; há limite de 10 chamadas por IP a cada 15 minutos.

Se o SMTP falhar, a conta fica pendente e o backend registra o erro; o frontend deve manter a opção de reenvio. Não envie o código em logs, analytics ou parâmetros de URL.
