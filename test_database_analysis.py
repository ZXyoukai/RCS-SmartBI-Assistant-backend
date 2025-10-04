"""
Teste do Sistema de Análise via Base de Dados
=============================================

Script de teste para demonstrar a funcionalidade de análise via conexão com base de dados.

Autor: SmartBI Team
Versão: 2.0.0
Data: 2025
"""

import requests
import json
import sqlite3
import os
from pathlib import Path

def create_test_database():
    """
    Cria uma base de dados SQLite de teste com dados de exemplo
    """
    db_path = "test_calmai.db"
    
    # Remove base de dados existente
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Cria nova base de dados
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Cria tabelas baseadas no arquivo calmai.sql
    cursor.execute("""
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT NOT NULL,
            user_type TEXT NOT NULL,
            created_at TEXT,
            status TEXT DEFAULT '1'
        )
    """)
    
    cursor.execute("""
        CREATE TABLE products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            category_id TEXT,
            created_at TEXT,
            status TEXT DEFAULT '0'
        )
    """)
    
    cursor.execute("""
        CREATE TABLE orders (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            total_price REAL NOT NULL,
            quantity INTEGER DEFAULT 0,
            status TEXT DEFAULT '0',
            payment_method TEXT NOT NULL,
            created_at TEXT
        )
    """)
    
    # Insere dados de exemplo
    users_data = [
        ('1', 'Administrador', 'admin@gmail.com', '945006657', 'admin', '2025-05-02 10:53:59', '1'),
        ('2', 'GOMES MATEUS', 'gomesfranciscomateus18@gmail.com', '957572348', 'affiliate', '2025-05-02 11:08:52', '1'),
        ('3', 'Gomes Francisco Mateus', 'gomesfranciscomateus20@gmail.com', '941135188', 'seller', '2025-05-02 10:54:38', '1')
    ]
    
    products_data = [
        ('1', 'Blusa Feminina', 'Blusa Feminina de alta qualidade', 10000, 9, 'cat1', '2025-05-02 11:04:13', '1'),
        ('2', 'Camisa Masculina', 'Camisa social masculina', 15000, 15, 'cat1', '2025-05-02 11:04:13', '1'),
        ('3', 'Vestido Elegante', 'Vestido para ocasiões especiais', 25000, 5, 'cat1', '2025-05-02 11:04:13', '1')
    ]
    
    orders_data = [
        ('1', 'Cristina Mateus', 46500, 3, '3', 'CASH', '2025-05-02 11:10:45'),
        ('2', 'João Silva', 30000, 2, '1', 'CARD', '2025-05-02 12:15:30'),
        ('3', 'Maria Santos', 25000, 1, '2', 'TRANSFER', '2025-05-02 14:20:15')
    ]
    
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users_data)
    cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)", products_data)
    cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", orders_data)
    
    conn.commit()
    conn.close()
    
    return f"sqlite:///{os.path.abspath(db_path)}"

def test_database_analysis():
    """
    Testa a análise via base de dados
    """
    print("🧪 Iniciando teste de análise via base de dados...")
    
    # Cria base de dados de teste
    db_url = create_test_database()
    print(f"✅ Base de dados de teste criada: {db_url}")
    
    # Dados da requisição
    request_data = {
        "database_url": db_url,
        "sample_limit": 100
    }
    
    # Endpoint do servidor
    url = "http://localhost:8000/analyze-database"
    
    try:
        print("📡 Enviando requisição para análise...")
        response = requests.post(
            url, 
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=120  # 2 minutos de timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Análise concluída com sucesso!")
            print(f"📊 Tipo de fonte: {result['source_type']}")
            print(f"🗄️ Tipo de base de dados: {result['source_info']['database_type']}")
            print(f"📋 Tabelas processadas: {result['data_summary']['tables_processed']}")
            print(f"📝 Total de registros: {result['data_summary']['total_records']}")
            print(f"⏱️ Tempo de processamento: {result['processing_time']}s")
            print(f"🤖 Modelo usado: {result['model_used']}")
            print("\n🧠 Análise do Gemini:")
            print("=" * 50)
            print(result['gemini_response'][:500] + "..." if len(result['gemini_response']) > 500 else result['gemini_response'])
            
        else:
            print(f"❌ Erro na requisição: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando. Execute 'python main.py' primeiro.")
    except requests.exceptions.Timeout:
        print("❌ Erro: Timeout na requisição. A análise pode demorar mais tempo.")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

def test_custom_query():
    """
    Testa análise com consulta personalizada
    """
    print("\n🔍 Testando análise com consulta personalizada...")
    
    # Cria base de dados de teste
    db_url = create_test_database()
    
    # Dados da requisição com consulta personalizada
    request_data = {
        "database_url": db_url,
        "custom_query": "SELECT u.name, u.user_type, COUNT(o.id) as total_orders FROM users u LEFT JOIN orders o ON u.name = o.client_name GROUP BY u.name, u.user_type",
        "sample_limit": 50
    }
    
    url = "http://localhost:8000/analyze-database"
    
    try:
        response = requests.post(
            url, 
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Análise com consulta personalizada concluída!")
            print(f"🔍 Método de extração: {result['data_summary']['extraction_method']}")
            print(f"📝 Registros retornados: {result['data_summary']['total_records']}")
            print("\n🧠 Análise do Gemini:")
            print("=" * 50)
            print(result['gemini_response'][:500] + "..." if len(result['gemini_response']) > 500 else result['gemini_response'])
            
        else:
            print(f"❌ Erro na requisição: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    print("🚀 SmartBI Assistant - Teste de Análise via Base de Dados")
    print("=" * 60)
    
    # Teste 1: Análise básica de tabelas
    test_database_analysis()
    
    # Teste 2: Análise com consulta personalizada
    test_custom_query()
    
    print("\n✅ Testes concluídos!")
    print("\n📚 Para testar com uma base de dados real, use URLs como:")
    print("   - MySQL: mysql://user:password@host:port/database")
    print("   - PostgreSQL: postgresql://user:password@host:port/database")
    print("   - SQLite: sqlite:///path/to/database.db")
