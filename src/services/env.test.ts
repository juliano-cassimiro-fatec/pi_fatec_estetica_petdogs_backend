import assert from "node:assert/strict";
import test from "node:test";
import { env, optionalEnv, validateEnvironment } from "./env.js";

const validEnvironment = {
  MONGO_URI: "mongodb://localhost/test",
  JWT_SECRET: "a".repeat(32),
  JWT_EXPIRES_IN: "1h",
  JWT_ISSUER: "test",
  JWT_AUDIENCE: "test",
  ADMIN_EMAIL: "admin@example.test",
  ADMIN_PASSWORD: "a".repeat(12),
  ADMIN_NAME: "Admin",
  FRONTEND_URL: "http://localhost:4174",
  UPLOAD_DIR: "uploads",
};

function withTestEnvironment(action: () => void) {
  const previous = Object.fromEntries(
    Object.keys(validEnvironment).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, validEnvironment);
  try {
    action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("CT-016: aceita configuração completa", () => {
  withTestEnvironment(() => assert.doesNotThrow(validateEnvironment));
});

test("CT-017: informa variáveis obrigatórias ausentes", () => {
  withTestEnvironment(() => {
    delete process.env.MONGO_URI;
    assert.throws(validateEnvironment, /MONGO_URI/);
  });
});

test("CT-018: rejeita segredo JWT curto", () => {
  withTestEnvironment(() => {
    process.env.JWT_SECRET = "curto";
    assert.throws(validateEnvironment, /JWT_SECRET/);
  });
});

test("CT-019: rejeita senha administrativa curta", () => {
  withTestEnvironment(() => {
    process.env.ADMIN_PASSWORD = "curta";
    assert.throws(validateEnvironment, /ADMIN_PASSWORD/);
  });
});

test("CT-020: informa erro ao consultar variável obrigatória ausente", () => {
  withTestEnvironment(() => {
    delete process.env.MONGO_URI;
    assert.throws(() => env("MONGO_URI"), /MONGO_URI/);
  });
});

test("CT-021: normaliza variável opcional vazia", () => {
  withTestEnvironment(() => {
    process.env.ADMIN_NAME = "  exemplo  ";
    assert.equal(optionalEnv("ADMIN_NAME"), "exemplo");
    process.env.ADMIN_NAME = "  ";
    assert.equal(optionalEnv("ADMIN_NAME"), undefined);
  });
});
