"""
Exemplo de Uso da API SmartBI - Versão Simplificada
==================================================

Este exemplo mostra como usar o endpoint /analyze-database 
com apenas a URL da base de dados.

"""

import requests
import json

def exemplo_analise_postgresql():
    """
    Exemplo de análise de uma base de dados PostgreSQL
    """
    
    print("🐘 EXEMPLO: Análise de Base de Dados PostgreSQL")
    print("=" * 50)
    
    # URL da API SmartBI
    api_url = "http://localhost:8000/analyze-database"
    
    # Dados da requisição - APENAS A URL DA BASE DE DADOS
    dados_requisicao = {
        "database_url": "postgresql://usuario:senha@servidor:porta/base_dados"
    }
    
    print("📤 Enviando requisição...")
    print(f"URL: {api_url}")
    print(f"Dados: {json.dumps(dados_requisicao, indent=2)}")
    
    try:
        # Envia a requisição
        resposta = requests.post(
            api_url,
            json=dados_requisicao,
            headers={"Content-Type": "application/json"}
        )
        
        if resposta.status_code == 200:
            resultado = resposta.json()
            
            print("\n✅ ANÁLISE CONCLUÍDA!")
            print(f"🤖 Resposta do Gemini:")
            print(resultado['gemini_response'])
            
        else:
            print(f"\n❌ Erro: {resposta.status_code}")
            print(resposta.text)
            
    except Exception as e:
        print(f"\n❌ Erro na requisição: {e}")


def exemplo_analise_mysql():
    """
    Exemplo de análise de uma base de dados MySQL
    """
    
    print("\n🐬 EXEMPLO: Análise de Base de Dados MySQL")
    print("=" * 50)
    
    # URL da API SmartBI
    api_url = "http://localhost:8000/analyze-database"
    
    # Dados da requisição - APENAS A URL DA BASE DE DADOS
    dados_requisicao = {
        "database_url": "mysql://usuario:senha@servidor:porta/base_dados"
    }
    
    print("📤 Enviando requisição...")
    print(f"URL: {api_url}")
    print(f"Dados: {json.dumps(dados_requisicao, indent=2)}")
    
    # O código de requisição seria o mesmo...
    print("💡 Use o mesmo código do exemplo PostgreSQL")


def exemplo_usando_curl():
    """
    Mostra como usar a API com curl
    """
    
    print("\n🌐 EXEMPLO: Usando curl")
    print("=" * 25)
    
    comando_curl = '''curl -X POST "http://localhost:8000/analyze-database" \\
     -H "Content-Type: application/json" \\
     -d '{
       "database_url": "postgresql://usuario:senha@servidor:porta/base_dados"
     }'
'''
    
    print("Comando curl:")
    print(comando_curl)


def exemplos_urls_validas():
    """
    Mostra exemplos de URLs válidas para diferentes tipos de base de dados
    """
    
    print("\n📋 EXEMPLOS DE URLs VÁLIDAS")
    print("=" * 30)
    
    exemplos = {
        "PostgreSQL": [
            "postgresql://user:password@localhost:5432/mydatabase",
            "postgresql://user:pass@server.com/db?sslmode=require",
            "postgresql://user:pass@ep-server.neon.tech/db?sslmode=require"
        ],
        "MySQL": [
            "mysql://user:password@localhost:3306/mydatabase",
            "mysql://user:pass@server.com:3306/db"
        ],
        "SQLite": [
            "sqlite:///path/to/database.db",
            "sqlite:///./mydatabase.db"
        ]
    }
    
    for db_type, urls in exemplos.items():
        print(f"\n{db_type}:")
        for url in urls:
            print(f"  - {url}")


if __name__ == "__main__":
    print("🚀 SmartBI Assistant - Exemplos de Uso")
    print("=" * 40)
    
    # Mostra exemplos de URLs
    exemplos_urls_validas()
    
    # Mostra exemplo com curl
    exemplo_usando_curl()
    
    print("\n" + "=" * 40)
    print("💡 Para testar com dados reais:")
    print("1. Inicie o servidor: python main.py")
    print("2. Execute: python test_api_simplificado.py")
    print("3. Ou use o curl acima com sua URL real")
