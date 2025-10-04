"""
Exemplo de Uso - Insights Específicos Estratégicos
=================================================

Demonstra como usar o novo endpoint /specific-insights para obter
insights estratégicos específicos de uma base de dados.
"""

import requests
import json

def exemplo_insights_especificos():
    """
    Exemplo prático de como usar o endpoint de insights específicos
    """
    
    print("🎯 EXEMPLO: INSIGHTS ESPECÍFICOS ESTRATÉGICOS")
    print("=" * 60)
    
    # 1. Configuração
    api_url = "http://localhost:8000/specific-insights"
    database_url = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    
    # 2. Exemplos de solicitações específicas
    exemplos_solicitacoes = [
        "Com base nos pedidos deste mês, quais são os produtos mais vendidos e que estratégias posso implementar para aumentar as vendas?",
        "Analise o comportamento dos meus clientes e me dê insights sobre segmentação e oportunidades de fidelização",
        "Quais categorias de produtos têm melhor performance financeira e onde devo focar meus investimentos?",
        "Baseado nos dados de vendas, identifique tendências sazonais e oportunidades de crescimento"
    ]
    
    print("📋 EXEMPLOS DE SOLICITAÇÕES:")
    for i, solicitacao in enumerate(exemplos_solicitacoes, 1):
        print(f"{i}. {solicitacao}")
    print()
    
    # 3. Executa um exemplo
    solicitacao_exemplo = exemplos_solicitacoes[0]  # Primeira solicitação
    
    print(f"🚀 EXECUTANDO EXEMPLO:")
    print(f"💭 Solicitação: {solicitacao_exemplo}")
    print()
    
    try:
        # Preparar dados da requisição
        payload = {
            "database_url": database_url,
            "insight_request": solicitacao_exemplo
        }
        
        print("📡 Enviando requisição para a API...")
        
        # Fazer requisição
        response = requests.post(
            api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ SUCESSO! Insights gerados:")
            print()
            print("📊 INFORMAÇÕES DA ANÁLISE:")
            print(f"   🏢 Tipo de DB: {data['database_info']['database_type']}")
            print(f"   📋 Tabelas: {data['database_info']['tables_analyzed']}")
            print(f"   📊 Registros: {data['database_info']['records_analyzed']}")
            print(f"   ⏱️ Tempo: {data['processing_time']:.2f}s")
            print(f"   🤖 Modelo: {data['model_used']}")
            print()
            
            print("🎯 INSIGHTS ESTRATÉGICOS:")
            print("=" * 50)
            print(data['strategic_insights'])
            print("=" * 50)
            
        else:
            print(f"❌ ERRO: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Detalhes: {error_data.get('detail', 'Erro desconhecido')}")
            except:
                print(f"Resposta: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ ERRO: Não foi possível conectar à API")
        print("💡 Certifique-se de que a API está rodando em http://localhost:8000")
        
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")


def como_usar():
    """
    Instruções de como usar o endpoint
    """
    
    print("📚 COMO USAR O ENDPOINT DE INSIGHTS ESPECÍFICOS")
    print("=" * 60)
    
    print("🔧 ENDPOINT: POST /specific-insights")
    print()
    
    print("📋 PARÂMETROS OBRIGATÓRIOS:")
    print("• database_url: URL de conexão com a base de dados")
    print("• insight_request: Descrição específica do insight desejado")
    print()
    
    print("🌐 FORMATOS DE URL SUPORTADOS:")
    print("• PostgreSQL: postgresql://user:password@host:port/database")
    print("• MySQL: mysql://user:password@host:port/database")
    print("• SQLite: sqlite:///path/to/database.db")
    print()
    
    print("💭 EXEMPLOS DE SOLICITAÇÕES:")
    exemplos = [
        "Analise as vendas do último trimestre e identifique oportunidades",
        "Quais clientes são mais valiosos e como fidelizá-los?",
        "Baseado nos dados de estoque, quais produtos devo priorizar?",
        "Identifique tendências de crescimento nos meus dados de usuários",
        "Analise a performance financeira e sugira melhorias"
    ]
    
    for i, exemplo in enumerate(exemplos, 1):
        print(f"{i}. {exemplo}")
    print()
    
    print("📊 EXEMPLO DE REQUISIÇÃO JSON:")
    exemplo_json = {
        "database_url": "postgresql://user:password@host:port/database",
        "insight_request": "De acordo com os pedidos deste mês, me dê insights sobre performance de vendas"
    }
    print(json.dumps(exemplo_json, indent=2, ensure_ascii=False))
    print()
    
    print("✅ RESPOSTA ESPERADA:")
    print("• success: true/false")
    print("• strategic_insights: Análise estratégica detalhada")
    print("• database_info: Informações da base de dados analisada")
    print("• processing_time: Tempo de processamento em segundos")
    print("• model_used: Modelo de IA utilizado")


if __name__ == "__main__":
    print("🚀 EXEMPLO DE USO - INSIGHTS ESPECÍFICOS")
    print("=" * 80)
    
    # Mostra instruções
    como_usar()
    print()
    
    # Executa exemplo
    exemplo_insights_especificos()
    
    print()
    print("🎉 EXEMPLO CONCLUÍDO!")
    print("=" * 80)
