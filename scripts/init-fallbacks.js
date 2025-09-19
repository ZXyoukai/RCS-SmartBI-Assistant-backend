const { PrismaClient } = require('@prisma/client');
const FallbackService = require('../src/services/fallbackService');

const prisma = new PrismaClient();

async function initializeFallbacks() {
  try {
    console.log('🚀 Inicializando sistema de fallbacks...');
    
    const fallbackService = new FallbackService();
    await fallbackService.initializeDefaultFallbacks();
    
    console.log('✅ Sistema de fallbacks inicializado com sucesso!');
    
    // Mostra estatísticas
    const stats = await fallbackService.getFallbackStats();
    if (stats.success) {
      console.log('\n📊 Estatísticas dos fallbacks:');
      console.log(`Total de fallbacks: ${stats.data.totalFallbacks}`);
      console.log(`Fallbacks ativos: ${stats.data.activeFallbacks}`);
      console.log('\nPor tipo:');
      Object.entries(stats.data.summary).forEach(([type, data]) => {
        console.log(`  ${type}: ${data.count} templates (${data.active} ativos)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar fallbacks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function resetFallbacks() {
  try {
    console.log('🔄 Resetando sistema de fallbacks...');
    
    // Remove todos os fallbacks existentes
    await prisma.ai_fallbacks.deleteMany({});
    console.log('✅ Fallbacks existentes removidos');
    
    // Reinicializa
    await initializeFallbacks();
    
  } catch (error) {
    console.error('❌ Erro ao resetar fallbacks:', error);
    process.exit(1);
  }
}

async function showFallbackStats() {
  try {
    const fallbackService = new FallbackService();
    const stats = await fallbackService.getFallbackStats();
    
    if (stats.success) {
      console.log('\n📊 Estatísticas dos fallbacks:');
      console.log(`Total de fallbacks: ${stats.data.totalFallbacks}`);
      console.log(`Fallbacks ativos: ${stats.data.activeFallbacks}`);
      console.log('\nPor tipo:');
      Object.entries(stats.data.summary).forEach(([type, data]) => {
        console.log(`  ${type}:`);
        console.log(`    Templates: ${data.count}`);
        console.log(`    Ativos: ${data.active}`);
        console.log(`    Uso total: ${data.totalUsage}`);
        console.log(`    Escalação média: ${data.avgEscalation}`);
      });
    } else {
      console.error('❌ Erro ao obter estatísticas:', stats.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao mostrar estatísticas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Processa argumentos da linha de comando
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeFallbacks();
    break;
  case 'reset':
    resetFallbacks();
    break;
  case 'stats':
    showFallbackStats();
    break;
  default:
    console.log(`
🔧 Script de gerenciamento de fallbacks

Uso: node scripts/init-fallbacks.js <comando>

Comandos disponíveis:
  init   - Inicializa fallbacks padrão
  reset  - Remove e reinicializa todos os fallbacks
  stats  - Mostra estatísticas dos fallbacks

Exemplos:
  node scripts/init-fallbacks.js init
  node scripts/init-fallbacks.js reset
  node scripts/init-fallbacks.js stats
    `);
    process.exit(1);
}
