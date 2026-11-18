import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getUploadDirectory,
  saveUploadedImage,
  validateStoredImagePath,
} from "./upload.service.js";

test("CT-027: salva a imagem no diretório configurado", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "petdogs-upload-test-"));
  const previous = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = directory;
  try {
    const content = Buffer.from("imagem de teste");
    const result = await saveUploadedImage(content, "image/png; charset=binary");
    assert.match(result, /^\/uploads\/[0-9a-f-]+\.png$/);
    assert.deepEqual(await readFile(path.join(directory, path.basename(result))), content);
    assert.equal(validateStoredImagePath(` ${result} `), result);
  } finally {
    if (previous === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});

test("CT-028: rejeita formato de imagem não suportado", async () => {
  await assert.rejects(saveUploadedImage(Buffer.from("conteúdo"), "text/plain"), /Formato/);
});

test("CT-029: rejeita arquivo de imagem vazio", async () => {
  await assert.rejects(saveUploadedImage(Buffer.alloc(0), "image/png"), /vazio/);
});

test("CT-030: rejeita imagens acima de cinco megabytes", async () => {
  await assert.rejects(saveUploadedImage(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png"), /5 MB/);
});

test("CT-031: rejeita caminho externo ou com travessia de diretório", () => {
  assert.throws(() => validateStoredImagePath("/uploads/../arquivo.png"), /Caminho/);
  assert.throws(() => validateStoredImagePath("https://example.test/arquivo.png"), /Caminho/);
});

test("CT-032: informa ausência de diretório de uploads", () => {
  const previous = process.env.UPLOAD_DIR;
  delete process.env.UPLOAD_DIR;
  try {
    assert.throws(getUploadDirectory, /UPLOAD_DIR/);
  } finally {
    if (previous !== undefined) process.env.UPLOAD_DIR = previous;
  }
});
