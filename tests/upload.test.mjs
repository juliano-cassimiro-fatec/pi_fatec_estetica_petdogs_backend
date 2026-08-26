import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { saveUploadedImage, storeImageInput, validateStoredImagePath } from "../dist/services/upload.service.js"

test("salva a imagem localmente e retorna somente o caminho público", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "petdogs-upload-"))
  process.env.UPLOAD_DIR = directory
  try {
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const storedPath = await saveUploadedImage(image, "image/png")
    assert.match(storedPath, /^\/uploads\/[0-9a-f-]+\.png$/)
    assert.deepEqual(await readFile(path.join(directory, path.basename(storedPath))), image)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("rejeita Base64 no campo de caminho da imagem", () => {
  assert.throws(() => validateStoredImagePath("data:image/png;base64,AAAA"), /caminho retornado/)
})

test("converte o Base64 enviado pelo frontend em arquivo e retorna seu caminho", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "petdogs-base64-"))
  process.env.UPLOAD_DIR = directory
  try {
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const storedPath = await storeImageInput(`data:image/png;base64,${image.toString("base64")}`)
    assert.match(storedPath, /^\/uploads\/[0-9a-f-]+\.png$/)
    assert.deepEqual(await readFile(path.join(directory, path.basename(storedPath))), image)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("recupera a imagem salva pela rota pública", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "petdogs-recovery-"))
  process.env.UPLOAD_DIR = directory
  const image = Buffer.from([0xff, 0xd8, 0xff, 0xdb])
  const storedPath = await saveUploadedImage(image, "image/jpeg")
  const { default: app } = await import("../dist/app/app.js")
  const server = app.listen(0)

  try {
    await new Promise((resolve) => server.once("listening", resolve))
    const address = server.address()
    assert.equal(typeof address, "object")
    const response = await fetch(`http://127.0.0.1:${address.port}${storedPath}`)
    assert.equal(response.status, 200)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), image)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    await rm(directory, { recursive: true, force: true })
  }
})
