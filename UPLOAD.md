# Integracao de upload de imagens

## Rotas

- `POST /api/v1/uploads`: envia uma imagem. Requer `Authorization: Bearer <token>`.
- `GET /uploads/<nome-do-arquivo>`: retorna a imagem salva.

O upload aceita imagens `jpeg`, `png`, `webp` e `gif` com ate 5 MB.

> A API recebe o arquivo como corpo binario. Ela tambem aceita JSON com Base64. O endpoint atual nao usa `multipart/form-data`.

## Resposta

Em caso de sucesso, a API retorna `201`:

```json
{
  "caminho": "/uploads/550e8400-e29b-41d4-a716-446655440000.png",
  "nome": "550e8400-e29b-41d4-a716-446655440000.png",
  "tipo": "image/png",
  "url": "http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440000.png"
}
```

Use `url` diretamente no atributo `src` da imagem. O campo `caminho` e util para salvar no banco e pode ser usado para montar a URL quando o frontend estiver em outro ambiente.

## Importante: URL no frontend

Se o frontend roda em outra porta, nao use somente `src="/uploads/..."`.
Esse caminho aponta para o servidor do frontend, por exemplo `http://localhost:5173/uploads/...`, e nao para a API.

Use a URL retornada pela API:

```html
<img alt="teste" src="http://localhost:3001/uploads/25fe09bf-5e62-4ce7-ab7f-c3ebc862a87c.jpg" />
```

Ou monte a URL a partir do caminho salvo:

```js
const API_URL = "http://localhost:3001";
const fotoUrl = foto.startsWith("http") ? foto : `${API_URL}${foto}`;

imagem.src = fotoUrl;
```

No frontend, o bloco correto fica assim:

```html
<img alt="teste" class="h-40 w-full object-cover" src="http://localhost:3001/uploads/25fe09bf-5e62-4ce7-ab7f-c3ebc862a87c.jpg" />
```

Em producao, troque `http://localhost:3001` pela URL publica do backend.

## Envio recomendado: arquivo binario

```html
<input id="foto" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
<img id="preview" alt="Imagem enviada" />
```

```js
const API_URL = "http://localhost:3001";
const token = localStorage.getItem("token");
const input = document.querySelector("#foto");
const preview = document.querySelector("#preview");

async function enviarImagem(file) {
  if (!file) return;

  const response = await fetch(`${API_URL}/api/v1/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
    },
    body: file,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Nao foi possivel enviar a imagem");
  }

  preview.src = data.url;
  return data;
}

input.addEventListener("change", async () => {
  try {
    await enviarImagem(input.files?.[0]);
  } catch (error) {
    console.error(error);
  }
});
```

## Envio em Base64

Use este formato quando o frontend ja trabalhar com Data URL ou precisar enviar JSON:

```js
const response = await fetch(`${API_URL}/api/v1/uploads`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    base64: dataUrl,
    contentType: "image/png",
  }),
});

const data = await response.json();
if (!response.ok) throw new Error(data.message);

preview.src = data.url;
```

O campo `base64` tambem pode conter somente o conteudo Base64, desde que `contentType` seja informado. A API aceita os nomes `base64`, `file` ou `arquivo`.

## Salvando a referencia no cadastro

O mesmo upload serve para todos os recursos que possuem imagem: clientes, profissionais e pets.
Primeiro envie o arquivo para `/api/v1/uploads`; depois envie o `caminho` retornado no campo `foto` do recurso.

Use sempre `data.caminho` para salvar no banco. Nao salve `data.url`, porque a URL absoluta muda entre desenvolvimento, homologacao e producao.

### Pet

```js
const pet = await fetch(`${API_URL}/api/v1/pets`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nome: "Nina",
    raca: "Poodle",
    idade: 3,
    porte: "medio",
    foto: data.caminho,
  }),
});
```

Para atualizar somente a imagem do pet:

```js
await fetch(`${API_URL}/api/v1/pets/${petId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ foto: data.caminho }),
});
```

### Cliente

Envie `foto: data.caminho` ao cadastrar ou atualizar em:

```text
POST /api/v1/clientes
PUT  /api/v1/clientes/:id
PUT  /api/v1/clientes/me
```

Exemplo de atualizacao:

```js
await fetch(`${API_URL}/api/v1/clientes/me`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ foto: data.caminho }),
});
```

### Profissional

Envie `foto: data.caminho` ao cadastrar ou atualizar em:

```text
POST /api/v1/profissionais
PUT  /api/v1/profissionais/:id
PUT  /api/v1/profissionais/me
```

Exemplo de atualizacao:

```js
await fetch(`${API_URL}/api/v1/profissionais/${profissionalId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ foto: data.caminho }),
});
```

### Cadastro com imagem

No cadastro de cliente, o campo `foto` tambem aceita o caminho de um upload feito anteriormente:

```js
await fetch(`${API_URL}/api/v1/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Maria",
    email: "maria@example.com",
    password: "senha-com-12-caracteres",
    foto: data.caminho,
  }),
});
```

Para exibir uma referencia salva no banco, prefira:

```js
const urlDaImagem = foto.startsWith("http") ? foto : `${API_URL}${foto}`;
```

Todas as respostas de pets, clientes, profissionais, agendamentos populados e sessoes de autenticacao usam o mesmo campo `foto`, com valor no formato `/uploads/<arquivo>`.
O arquivo correspondente sempre pode ser carregado com `GET ${API_URL}${foto}`.

## Configuracao local

No `.env`, defina o diretorio fisico onde as imagens serao gravadas:

```env
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
```

Com essa configuracao, os arquivos ficam na pasta `uploads/` do backend e sao servidos publicamente pelo prefixo `/uploads`.

## Erros comuns

- `401`: token ausente ou invalido.
- `400 FILE_REQUIRED`: nenhum arquivo foi enviado.
- `400 FILE_TYPE_REQUIRED`: o envio Base64 nao informou o tipo.
- `413`: imagem maior que 5 MB.
- `415`: formato diferente de JPEG, PNG, WebP ou GIF.
