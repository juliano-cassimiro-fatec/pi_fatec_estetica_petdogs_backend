# Tratamento de erros no frontend

Este documento reúne os fallbacks para a API PetDogs.

## Formato das respostas

Quando o backend possui um erro conhecido, a resposta segue este formato:

```json
{
  "message": "Pet possui agendamentos e não pode ser removido",
  "code": "CONFLICT"
}
```

Alguns erros de autenticação e autorização atualmente retornam apenas `message`:

```json
{
  "message": "Token de autenticação não informado"
}
```

Por isso, o frontend deve usar primeiro `code`, depois o status HTTP e, por último, uma mensagem genérica.

## Handler reutilizável

```js
export async function getApiError(response) {
  let body = {};

  try {
    body = await response.json();
  } catch {
    // A resposta pode não ter JSON, por exemplo em erro de rede ou proxy.
  }

  const code = body.code ?? `HTTP_${response.status}`;
  const message = body.message ?? getGenericMessage(response.status);

  return {
    status: response.status,
    code,
    message,
    retryAfter: response.headers.get("Retry-After"),
  };
}

function getGenericMessage(status) {
  const messages = {
    400: "Confira os dados informados.",
    401: "Sua sessão expirou. Entre novamente.",
    403: "Você não tem permissão para realizar esta ação.",
    404: "Registro não encontrado.",
    409: "Não foi possível concluir porque existe um conflito.",
    413: "O arquivo excede o limite permitido.",
    415: "Formato de arquivo não suportado.",
    429: "Muitas tentativas. Aguarde e tente novamente.",
    500: "Ocorreu um erro interno. Tente novamente mais tarde.",
  };

  return messages[status] ?? "Não foi possível concluir a solicitação.";
}
```

## Uso em uma requisição

```js
const response = await fetch(`${API_URL}/api/v1/pets/${petId}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` },
});

if (!response.ok) {
  const error = await getApiError(response);
  mostrarErro(error);
  return;
}
```

## Fallback por código

```js
function mostrarErro(error) {
  const messages = {
    CONFLICT: "Este registro não pode ser removido porque possui agendamentos ou dependências.",
    NOT_FOUND: "O registro não foi encontrado.",
    VALIDATION_ERROR: "Existem dados inválidos no formulário.",
    BAD_REQUEST: error.message,
    FILE_REQUIRED: "Selecione uma imagem antes de enviar.",
    FILE_TYPE_REQUIRED: "Informe o tipo da imagem.",
    UNSUPPORTED_MEDIA_TYPE: "Envie uma imagem JPG, PNG, WebP ou GIF.",
    EMPTY_FILE: "O arquivo selecionado está vazio.",
    IMAGE_TOO_LARGE: "A imagem deve ter no máximo 5 MB.",
    RATE_LIMITED: "Muitas tentativas. Aguarde antes de tentar novamente.",
    FORBIDDEN: "Você não tem permissão para esta ação.",
    INTERNAL_ERROR: "Erro no servidor. Tente novamente mais tarde.",
  };

  const text = messages[error.code] ?? error.message;
  // Substitua por toast, alerta ou mensagem do formulário.
  console.error(`[${error.code}] ${text}`);
}
```

## Códigos e fallbacks da API

### `400` - Dados inválidos

| Código | Mensagem ou situação | Fallback no frontend |
|---|---|---|
| `BAD_REQUEST` | Campo obrigatório ausente ou valor inválido | Destacar os campos do formulário e mostrar a mensagem da API. |
| `VALIDATION_ERROR` | Erro de validação do MongoDB ou formato inválido | Mostrar `Dados inválidos` e revisar os campos enviados. |
| `FILE_REQUIRED` | Nenhum arquivo foi enviado | Pedir para selecionar uma imagem. |
| `FILE_TYPE_REQUIRED` | Base64 sem `contentType` | Enviar o MIME type, como `image/png`. |
| `INVALID_IMAGE_PATH` | O campo `foto` não contém um caminho de upload válido | Fazer o upload novamente e salvar `data.caminho`. |

Mensagens de validação que podem aparecer:

- `Nome, raça, porte e tutor são obrigatórios`
- `Nome, e-mail e senha são obrigatórios`
- `Nome, e-mail, senha e especialidade são obrigatórios`
- `Nome do serviço é obrigatório`
- `Descrição do serviço é obrigatória`
- `Idade inválida`
- `Porte inválido`
- `Duração inválida`
- `Preço inválido`
- `E-mail inválido`
- `Data e hora inválidas`
- `Status inválido`
- `Mês inválido`
- `Horário inválido`
- `Horário inicial deve ser anterior ao final`
- `Intervalo de almoço incompleto`
- `Horário deve respeitar intervalos de 15 minutos`
- `Não é possível agendar no passado`
- `Pet, serviço, profissional, data e hora são obrigatórios`
- `Profissional, serviço e data são obrigatórios`
- `Profissional, serviço e mês são obrigatórios`
- `Token é obrigatório`

