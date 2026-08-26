import test from "node:test"
import assert from "node:assert/strict"
import { validateEnvironment } from "../dist/config/env.js"

const keys = ["MONGO_URI", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME", "UPLOAD_DIR"]

test("rejeita configuração obrigatória ausente", () => {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  for (const key of keys) delete process.env[key]
  assert.throws(validateEnvironment, /obrigatórias ausentes/)
  Object.assign(process.env, previous)
})

test("aceita configuração segura", () => {
  Object.assign(process.env, {
    MONGO_URI: "mongodb://localhost/test",
    JWT_SECRET: "a".repeat(32),
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "secure-pass-123",
    ADMIN_NAME: "Admin",
    UPLOAD_DIR: "/tmp/petdogs-uploads",
  })
  assert.doesNotThrow(validateEnvironment)
})
