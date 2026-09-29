import assert from "node:assert/strict";
import test from "node:test";
import authService from "./auth.service.js";

test("hashPassword nunca persiste a senha em texto puro", async () => {
  const password = "senha-segura-123";
  const passwordHash = await authService.hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test("assertPassword exige pelo menos oito caracteres", () => {
  assert.throws(() => authService.assertPassword("1234567"), /8 caracteres/);
  assert.doesNotThrow(() => authService.assertPassword("12345678"));
});
