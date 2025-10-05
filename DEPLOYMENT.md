# Deployment Instructions for Vercel

## Problemas Identificados e Soluções

### 1. Script de Start Incorreto ❌ → ✅ CORRIGIDO
**Problema:** O script `start` usava `nodemon` (dev dependency)
**Solução:** Alterado para `node src/app.js`

### 2. Dependências de Banco Problemáticas ❌ → ✅ CORRIGIDO
**Problema:** SQLite, MySQL, MariaDB podem causar problemas em ambiente serverless
**Solução:** 
- Movidas para `optionalDependencies`
- Implementado carregamento dinâmico com fallbacks
- PostgreSQL mantido como dependência principal

### 3. Configuração do Prisma ❌ → ✅ CORRIGIDO
**Problema:** Cliente Prisma não otimizado para Vercel
**Solução:** 
- Adicionado `PRISMA_GENERATE_DATAPROXY=true`
- Build command configurado para gerar cliente
- Configurações de timeout e memória otimizadas

### 4. Configuração de CORS ❌ → ✅ CORRIGIDO
**Problema:** CORS configurado para aceitar qualquer origem
**Solução:** Configuração específica para produção vs desenvolvimento

## Environment Variables Required

### Obrigatórias:
- `DATABASE_URL` - PostgreSQL connection string (NeonDB/Supabase/etc)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Set to "production"

### Recomendadas:
- `FRONTEND_URL` - Your frontend URL (for CORS)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Opcionais (AI Features):
- `GOOGLE_API_KEY` - For AI features
- `EMAIL_*` - Email configuration variables

## Configurações Otimizadas

### Build Configuration
- Build command: `npm run build` ✅
- Start command: `npm start` ✅
- Node.js version: Latest LTS ✅
- Memory: 1024MB ✅
- Timeout: 60 seconds ✅
- Region: iad1 (Virginia) ✅

### Prisma Configuration
- Cliente gerado automaticamente no build ✅
- Configurado para DataProxy ✅
- Binários otimizados para Vercel ✅

## Verificações Antes do Deploy

1. ✅ Todas as variáveis de ambiente configuradas na Vercel
2. ✅ DATABASE_URL acessível pela Vercel
3. ✅ Build local funcionando (`npm run build`)
4. ✅ Sintaxe do código verificada (`node -c src/app.js`)
5. ✅ Dependências otimizadas

## Deploy Steps

1. **Commit todas as mudanças:**
   ```bash
   git add .
   git commit -m "fix: otimizar configuração para Vercel"
   git push origin fixProblems
   ```

2. **Merge com main branch:**
   ```bash
   git checkout main
   git merge fixProblems
   git push origin main
   ```

3. **Deploy automático na Vercel**

## Monitoramento

Após o deploy, verificar:
- Health check: `https://your-app.vercel.app/health`
- Logs na dashboard da Vercel
- Tempo de resposta das APIs
- Uso de memória

## Troubleshooting Comum

### Se ainda houver problemas:

1. **Timeout de Função:**
   - Verificar se queries estão otimizadas
   - Considerar cache para queries pesadas

2. **Problemas de Dependências:**
   - Verificar se todas dependências são compatíveis com Node.js 18+
   - Considerar alternativas serverless-friendly

3. **Problemas de Prisma:**
   - Verificar se DATABASE_URL está correto
   - Testar conexão com banco em ambiente local

4. **Memory Limits:**
   - Otimizar imports
   - Implementar lazy loading onde possível
