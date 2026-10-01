# Correção da consulta de disponibilidade no frontend

Este guia cobre a seleção de dia e horário usando `GET /api/v1/agendamentos/disponibilidade` e `GET /api/v1/agendamentos/disponibilidade/mes`.

## Causa comum do dia sem horários

Não transforme uma data escolhida no calendário em `new Date("YYYY-MM-DD")` e depois envie `toISOString()`. O navegador interpreta a data sem horário como UTC; em fusos como `America/Sao_Paulo`, isso pode virar o dia anterior. Envie a data local como `YYYY-MM-DD`.

```ts
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

## Consultar horários do dia

Inclua os IDs do profissional e do serviço e a data local. As rotas de agendamento exigem `Authorization: Bearer <token>`.

```ts
const query = new URLSearchParams({
  profissionalId,
  servicoId,
  date: formatLocalDate(selectedDate),
});

const response = await fetch(`${API_URL}/agendamentos/disponibilidade?${query}`, {
  headers: { Authorization: `Bearer ${token}` },
});

const availability = await response.json();
const availableSlots = availability.slots.filter((slot: { available: boolean }) => slot.available);
```

Cada item de `slots` contém `time` (`HH:mm` local), `datetime` (ISO com offset UTC) e `available`. Exiba somente os itens com `available: true`. A API pode devolver slots indisponíveis junto com os disponíveis para representar a jornada completa. Mostre “Nenhum horário disponível nesta data. Escolha outro dia.” somente se `availableSlots` ficar vazio.

## Consultar calendário do mês

```http
GET /api/v1/agendamentos/disponibilidade/mes?profissionalId=<id>&servicoId=<id>&month=2026-09
Authorization: Bearer <token>
```

A resposta contém `days`; cada dia tem `date` (`YYYY-MM-DD` local), `available`, `slotsCount` e `workingDay`. Use `available` para habilitar a data e consulte a rota diária quando o usuário selecionar um dia. Não converta `date` para ISO antes de selecionar o horário.

## Configuração do profissional

Ao criar ou atualizar profissional, envie:

- `dias_trabalho`: números de 0 a 6 no padrão JavaScript (`0` domingo, `1` segunda, ..., `6` sábado); o backend também aceita `7` como domingo e normaliza para `0`.
- `horario_inicio` e `horario_fim`: strings `HH:mm`, por exemplo `08:30` e `17:30`.
- `almoco_inicio` e `almoco_fim`: ambos opcionais, mas devem ser enviados juntos, também como `HH:mm`.

Os índices usados no frontend devem ser enviados explicitamente; não use nomes de dias nem os números de 1 a 7 sem converter, pois isso desloca os dias da semana.

## Diagnóstico quando não houver horários

A disponibilidade será vazia quando o dia não estiver em `workingDays`, todos os horários já tiverem passado, os horários estiverem ocupados ou o serviço não couber dentro da jornada. A resposta diária inclui `workingDays`, `window` e `duration_min` para ajudar a exibir um estado correto. Confirme também que o `profissionalId` e o `servicoId` correspondem aos registros selecionados e que o serviço tem duração válida.

Se a resposta ainda mostrar um dia da semana inesperado, confirme o valor de `date` enviado na URL e o array `dias_trabalho` salvo para o profissional. O backend trata `YYYY-MM-DD` como data do calendário local e normaliza domingo `7` para `0`.
