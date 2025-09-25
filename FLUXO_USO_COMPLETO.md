# Fluxo de Uso Completo da Plataforma SmartBI Assistant (Atualizado)

```mermaid
flowchart TD
    A["Usuário acessa sistema"] --> B{Registrado?}
    B -->|Não| C["Registro via /auth/register"]
    B -->|Sim| D["Login via /auth/login"]
    C --> D
    D --> E["Recebe Token JWT"]
    E --> F["Menu Principal"]
    
    F --> G["Configurar Bancos"]
    F --> H["Iniciar Conversa IA"]
    F --> I["Fazer Consultas"]
    F --> J["Ver Histórico"]
    F --> K["Exportar Dados"]
    F --> L["Ver Sugestões"]
    F --> M["Gerenciar Fallbacks (admin)"]
    
    %% Configuração de Bancos
    G --> G1["POST /exdatabase"]
    G1 --> G2["Validação de schema"]
    G2 --> G3["Lista Bancos: GET /exdatabase"]
    G3 --> G4["Admin: Testa conexão /exdatabase/:id/test"]
    G3 --> G5["Admin: Executa query /exdatabase/:id/execute"]
    G3 --> G6["Consulta schema /exdatabase/:id/schema"]
    
    %% Conversa IA
    H --> H1["POST /conversation/start"]
    H1 --> H2["Recebe sessionId"]
    H2 --> H3["POST /conversation/message"]
    H3 --> H4["IA Processa Mensagem"]
    H4 --> H5{Tipo de Resposta?}
    H5 -->|NL2SQL| H6["Gera SQL"]
    H6 --> H7["Seleciona banco"]
    H7 --> H8["Executa SQL (SELECT) no banco"]
    H8 --> H9["Retorna dados formatados para tabela"]
    H5 -->|SQL2NL| H10["Explica SQL"]
    H5 -->|Conversa| H11["Resposta Natural"]
    H5 -->|Insight| H12["POST /conversation/insights"]
    H9 --> H13{Exibir como?}
    H13 -->|Tabela| H14["Frontend exibe tabela"]
    H13 -->|Dashboard| H15["Frontend exibe métricas"]
    H13 -->|Gráfico| H16["Frontend exibe gráfico"]
    H10 --> H17["Exibe explicação"]
    H11 --> H18["Exibe resposta"]
    H12 --> H19["Exibe insight"]
    H14 --> H20["Usuário interage"]
    H15 --> H20
    H16 --> H20
    H17 --> H20
    H18 --> H20
    H19 --> H20
    H20 --> H3
    
    %% Consultas Diretas
    I --> I1["POST /queries"]
    I1 --> I2["Processa Pergunta"]
    I2 --> I3["Gera Resultado"]
    I3 --> I4["POST /results"]
    I4 --> I5["Salva no Histórico"]
    
    %% Histórico
    J --> J1["GET /history"]
    J1 --> J2["Lista Consultas Anteriores"]
    J2 --> J3["GET /conversation/:sessionId/history"]
    
    %% Exportação
    K --> K1["POST /exports"]
    K1 --> K2["Gera Arquivo"]
    K2 --> K3["Download"]
    
    %% Sugestões
    L --> L1["GET /suggestions"]
    L1 --> L2["Mostra Sugestões IA"]
    
    %% Fallbacks (admin)
    M --> M1["GET/POST/PUT/DELETE /fallbacks"]
    M1 --> M2["Gerencia respostas de fallback"]
    
    %% Todos os fluxos registram logs
    G1 --> N["POST /access-logs"]
    H1 --> N
    I1 --> N
    J1 --> N
    K1 --> N
    L1 --> N
    M1 --> N
    
    style B fill:#f9f
    style H4 fill:#bbf
    style H9 fill:#bbf
    style H13 fill:#bbf
    style M fill:#faa
```

## Pontos resolvidos
- Integração real com bancos externos (testar, executar, schema)
- Seleção de banco para NL2SQL
- Retorno de dados prontos para tabela, dashboard ou gráfico
- Permissões admin/user
- Gerenciamento de fallbacks
- Validação de schema

> Este fluxograma representa o fluxo completo e atualizado do backend, incluindo os novos recursos implementados.
