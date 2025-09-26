const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    this.cacheExpirationHours = 24; // Cache válido por 24 horas
  }

  /**
   * Gera hash para cache de respostas
   * @param {string} inputText - Texto de entrada
   * @param {string} interactionType - Tipo de interação
   * @returns {string} Hash MD5
   */
  generateCacheHash(inputText, interactionType) {
    const content = `${inputText}-${interactionType}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Verifica se existe resposta em cache
   * @param {string} inputText - Texto de entrada
   * @param {string} interactionType - Tipo de interação
   * @returns {Object|null} Resposta do cache ou null
   */
  async getCachedResponse(inputText, interactionType) {
    try {
      const hash = this.generateCacheHash(inputText, interactionType);
      const cached = await prisma.ai_response_cache.findUnique({
        where: { input_hash: hash }
      });

      if (cached && new Date() < cached.expires_at) {
        // Incrementa contador de hits
        await prisma.ai_response_cache.update({
          where: { id: cached.id },
          data: { 
            hit_count: { increment: 1 },
            updated_at: new Date()
          }
        });
        return cached.response_data;
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar cache:', error);
      return null;
    }
  }

  /**
   * Salva resposta no cache
   * @param {string} inputText - Texto de entrada
   * @param {string} interactionType - Tipo de interação
   * @param {Object} responseData - Dados da resposta
   */
  async cacheResponse(inputText, interactionType, responseData) {
    try {
      const hash = this.generateCacheHash(inputText, interactionType);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.cacheExpirationHours);

      await prisma.ai_response_cache.upsert({
        where: { input_hash: hash },
        update: { 
          response_data: responseData,
          hit_count: { increment: 1 },
          expires_at: expiresAt,
          updated_at: new Date()
        },
        create: {
          input_hash: hash,
          input_text: inputText,
          response_data: responseData,
          interaction_type: interactionType,
          expires_at: expiresAt
        }
      });
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }

  /**
   * Chamada principal para o Gemini AI
   * @param {string} prompt - Prompt para o AI
   * @param {Object} options - Opções adicionais
   * @returns {Object} Resposta da IA
   */
  async generateResponse(prompt, options = {}) {
    try {
      const startTime = Date.now();
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        response: text,
        executionTime,
        metadata: {
          model: 'gemini-2.5-flash-lite',
          timestamp: new Date().toISOString(),
          promptLength: prompt.length,
          responseLength: text.length,
          ...options
        }
      };
    } catch (error) {
      console.error('Erro na chamada do Gemini AI:', error);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - Date.now(),
        needsFallback: true
      };
    }
  }

  /**
   * Avalia a confiança de uma resposta
   * @param {string} response - Resposta da IA
   * @param {string} inputText - Texto original
   * @returns {number} Score de confiança (0-1)
   */
  calculateConfidenceScore(response, inputText) {
    // Lógica simples de avaliação de confiança
    // Pode ser expandida com ML models
    let confidence = 0.5; // Base

    // Verifica se a resposta contém elementos esperados
    if (response.length > 20) confidence += 0.1;
    if (response.includes('SELECT') || response.includes('SQL')) confidence += 0.2;
    if (response.includes('FROM') && response.includes('WHERE')) confidence += 0.1;
    if (!response.includes('erro') && !response.includes('desculpe')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Verifica se a resposta precisa de fallback
   * @param {Object} aiResponse - Resposta da IA
   * @param {number} confidenceScore - Score de confiança
   * @returns {boolean} Se precisa de fallback
   */
  needsFallback(aiResponse, confidenceScore) {
    if (!aiResponse.success) return true;
    if (confidenceScore < 0.3) return true;
    if (aiResponse.response.length < 10) return true;
    
    return false;
  }

  /**
   * Processa contexto de conversa para manter continuidade
   * @param {number} sessionId - ID da sessão
   * @returns {string} Contexto formatado
   */
  async buildConversationContext(sessionId) {
    try {
      const recentInteractions = await prisma.ai_interactions.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'desc' },
        take: 5, // Últimas 5 interações
        select: {
          input_text: true,
          ai_response: true,
          interaction_type: true,
          created_at: true
        }
      });

      if (recentInteractions.length === 0) return '';

      let context = "Contexto da conversa anterior:\n";
      recentInteractions.reverse().forEach((interaction, index) => {
        context += `${index + 1}. Usuário: ${interaction.input_text}\n`;
        if (interaction.ai_response?.response) {
          context += `   IA: ${interaction.ai_response.response.substring(0, 100)}...\n`;
        }
      });
      
      return context + "\nContinue a conversa considerando este contexto:\n";
    } catch (error) {
      console.error('Erro ao construir contexto:', error);
      return '';
    }
  }

  /**
   * Limpa cache expirado
   */
  async cleanExpiredCache() {
    try {
      const deleted = await prisma.ai_response_cache.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });
      console.log(`Cache limpo: ${deleted.count} registros removidos`);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
}

module.exports = AIService;
