const { PrismaClient } = require('@prisma/client');
const FallbackService = require('../src/services/fallbackService');

const prisma = new PrismaClient();

async function initializeSystem() {
  try {
    console.log('🚀 Inicializando sistema SmartBI Assistant...');

    // Verifica conexão com banco
    console.log('📊 Verificando conexão com banco de dados...');
    await prisma.$connect();
    console.log('✅ Banco de dados conectado com sucesso');

    // Aplica migrations pendentes
    console.log('🔧 Verificando migrations...');
    // Nota: Em produção, você executaria: npx prisma migrate deploy
    console.log('ℹ️  Para aplicar migrations: npm run db:migrate');

    // Inicializa sistema de fallback
    console.log('🛡️  Inicializando sistema de fallback...');
    const fallbackService = new FallbackService();
    await fallbackService.initializeDefaultFallbacks();
    console.log('✅ Sistema de fallback inicializado');

    // Verifica configurações essenciais
    console.log('⚙️  Verificando configurações...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️  Variáveis de ambiente faltando:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('ℹ️  Copie .env.example para .env e configure as variáveis');
    } else {
      console.log('✅ Todas as variáveis de ambiente configuradas');
    }

    // Testa conexão com Gemini API (se configurada)
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Testando conexão com Gemini AI...');
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        
        // Teste simples
        const result = await model.generateContent("Test connection");
        console.log('✅ Gemini AI conectado com sucesso');
      } catch (error) {
        console.log('❌ Erro ao conectar com Gemini AI:', error.message);
        console.log('ℹ️  Verifique sua GEMINI_API_KEY');
      }
    }

    console.log('\n🎉 Sistema inicializado com sucesso!');
    console.log('\n📖 Próximos passos:');
    console.log('   1. Configure as variáveis de ambiente (.env)');
    console.log('   2. Execute as migrations: npm run db:migrate');
    console.log('   3. Inicie o servidor: npm start');
    console.log('\n📚 Documentação da API disponível em: /api/info');

  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para limpar dados de desenvolvimento
async function cleanDevData() {
  try {
    console.log('🧹 Limpando dados de desenvolvimento...');
    
    // Remove dados de teste (cuidado em produção!)
    if (process.env.NODE_ENV === 'development') {
      await prisma.ai_response_cache.deleteMany({});
      await prisma.ai_interactions.deleteMany({});
      await prisma.ai_chat_sessions.deleteMany({});
      
      console.log('✅ Dados de desenvolvimento limpos');
    } else {
      console.log('⚠️  Limpeza só disponível em ambiente de desenvolvimento');
    }
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

// Função para verificar saúde do sistema
async function healthCheck() {
  try {
    console.log('🔍 Verificando saúde do sistema...');

    // Verifica banco
    const userCount = await prisma.users.count();
    console.log(`📊 Usuários cadastrados: ${userCount}`);

    const interactionCount = await prisma.ai_interactions.count();
    console.log(`🤖 Interações com IA: ${interactionCount}`);

    const sessionCount = await prisma.ai_chat_sessions.count({
      where: { status: 'active' }
    });
    console.log(`💬 Sessões ativas: ${sessionCount}`);

    const fallbackCount = await prisma.ai_fallbacks.count({
      where: { is_active: true }
    });
    console.log(`🛡️  Fallbacks ativos: ${fallbackCount}`);

    console.log('✅ Sistema saudável!');

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeSystem();
    break;
  case 'clean':
    cleanDevData();
    break;
  case 'health':
    healthCheck();
    break;
  default:
    console.log('📋 Comandos disponíveis:');
    console.log('   node scripts/setup.js init   - Inicializa o sistema');
    console.log('   node scripts/setup.js clean  - Limpa dados de dev');
    console.log('   node scripts/setup.js health - Verifica saúde do sistema');
    break;
}
