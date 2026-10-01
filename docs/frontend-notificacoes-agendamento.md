# Notificações de agendamento no frontend

A API envia e-mails HTML para cliente e profissional quando um agendamento é criado, confirmado ou cancelado. O frontend apenas chama os endpoints de agendamento; não deve enviar essas notificações diretamente.

API base local: `http://localhost:3001/api/v1`. Todas as rotas abaixo exigem `Authorization: Bearer <token>`.

## Criar

Após selecionar um horário, envie `POST /agendamentos`:

```http
POST /api/v1/agendamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "data_hora": "2026-10-08T13:30:00.000Z",
  "animal": "id-do-pet",
  "servico": "id-do-servico",
  "profissional": "id-do-profissional"
}
```

O backend cria o agendamento com status `agendado` e envia a notificação de criação para o cliente e o profissional. Atualize a tela usando o agendamento retornado.

## Confirmar

Admin ou profissional confirma um agendamento existente via `PUT /agendamentos/{id}`:

```http
PUT /api/v1/agendamentos/id-do-agendamento
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmado"
}
```

A API envia o e-mail de confirmação aos dois envolvidos e o horário continua indisponível para outros agendamentos. Cliente não pode confirmar; mostre essa ação somente para admin/profissional.

## Cancelar

Use `PATCH /agendamentos/{id}/cancel`:

```http
PATCH /api/v1/agendamentos/id-do-agendamento/cancel
Authorization: Bearer <token>
```

A API marca como `cancelado` e notifica cliente e profissional. A rota `DELETE /agendamentos/{id}` e a atualização de status para `cancelado` também fazem o cancelamento e notificam.

## Estados e interface

- `agendado`: solicitação criada; mostrar como pendente de confirmação.
- `confirmado`: confirmado por admin/profissional; continuar tratando o horário como ocupado.
- `cancelado`: cancelado; remover das ações de confirmação e liberar o horário.
- Recarregue/atualize a lista com a resposta da API após cada ação. Não envie uma notificação separada do frontend, para evitar e-mails duplicados.
- A criação, confirmação e cancelamento não falham se o SMTP estiver indisponível; o backend registra a falha e mantém a alteração salva. O usuário verá o estado atualizado mesmo se o e-mail não for entregue.

Os e-mails incluem cliente, profissional, pet, serviço, data/hora e duração. O assunto e o conteúdo variam conforme a transição.
