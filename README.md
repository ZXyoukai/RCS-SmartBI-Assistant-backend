# RCS SmartBI Assistant

API RESTful construída com **Node.js**, **Express** e **Prisma** para gerenciamento de usuários, queries, resultados, histórico, exports, sugestões e logs de acesso.

## Sumário

- [Sobre](#sobre)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Estrutura da API](#estrutura-da-api)
- [Autenticação](#autenticação)
- [Endpoints Principais](#endpoints-principais)
- [Documentação Completa](#documentação-completa)

---

## Sobre

Esta API permite:
- Cadastro e autenticação de usuários
- Gerenciamento de queries e resultados
- Histórico de execuções
- Exportação de dados
- Sugestões e logs de acesso

---

## Instalação

```bash
git clone https://github.com/seu-usuario/rcs-smartbi-assistant.git
cd rcs-smartbi-assistant
npm install
```

---

## Configuração

1. Configure o banco de dados PostgreSQL e adicione a URL no arquivo `.env`:

   ```
   DATABASE_URL="postgresql://usuario:senha@host:porta/database"
   ```

2. Execute as migrações do Prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

---

## Execução

```bash
npm run dev
```
ou
```bash
npx nodemon src/server.js
```

---

## Estrutura da API

- **Autenticação JWT**: rotas protegidas exigem o header `Authorization: Bearer <token>`.
- **Modelos**: users, queries, results, history, exports, suggestions, access_logs.

---

## Autenticação

- **Registro:** `POST /auth/register`
- **Login:** `POST /auth/login`  
  Ambos retornam um token JWT para uso nas rotas protegidas.

Exemplo de uso do token:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Endpoints Principais

### Usuários
- `GET /users` — Lista usuários (protegido)
- `GET /users/:id` — Detalhes do usuário (protegido)
- `PUT /users/:id` — Atualiza usuário (protegido)
- `DELETE /users/:id` — Remove usuário (protegido)

### Queries
- `GET /queries` — Lista queries do usuário (protegido)
- `POST /queries` — Cria query (protegido)
- `GET /queries/:id` — Detalhes da query (protegido)
- `DELETE /queries/:id` — Remove query (protegido)

### Results
- `GET /results?query_id=ID` — Lista resultados (protegido)
- `POST /results` — Adiciona resultado (protegido)

### History
- `GET /history` — Histórico do usuário (protegido)

### Exports
- `GET /exports` — Lista exports (protegido)
- `POST /exports` — Cria export (protegido)

### Sugestões
- `GET /suggestions` — Lista sugestões (protegido)
- `POST /suggestions` — Cria sugestão (protegido)

### Logs de Acesso
- `GET /access-logs` — Lista logs do usuário (protegido)

---

## Documentação Completa

Veja o arquivo [`docs/api-documentation.html`](docs/api-documentation.html) para exemplos de payloads, respostas e detalhes de cada rota.

---