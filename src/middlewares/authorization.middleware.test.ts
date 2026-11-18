import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import { ensureRoles, resolveTargetIdForRole } from "./authorization.middleware.js";
import type { AuthenticatedRequest } from "./request.types.js";

function response() {
  let statusCode = 200;
  let body: unknown;
  const res = {
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
    res,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
  };
}

test("CT-022: permite acesso a papel autorizado", () => {
  const result = response();
  let called = false;
  ensureRoles(["admin"])(
    {
      user: { id: "1", name: "Admin", email: "admin@example.test", role: "admin" },
    } as AuthenticatedRequest,
    result.res,
    () => {
      called = true;
    },
  );
  assert.equal(called, true);
  assert.equal(result.statusCode, 200);
});

test("CT-023: bloqueia papel sem permissão", () => {
  const result = response();
  let called = false;
  ensureRoles(["admin"])(
    {
      user: { id: "1", name: "Cliente", email: "cliente@example.test", role: "cliente" },
    } as AuthenticatedRequest,
    result.res,
    () => {
      called = true;
    },
  );
  assert.equal(called, false);
  assert.equal(result.statusCode, 403);
  assert.deepEqual(result.body, { message: "Usuário não autorizado para esta ação" });
});

test("CT-024: bloqueia acesso sem usuário autenticado", () => {
  const result = response();
  resolveTargetIdForRole("cliente")({} as AuthenticatedRequest, result.res, () => {
    throw new Error("Não deveria prosseguir");
  });
  assert.equal(result.statusCode, 401);
});

test("CT-025: usa o próprio identificador para o papel associado", () => {
  const result = response();
  const req = {} as AuthenticatedRequest;
  req.user = { id: "cliente-1", name: "Cliente", email: "cliente@example.test", role: "cliente" };
  req.params = { id: "outro" };
  let called = false;
  resolveTargetIdForRole("cliente")(req, result.res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.targetId, "cliente-1");
});

test("CT-026: usa parâmetro configurado para outro papel", () => {
  const result = response();
  const req = {} as AuthenticatedRequest;
  req.user = { id: "admin", name: "Admin", email: "admin@example.test", role: "admin" };
  req.params = { clienteId: "cliente-2" };
  let called = false;
  resolveTargetIdForRole("cliente", "clienteId")(req, result.res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.targetId, "cliente-2");
});
