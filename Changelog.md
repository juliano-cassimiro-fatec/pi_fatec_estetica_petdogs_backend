# Changelog

Todas as alterações relevantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.1] - 2026-08-27

### Corrigido

- Tipagem dos corpos e parâmetros de requisições HTTP para eliminar atribuições inseguras.
- Declaração explícita do contexto dos métodos dos controllers usados como handlers do Express.
- Condições e encadeamentos desnecessários apontados pelo ESLint.
- Uso de coalescência nula na configuração da porta do servidor.

### Alterado

- Versão do pacote atualizada para `1.0.1`.

## [1.0.0] - 2026-08-26

### Adicionado

- Estrutura inicial do backend.
- API REST desenvolvida com Node.js, Express e TypeScript.
- Configuração de conexão com MongoDB utilizando Mongoose.
- Configuração de variáveis de ambiente.
- Configuração de CORS.
- Estrutura para clientes, profissionais, pets, serviços e agendamentos.
- Configuração do ESLint.
- Configuração do Prettier.
- Scripts para desenvolvimento, build, lint, formatação e verificação de tipos.

### Configurado

- Execução em desenvolvimento com TSX.
- Compilação do TypeScript para a pasta `dist`.
- Padronização de código com ESLint e Prettier.
- Verificação de tipos com TypeScript.
- Scripts de validação para desenvolvimento e pull requests.

### Observações

- Esta versão representa a versão inicial estável da API.
- Novas funcionalidades, correções e alterações deverão ser registradas a partir desta versão.
