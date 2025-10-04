"""
Teste da API de Análise de Base de Dados
========================================

Script para testar o novo endpoint /analyze-database via requisições HTTP.

"""

import requests
import json
import time
from datetime import datetime


def test_database_analysis_api():
    """
    Testa o endpoint /analyze-database
    """
    
    print("🚀 TESTE DA API DE ANÁLISE DE BASE DE DADOS")
    print("=" * 60)
    print(f"🕐 Início: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # URL da API
    base_url = "http://localhost:8000"
    
    # Dados de teste
    test_data = {
        "database_url": "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require",
        "sample_limit": 100
    }
    
    try:
        # 1. Testa se a API está online
        print("\n📡 1. Verificando se a API está online...")
        
        try:
            response = requests.get(f"{base_url}/", timeout=5)
            if response.status_code == 200:
                api_info = response.json()
                print(f"✅ API Online: {api_info['name']} v{api_info['version']}")
                print(f"   Tipos de conexão suportados: {api_info['connection_types']}")
                print(f"   Bases de dados suportadas: {api_info['supported_databases']}")
            else:
                print(f"⚠️ API respondeu com status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao conectar com a API: {e}")
            print("💡 Certifique-se de que o servidor está rodando em http://localhost:8000")
            return False
        
        # 2. Testa o health check
        print("\n🏥 2. Verificando saúde da aplicação...")
        
        try:
            response = requests.get(f"{base_url}/health", timeout=10)
            if response.status_code == 200:
                health_info = response.json()
                print(f"✅ Status: {health_info['status']}")
                print(f"   Gemini: {health_info['services']['gemini']}")
            else:
                print(f"⚠️ Health check falhou: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Erro no health check: {e}")
        
        # 3. Testa o novo endpoint /analyze-database
        print("\n🗄️ 3. Testando análise de base de dados...")
        print(f"   URL da base: {test_data['database_url'][:50]}...")
        print(f"   Limite de amostra: {test_data['sample_limit']}")
        
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{base_url}/analyze-database",
                json=test_data,
                timeout=60,  # 1 minuto de timeout
                headers={"Content-Type": "application/json"}
            )
            
            duration = time.time() - start_time
            print(f"   ⏱️ Tempo de resposta: {duration:.2f}s")
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✅ Análise concluída com sucesso!")
                print(f"   Status: {result['success']}")
                print(f"   Tipo de fonte: {result['source_type']}")
                print(f"   Tempo de processamento: {result['processing_time']:.2f}s")
                print(f"   Modelo usado: {result.get('model_used', 'N/A')}")
                
                # Informações da fonte
                source_info = result['source_info']
                print(f"   Base de dados: {source_info['database_type']}")
                print(f"   Host: {source_info['host']}")
                print(f"   Database: {source_info.get('database', 'N/A')}")
                
                # Resumo dos dados
                data_summary = result['data_summary']
                print(f"   Tabelas processadas: {data_summary['tables_processed']}")
                print(f"   Total de registros: {data_summary['total_records']}")
                
                # Preview da resposta do Gemini
                gemini_response = result['gemini_response']
                print(f"   Resposta Gemini (preview): {gemini_response[:200]}...")
                
                return True
                
            else:
                print(f"❌ Erro na análise: {response.status_code}")
                try:
                    error_info = response.json()
                    print(f"   Detalhes: {error_info.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"   Resposta: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            print("⏰ Timeout na requisição (>60s)")
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro na requisição: {e}")
            return False
    
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False
    
    finally:
        print(f"\n🕐 Fim: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)


def test_database_with_custom_query():
    """
    Testa o endpoint com uma query personalizada
    """
    
    print("\n🔍 TESTE COM QUERY PERSONALIZADA")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    
    # Dados com query personalizada
    test_data = {
        "database_url": "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require",
        "custom_query": "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' LIMIT 10",
        "sample_limit": 50
    }
    
    try:
        print(f"📝 Query: {test_data['custom_query']}")
        
        start_time = time.time()
        response = requests.post(
            f"{base_url}/analyze-database",
            json=test_data,
            timeout=30,
            headers={"Content-Type": "application/json"}
        )
        duration = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Query executada com sucesso! ({duration:.2f}s)")
            print(f"   Método de extração: {result['data_summary']['extraction_method']}")
            return True
        else:
            print(f"❌ Erro na query: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False


def test_invalid_database_url():
    """
    Testa validação com URL inválida
    """
    
    print("\n❌ TESTE DE VALIDAÇÃO (URL INVÁLIDA)")
    print("=" * 40)
    
    base_url = "http://localhost:8000"
    
    # URL inválida para testar validação
    test_data = {
        "database_url": "invalid://url",
        "sample_limit": 100
    }
    
    try:
        response = requests.post(
            f"{base_url}/analyze-database",
            json=test_data,
            timeout=10,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            error_info = response.json()
            print(f"✅ Validação funcionou: {error_info.get('detail', 'Erro de validação')}")
            return True
        else:
            print(f"⚠️ Validação não funcionou como esperado: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False


if __name__ == "__main__":
    print("🧪 SUITE DE TESTES DA API DE BASE DE DADOS")
    print("=" * 80)
    
    results = []
    
    # Executa testes
    print("\n[TESTE 1] Análise completa de base de dados")
    results.append(test_database_analysis_api())
    
    print("\n[TESTE 2] Query personalizada")
    results.append(test_database_with_custom_query())
    
    print("\n[TESTE 3] Validação de URL inválida")
    results.append(test_invalid_database_url())
    
    # Resultado final
    passed = sum(results)
    total = len(results)
    
    print(f"\n🎯 RESULTADO FINAL: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 TODOS OS TESTES PASSARAM!")
    else:
        print("⚠️ Alguns testes falharam.")
    
    print("=" * 80)
