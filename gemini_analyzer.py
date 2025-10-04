"""
GeminiAnalyzer - Módulo de análise usando Google Gemini API
===========================================================

Este módulo é responsável por enviar dados para o Google Gemini e processar
as respostas para gerar insights estratégicos de negócios.

Autor: SmartBI Team
Versão: 2.0.0
"""

import google.generativeai as genai
import os
import json
import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

logger = logging.getLogger(__name__)


class GeminiAnalyzer:
    """
    Classe responsável pela análise de dados usando Google Gemini API
    """
    
    def __init__(self):
        """
        Inicializa o analisador Gemini
        """
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-2.5-flash-lite"  # Modelo mais recente e eficiente
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                logger.info("✅ Gemini API configurada com sucesso")
            except Exception as e:
                logger.error(f"❌ Erro ao configurar Gemini API: {e}")
                raise
        else:
            logger.warning("⚠️ GEMINI_API_KEY não encontrada nas variáveis de ambiente")
    
    
    def check_connection(self) -> bool:
        """
        Verifica se a conexão com Gemini está funcionando
        
        Returns:
            bool: True se conectado, False caso contrário
        """
        try:
            if not self.model:
                return False
            
            # Teste simples para verificar a conexão
            response = self.model.generate_content("Test connection")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao verificar conexão Gemini: {e}")
            return False
    
    
    def _create_analysis_prompt(self, data_content: str, data_info: Dict, file_type: str) -> str:
        """
        Cria o prompt para análise estratégica de negócios
        
        Args:
            data_content: Conteúdo dos dados (SQL/CSV)
            data_info: Informações sobre os dados
            file_type: Tipo do arquivo (csv/sql)
        
        Returns:
            str: Prompt formatado para o Gemini
        """
        
        # Prompt estratégico direto
        main_prompt = """
Analise o SQL ou csv que você enviou (estrutura das tabelas, inserts, dados) e traga um resumo em linguagem de negócios.
Você é um consultor estratégico sênior de uma das Big 4 (McKinsey, BCG, Bain, Deloitte) analisando dados empresariais para o C-Level de uma organização.
OBJETIVO: Analise os dados fornecidos e gere insights estratégicos como um partner experiente de consultoria de negócios.
METODOLOGIA EXIGIDA:
RESUMO EXECUTIVO: Traduza a estrutura e volume de dados para linguagem de negócios, identificando maturidade organizacional, complexidade operacional e posicionamento competitivo
INSIGHTS ESTRATÉGICOS: Desenvolva 4-6 insights de alto impacto focando em:
Oportunidades de crescimento e expansão de mercado
Otimização de revenue streams e pricing strategy
Eficiência operacional e redução de custos
Vantagem competitiva e diferenciação
Gestão de risco e compliance
Potencial de transformação digital
RECOMENDAÇÕES EXECUTIVAS: Forneça 5-7 recomendações específicas e acionáveis com:
Impacto financeiro estimado (ROI, revenue upside, cost savings)
Timeline de implementação
Priorização baseada em esforço vs impacto
Considerações de investimento e recursos
ESTILO E TOM:
Linguagem executiva sofisticada (C-Level appropriate)
Quantificação de oportunidades com métricas de negócio
Foco em value creation e competitive advantage
Referências a frameworks estratégicos (Porter, Ansoff, Blue Ocean)
Benchmarking setorial e best practices
IMPORTANTE:
NÃO mencione aspectos técnicos de TI, programação ou detalhes de implementação
FOQUE exclusivamente em strategic business value
USE linguagem de consultoria estratégica empresarial
QUANTIFIQUE oportunidades sempre que possível
PRIORIZE insights que impactem P&L, market share ou operational excellence

DADOS PARA ANÁLISE:
"""
        
        return f"{main_prompt}\n\n{data_content}"
    
    

    
    
    async def analyze_data(self, data_content: str, data_info: Dict, file_type: str) -> Dict[str, Any]:
        """
        Realiza análise dos dados usando Gemini
        
        Args:
            data_content: Conteúdo dos dados (SQL/CSV)
            data_info: Informações sobre os dados
            file_type: Tipo do arquivo (csv/sql)
        
        Returns:
            Dict: Resposta do Gemini em formato JSON
        """
        
        if not self.model:
            raise Exception("Gemini API não configurada. Verifique a GEMINI_API_KEY")
        
        start_time = time.time()
        
        try:
            # 1. Criar prompt
            prompt = self._create_analysis_prompt(data_content, data_info, file_type)
            
            logger.info(f"🤖 Enviando dados para Gemini (prompt: {len(prompt)} chars)")
            
            # 2. Enviar para Gemini
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                raise Exception("Resposta vazia do Gemini")
            
            response_text = response.text.strip()
            logger.info(f"✅ Resposta recebida do Gemini ({len(response_text)} chars)")
            
            # 3. Preparar resultado final (apenas a resposta do Gemini)
            processing_time = time.time() - start_time
            
            result = {
                "gemini_response": response_text,
                "processing_time": round(processing_time, 2),
                "model_used": self.model_name,
                "analyzed_at": datetime.now().isoformat()
            }
            
            logger.info(f"🎯 Análise concluída em {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"Erro na análise Gemini: {e}")
            raise Exception(f"Erro ao processar análise: {str(e)}")
    



    def get_model_info(self) -> Dict[str, Any]:
        """
        Retorna informações sobre o modelo Gemini em uso
        
        Returns:
            Dict: Informações do modelo
        """
        return {
            "model_name": self.model_name,
            "provider": "Google Gemini",
            "configured": self.model is not None,
            "api_key_present": bool(self.api_key)
        }
