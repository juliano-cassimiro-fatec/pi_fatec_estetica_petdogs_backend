import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import { ensurePasswordChangeComplete } from "./auth.middleware.js";
import type { AuthenticatedRequest } from "./request.types.js";

function createResponse() {
  let statusCode = 200;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;

  return {
    response,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
}

test("bloqueia funcionalidades para quem precisa trocar a senha", () => {
  const result = createResponse();
  let nextCalled = false;

  ensurePasswordChangeComplete(
    {
      user: {
        id: "user-1",
        name: "Pessoa",
        email: "pessoa@example.com",
        role: "cliente",
        mustChangePassword: true,
      },
    } as AuthenticatedRequest,
    result.response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.body, {
    message: "Altere sua senha provisória antes de continuar",
    code: "PASSWORD_CHANGE_REQUIRED",
  });
  assert.equal(nextCalled, false);
});

test("libera funcionalidades após a troca obrigatória", () => {
  const result = createResponse();
  let nextCalled = false;

  ensurePasswordChangeComplete(
    {
      user: {
        id: "user-1",
        name: "Pessoa",
        email: "pessoa@example.com",
        role: "cliente",
        mustChangePassword: false,
      },
    } as AuthenticatedRequest,
    result.response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(result.statusCode, 200);
});
