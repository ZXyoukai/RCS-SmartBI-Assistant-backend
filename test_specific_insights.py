"""
Teste do Endpoint de Insights Específicos
========================================

Testa o novo endpoint /specific-insights com diferentes tipos de solicitações.
"""

import requests
import json
from datetime import datetime

# Configuração da API
API_URL = "http://localhost:8000"

# URL da base de dados (substitua pela sua)
DATABASE_URL = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"

def test_specific_insights():
    """
    Testa diferentes tipos de solicitações de insights específicos
    """
    
    print("🎯 TESTE DO ENDPOINT DE INSIGHTS ESPECÍFICOS")
    print("=" * 60)
    print(f"⏰ Iniciado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 API URL: {API_URL}")
    print()
    
    # Diferentes tipos de solicitações de insights
    test_requests = [
        {
            "name": "Análise de Pedidos do Mês",
            "insight_request": "De acordo com os pedidos realizados neste mês, me dê insights estratégicos sobre performance de vendas, produtos mais vendidos e oportunidades de crescimento"
        },
        {
            "name": "Comportamento de Clientes",
            "insight_request": "Analise o comportamento dos usuários com base nos dados disponíveis e identifique padrões de uso, segmentação e oportunidades de engajamento"
        },
        {
            "name": "Análise Financeira",
            "insight_request": "Com base nos dados financeiros disponíveis, quais são os principais insights sobre rentabilidade, custos e oportunidades de otimização?"
        },
        {
            "name": "Análise de Produtos",
            "insight_request": "Quais produtos ou categorias têm melhor performance e quais estratégias podem ser implementadas para aumentar as vendas?"
        }
    ]
    
    successful_tests = 0
    
    for i, test_case in enumerate(test_requests, 1):
        print(f"🧪 TESTE {i}: {test_case['name']}")
        print(f"💭 Solicitação: {test_case['insight_request'][:80]}...")
        print()
        
        try:
            # Preparar dados da requisição
            payload = {
                "database_url": DATABASE_URL,
                "insight_request": test_case['insight_request']
            }
            
            # Fazer a requisição
            print("📡 Enviando requisição...")
            response = requests.post(
                f"{API_URL}/specific-insights",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120  # 2 minutos de timeout
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print("✅ SUCESSO!")
                print(f"   🏢 Database: {data['database_info']['database_type']}")
                print(f"   📋 Tabelas analisadas: {data['database_info']['tables_analyzed']}")
                print(f"   📊 Registros analisados: {data['database_info']['records_analyzed']}")
                print(f"   ⏱️ Tempo de processamento: {data['processing_time']:.2f}s")
                print(f"   🤖 Modelo usado: {data['model_used']}")
                print()
                print("🎯 INSIGHTS ESTRATÉGICOS:")
                print("-" * 40)
                insights = data['strategic_insights']
                # Mostra os primeiros 500 caracteres dos insights
                preview = insights[:500] + "..." if len(insights) > 500 else insights
                print(preview)
                print()
                
                successful_tests += 1
                
            else:
                print(f"❌ ERRO: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Detalhes: {error_data.get('detail', 'Erro desconhecido')}")
                except:
                    print(f"   Resposta: {response.text[:200]}...")
                print()
            
        except requests.exceptions.Timeout:
            print("⏰ TIMEOUT: A requisição demorou mais que 2 minutos")
            print()
            
        except requests.exceptions.ConnectionError:
            print("🔌 ERRO DE CONEXÃO: Verifique se a API está rodando")
            print()
            
        except Exception as e:
            print(f"❌ ERRO INESPERADO: {str(e)}")
            print()
        
        print("=" * 60)
    
    # Resumo dos testes
    print(f"📈 RESUMO DOS TESTES")
    print(f"   Total de testes: {len(test_requests)}")
    print(f"   Sucessos: {successful_tests}")
    print(f"   Falhas: {len(test_requests) - successful_tests}")
    print(f"   Taxa de sucesso: {(successful_tests/len(test_requests)*100):.1f}%")
    print()
    print(f"⏰ Finalizado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def test_validation_errors():
    """
    Testa validações de entrada do endpoint
    """
    
    print("🔍 TESTE DE VALIDAÇÕES")
    print("=" * 40)
    
    invalid_requests = [
        {
            "name": "URL vazia",
            "payload": {"database_url": "", "insight_request": "Teste"}
        },
        {
            "name": "Insight muito curto",
            "payload": {"database_url": DATABASE_URL, "insight_request": "Test"}
        },
        {
            "name": "URL inválida",
            "payload": {"database_url": "invalid-url", "insight_request": "Teste de validação"}
        }
    ]
    
    for test_case in invalid_requests:
        print(f"🧪 {test_case['name']}")
        
        try:
            response = requests.post(
                f"{API_URL}/specific-insights",
                json=test_case['payload'],
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 422:  # Validation Error
                print("✅ Validação funcionando corretamente")
                error_data = response.json()
                print(f"   Erro: {error_data.get('detail', [{}])[0].get('msg', 'N/A')}")
            else:
                print(f"❌ Esperado 422, recebido {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro: {e}")
        
        print()


if __name__ == "__main__":
    print("🚀 INICIANDO TESTES DO ENDPOINT DE INSIGHTS ESPECÍFICOS")
    print("=" * 80)
    
    # Verifica se a API está rodando
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API está online e funcionando")
            print()
            
            # Executa testes
            test_specific_insights()
            print()
            test_validation_errors()
            
        else:
            print(f"⚠️ API respondeu com status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: API não está rodando")
        print("💡 Inicie a API com: python main.py")
        
    except Exception as e:
        print(f"❌ Erro ao verificar API: {e}")
    
    print("🏁 TESTES FINALIZADOS")
    print("=" * 80)
