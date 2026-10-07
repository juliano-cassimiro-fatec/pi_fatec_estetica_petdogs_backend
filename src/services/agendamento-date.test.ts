import assert from "node:assert/strict";
import test from "node:test";
import { formatCalendarDate, normalizeWorkingDays, parseCalendarDate } from "./agendamento-date.js";

test("mantém o dia de calendário ao interpretar YYYY-MM-DD", () => {
  const date = parseCalendarDate("2026-09-30");

  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 30);
  assert.equal(date.getDay(), 3);
  assert.equal(formatCalendarDate(date), "2026-09-30");
});

test("rejeita uma data de calendário inexistente", () => {
  assert.throws(() => parseCalendarDate("2026-02-30"), /Data inválida/);
});

test("normaliza domingo ISO para o índice JavaScript e preserva os dias únicos", () => {
  assert.deepEqual(normalizeWorkingDays([1, 7, 0, 1]), [1, 0]);
});

test("rejeita dias fora dos formatos JavaScript e ISO", () => {
  assert.throws(() => normalizeWorkingDays([8]), /Dias de trabalho/);
});
