# Fluxograma do Backend SmartBI Assistant

```mermaid
graph TD
    A[Usuário] --> B[/Auth/]
    B --> C[Rotas Protegidas]
    C --> D[/Users/]
    C --> E[/Conversation/]
    C --> F[/Queries/]
    C --> G[/Results/]
    C --> H[/History/]
    C --> I[/Exports/]
    C --> J[/Suggestions/]
    C --> K[/Access-Logs/]
    C --> L[/ExDatabase/]
    D --> M[Controller/Service]
    E --> N[Controller/Service]
    F --> O[Controller/Service]
    G --> P[Controller/Service]
    H --> Q[Controller/Service]
    I --> R[Controller/Service]
    J --> S[Controller/Service]
    K --> T[Controller/Service]
    L --> U[Controller/Service]
    M --> V[Prisma/DB]
    N --> V
    O --> V
    P --> V
    Q --> V
    R --> V
    S --> V
    T --> V
    U --> V
    V[(Banco de Dados)]

```

## Pontos não totalmente claros
- Integração real com bancos externos (apenas cadastro, não há conexão/consulta)
- Políticas de permissão detalhadas por rota
- Fluxo de erros padronizado em todos os módulos
- Documentação completa dos payloads de cada rota

> Este fluxograma representa o fluxo principal do backend, destacando as rotas, controllers/services e acesso ao banco de dados.
