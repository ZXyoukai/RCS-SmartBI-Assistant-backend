#!/usr/bin/env python3
"""
Teste específico do arquivo PostgreSQL
"""

import sys
import os
sys.path.append('.')

from ml_pipeline import MLPipeline
import traceback

def test_postgresql():
    print("🚀 Testando arquivo PostgreSQL")
    
    try:
        # 1. Inicializa pipeline
        pipeline = MLPipeline()
        
        # 2. Executa processamento
        print("📊 Executando pipeline...")
        result = pipeline.run_pipeline('exemplo_postgresql.sql', 'sql')
        
        if not result['success']:
            print(f"❌ Pipeline falhou: {result['error']}")
            print("📍 Erro detalhado:")
            print(result.get('traceback', 'Nenhum traceback disponível'))
            return
        
        print("✅ Pipeline executado com sucesso!")
        print(f"📋 Dataset: {result['data_info']['rows']} linhas, {result['data_info']['columns']} colunas")
        
    except Exception as e:
        print(f"💥 Erro durante o teste: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_postgresql()