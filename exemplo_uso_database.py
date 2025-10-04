"""
Exemplo de Uso - Análise de Base de Dados
=========================================

Exemplos práticos de como usar a nova funcionalidade de análise via base de dados.

"""

import requests
import json


def exemplo_basico():
    """
    Exemplo básico de uso
    """
    
    print("📖 EXEMPLO 1: Análise Básica de Base de Dados")
    print("=" * 50)
    
    # URL da sua base de dados
    database_url = "postgresql://user:password@host:port/database"
    
    # Dados para enviar
    dados = {
        "database_url": database_url,
        "sample_limit": 1000  # Opcional: limite de registros por tabela
    }
    
    try:
        # Faz a requisição
        response = requests.post(
            "http://localhost:8000/analyze-database",
            json=dados,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            resultado = response.json()
            
            print("✅ Análise concluída!")
            print(f"Base de dados: {resultado['source_info']['database_type']}")
            print(f"Tabelas analisadas: {resultado['data_summary']['tables_processed']}")
            print(f"Insights do Gemini:")
            print(resultado['gemini_response'])
            
        else:
            print(f"❌ Erro: {response.status_code}")
            print(response.json())
            
    except Exception as e:
        print(f"❌ Erro: {e}")


def exemplo_query_personalizada():
    """
    Exemplo com query personalizada
    """
    
    print("\n📖 EXEMPLO 2: Query Personalizada")
    print("=" * 50)
    
    # Sua query SQL (apenas SELECT permitido)
    query_sql = """
    SELECT 
        category,
        COUNT(*) as total_products,
        AVG(price) as avg_price,
        MAX(price) as max_price
    FROM products 
    WHERE status = 'active'
    GROUP BY category
    ORDER BY total_products DESC
    """
    
    dados = {
        "database_url": "postgresql://user:password@host:port/database",
        "custom_query": query_sql,
        "sample_limit": 500
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analyze-database",
            json=dados,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Query executada!")
            print(f"Registros retornados: {resultado['data_summary']['total_records']}")
            print("Análise dos resultados:")
            print(resultado['gemini_response'])
            
    except Exception as e:
        print(f"❌ Erro: {e}")


def exemplo_diferentes_bases():
    """
    Exemplos para diferentes tipos de base de dados
    """
    
    print("\n📖 EXEMPLO 3: Diferentes Tipos de Base de Dados")
    print("=" * 50)
    
    exemplos_urls = {
        "PostgreSQL (Neon)": "postgresql://user:pass@ep-example.neon.tech/dbname?sslmode=require",
        "PostgreSQL (Local)": "postgresql://user:password@localhost:5432/database",
        "MySQL": "mysql://user:password@localhost:3306/database",
        "SQLite": "sqlite:///path/to/database.db"
    }
    
    print("URLs de exemplo por tipo de base de dados:")
    for tipo, url in exemplos_urls.items():
        print(f"  {tipo}:")
        print(f"    {url}")
    
    print("\nNota: Substitua 'user', 'password', 'host', 'port' e 'database' pelos seus valores reais.")


def exemplo_tratamento_erros():
    """
    Exemplo de tratamento de erros
    """
    
    print("\n📖 EXEMPLO 4: Tratamento de Erros")
    print("=" * 50)
    
    dados = {
        "database_url": "postgresql://user:wrongpass@host/db"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/analyze-database",
            json=dados,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Sucesso!")
        elif response.status_code == 400:
            erro = response.json()
            print(f"❌ Erro de validação: {erro['detail']}")
        elif response.status_code == 500:
            print("❌ Erro interno do servidor")
        else:
            print(f"❌ Erro {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao servidor")
    except requests.exceptions.Timeout:
        print("❌ Erro: Timeout na requisição")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")


def exemplo_curl():
    """
    Exemplo usando cURL
    """
    
    print("\n📖 EXEMPLO 5: Usando cURL")
    print("=" * 50)
    
    curl_command = '''
curl -X POST "http://localhost:8000/analyze-database" \\
     -H "Content-Type: application/json" \\
     -d '{
       "database_url": "postgresql://user:pass@host:port/database",
       "sample_limit": 1000
     }'
    '''
    
    print("Comando cURL:")
    print(curl_command)


if __name__ == "__main__":
    print("🚀 EXEMPLOS DE USO - ANÁLISE DE BASE DE DADOS")
    print("=" * 80)
    
    # Executa exemplos (comentados para não fazer requisições reais)
    # exemplo_basico()
    # exemplo_query_personalizada()
    exemplo_diferentes_bases()
    exemplo_tratamento_erros()
    exemplo_curl()
    
    print("\n💡 DICAS:")
    print("- Certifique-se de que o servidor está rodando em http://localhost:8000")
    print("- Use apenas queries SELECT para consultas personalizadas")
    print("- O limite de amostra padrão é 1000 registros por tabela")
    print("- URLs devem incluir credenciais de autenticação")
    print("- Para PostgreSQL, use sslmode=require para conexões seguras")
    
    print("=" * 80)
