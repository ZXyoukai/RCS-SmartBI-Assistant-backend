"""
Teste da API Simplificada - Apenas URL da Base de Dados
======================================================

Testa o endpoint /analyze-database com a nova versão simplificada.
"""

import requests
import json
import sys
import os
from datetime import datetime

def test_analyze_database_endpoint():
    """
    Testa o endpoint /analyze-database com apenas a URL da base de dados
    """
    
    print("🧪 TESTE DO ENDPOINT /analyze-database (SIMPLIFICADO)")
    print("=" * 60)
    
    # URL da API
    api_url = "http://localhost:8000/analyze-database"
    
    # Dados da requisição - APENAS A URL DA BASE DE DADOS
    request_data = {
        "database_url": "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    }
    
    try:
        print(f"📤 Enviando requisição para: {api_url}")
        print(f"📋 Dados da requisição:")
        print(f"   - database_url: {request_data['database_url'][:50]}...")
        
        # Faz a requisição POST
        response = requests.post(
            api_url,
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=300  # 5 minutos de timeout
        )
        
        print(f"\n📨 Resposta recebida:")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n✅ ANÁLISE CONCLUÍDA COM SUCESSO!")
            print(f"   - Message: {result.get('message', 'N/A')}")
            print(f"   - Source Type: {result.get('source_type', 'N/A')}")
            print(f"   - Processing Time: {result.get('processing_time', 0):.2f}s")
            print(f"   - Model Used: {result.get('model_used', 'N/A')}")
            
            # Informações da fonte
            source_info = result.get('source_info', {})
            print(f"\n📊 INFORMAÇÕES DA BASE DE DADOS:")
            print(f"   - Tipo: {source_info.get('database_type', 'N/A')}")
            print(f"   - Host: {source_info.get('host', 'N/A')}")
            print(f"   - Database: {source_info.get('database', 'N/A')}")
            print(f"   - Sample Limit: {source_info.get('sample_limit', 'N/A')}")
            
            # Resumo dos dados
            data_summary = result.get('data_summary', {})
            print(f"\n📈 RESUMO DOS DADOS:")
            print(f"   - Tabelas Processadas: {data_summary.get('tables_processed', 0)}")
            print(f"   - Total de Registros: {data_summary.get('total_records', 0)}")
            print(f"   - Método de Extração: {data_summary.get('extraction_method', 'N/A')}")
            
            # Resposta do Gemini (preview)
            gemini_response = result.get('gemini_response', '')
            print(f"\n🤖 ANÁLISE GEMINI (PREVIEW):")
            print(f"   {gemini_response[:500]}{'...' if len(gemini_response) > 500 else ''}")
            
            return True
            
        else:
            print(f"\n❌ ERRO NA REQUISIÇÃO:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Resposta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n⏰ TIMEOUT: A requisição demorou mais de 5 minutos")
        return False
        
    except requests.exceptions.ConnectionError:
        print(f"\n🔌 ERRO DE CONEXÃO: Verifique se o servidor está rodando")
        print(f"   Execute: python main.py")
        return False
        
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {str(e)}")
        return False


def test_api_root():
    """
    Testa se a API está rodando
    """
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor FastAPI está rodando")
            return True
        else:
            print(f"⚠️ Servidor respondeu com status {response.status_code}")
            return False
    except:
        print("❌ Servidor não está acessível")
        return False


if __name__ == "__main__":
    print(f"🚀 Iniciando teste - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Verifica se o servidor está rodando
    print("\n🔍 1. Verificando se o servidor está rodando...")
    if not test_api_root():
        print("\n💡 Para iniciar o servidor, execute:")
        print("   python main.py")
        sys.exit(1)
    
    # 2. Testa o endpoint principal
    print("\n🔍 2. Testando endpoint /analyze-database...")
    success = test_analyze_database_endpoint()
    
    if success:
        print(f"\n🎯 TESTE CONCLUÍDO COM SUCESSO!")
    else:
        print(f"\n⚠️ Teste falhou.")
        
    print(f"\n⏰ Teste finalizado - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