### `401` - Não autenticado

| Mensagem | Fallback |
|---|---|
| `Token de autenticação não informado` | Redirecionar para login. |
| `Token inválido` | Remover token local e redirecionar para login. |
| `Token expirado` | Tentar renovar a sessão; se não for possível, redirecionar para login. |
| `Token inválido ou expirado` | Remover a sessão e redirecionar para login. |
| `Credenciais inválidas` | Mostrar erro no formulário de login sem informar qual campo está errado. |

### `403` - Sem permissão

| Mensagem | Fallback |
|---|---|
| `Acesso negado` | Exibir página ou estado de acesso negado. |
| `Usuário não autorizado para esta ação` | Esconder a ação não permitida e informar que o perfil não tem permissão. |

Não faça logout automaticamente em todo `403`; o usuário pode estar autenticado, mas não ter o papel necessário.

### `404` - Não encontrado

| Código | Mensagens | Fallback |
|---|---|---|
| `NOT_FOUND` | `Pet não encontrado`, `Cliente não encontrado`, `Profissional não encontrado`, `Serviço não encontrado`, `Agendamento não encontrado` | Mostrar estado vazio ou voltar para a listagem. |

### `409` - Conflito

| Código | Mensagem | Fallback |
|---|---|---|
| `CONFLICT` | `Pet possui agendamentos e não pode ser removido` | Não remover o item da tela; informar que existem agendamentos vinculados. |
| `CONFLICT` | `Serviço possui agendamentos e não pode ser removido` | Não remover o item; informar que existem agendamentos vinculados. |
| `CONFLICT` | `Cliente possui pets ou agendamentos e não pode ser removido` | Informar que o cliente possui dados dependentes. |
| `CONFLICT` | `Profissional possui agendamentos e não pode ser removido` | Informar que o profissional possui agendamentos vinculados. |
| `CONFLICT` | `E-mail já cadastrado` | Marcar o campo e-mail como já utilizado. |
| `CONFLICT` | `Registro duplicado` | Informar que o registro já existe. |

Exemplo específico do erro enviado:

```js
if (error.code === "CONFLICT") {
  toast.error(error.message);
}
```

### `413` - Arquivo muito grande

- Código: `IMAGE_TOO_LARGE` ou status `413`.
- Mensagem: `Imagem excede o limite de 5 MB`.
- Fallback: rejeitar o arquivo antes do envio quando `file.size > 5 * 1024 * 1024`.

```js
if (file.size > 5 * 1024 * 1024) {
  mostrarErro({ code: "IMAGE_TOO_LARGE", message: "A imagem deve ter no máximo 5 MB." });
  return;
}
```

### `415` - Formato não suportado

- Código: `UNSUPPORTED_MEDIA_TYPE`.
- Mensagem: `Formato de imagem não suportado`.
- Fallback: aceitar somente `image/jpeg`, `image/png`, `image/webp` e `image/gif`.

### `429` - Muitas tentativas

- Código: `RATE_LIMITED`.
- Mensagem: `Muitas tentativas. Tente novamente mais tarde`.
- Fallback: desabilitar o botão temporariamente e usar o header `Retry-After` para informar quando tentar novamente.

```js
const seconds = Number(error.retryAfter ?? 30);
mostrarErro({ message: `Aguarde ${seconds} segundos e tente novamente.` });
```

### `500` - Erro interno

- Código: `INTERNAL_ERROR`.
- Mensagem: `Erro interno do servidor`.
- Fallback: mostrar uma mensagem genérica, registrar o erro no monitoramento e não expor detalhes técnicos.

## Erro de rede

Erro de rede não possui resposta HTTP. Trate separadamente:

```js
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await getApiError(response);
    mostrarErro(error);
    return;
  }
} catch {
  mostrarErro({
    code: "NETWORK_ERROR",
    message: "Não foi possível conectar ao servidor. Verifique sua internet.",
  });
}
```

## Regras recomendadas

- Use `code` para lógica, nunca compare mensagens para decidir comportamento.
- Use `message` somente para exibição ou quando não houver um código específico.
- Preserve o formulário preenchido em erros `400`, `409` e `422`.
- Redirecione para login em erros `401`.
- Não faça logout automático em erros `403`.
- Em `500`, mostre mensagem genérica e registre o detalhe apenas no monitoramento.
- Em upload, salve o `caminho` retornado e monte a URL da imagem com a URL da API.
