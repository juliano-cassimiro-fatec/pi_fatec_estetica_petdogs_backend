import assert from "node:assert/strict";
import test from "node:test";
import { assertEmail, assertObjectId, assertTime } from "./validation.js";

test("CT-009: valida formato de e-mail", () => {
  assert.doesNotThrow(() => assertEmail("pessoa@example.com"));
  assert.throws(() => assertEmail("pessoa@exemplo"), /E-mail inválido/);
  assert.throws(() => assertEmail("pessoa @example.com"), /E-mail inválido/);
});

test("CT-010: valida horários no formato de 24 horas", () => {
  assert.doesNotThrow(() => assertTime("00:00", "Horário"));
  assert.doesNotThrow(() => assertTime("23:59", "Horário"));
  assert.throws(() => assertTime("24:00", "Horário"), /Horário inválido/);
  assert.throws(() => assertTime("12:60", "Horário"), /Horário inválido/);
});

test("CT-014: aceita identificador MongoDB válido", () => {
  assert.doesNotThrow(() => assertObjectId("507f1f77bcf86cd799439011"));
});

test("CT-015: rejeita identificador MongoDB inválido com nome do campo", () => {
  assert.throws(() => assertObjectId("inválido", "Cliente"), /Cliente inválido/);
});
