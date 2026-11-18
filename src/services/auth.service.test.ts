import assert from "node:assert/strict";
import test from "node:test";
import authService from "./auth.service.js";

test("CT-007: hashPassword nunca persiste a senha em texto puro", async () => {
  const password = "senha-segura-123";
  const passwordHash = await authService.hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test("CT-008: assertPassword exige pelo menos oito caracteres", () => {
  assert.throws(() => authService.assertPassword("1234567"), /8 caracteres/);
  assert.doesNotThrow(() => authService.assertPassword("12345678"));
});

test("CT-011: login administrativo gera token verificável", async () => {
  process.env.ADMIN_EMAIL = "admin@example.test";
  process.env.ADMIN_PASSWORD = "senha-administrativa";
  process.env.ADMIN_NAME = "Admin de teste";
  process.env.JWT_SECRET = "chave-de-teste-com-mais-de-32-caracteres";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.JWT_ISSUER = "teste";
  process.env.JWT_AUDIENCE = "teste";

  const session = await authService.login({
    email: "ADMIN@example.test",
    password: "senha-administrativa",
  });
  assert.equal(session.user.role, "admin");
  const verified = await authService.verifyToken(session.token);
  assert.equal(verified.id, "admin");
  assert.equal(verified.email, "admin@example.test");
});

test("CT-012: token com assinatura inválida é rejeitado", async () => {
  process.env.JWT_SECRET = "chave-de-teste-com-mais-de-32-caracteres";
  await assert.rejects(authService.verifyToken("header.payload.invalid"), /Token inválido/);
});

test("CT-013: token malformado é rejeitado", async () => {
  await assert.rejects(authService.verifyToken("malformado"), /Token inválido/);
});
