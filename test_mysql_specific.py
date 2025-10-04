"""
Teste Específico para MySQL
==========================

Script para testar a conexão MySQL com SSL.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_connector import DatabaseConnector
import logging

# Configurar logging para ver mais detalhes
logging.basicConfig(level=logging.INFO)

def test_mysql_connection():
    print("🧪 Teste específico de conexão MySQL")
    print("=" * 50)
    
    # URL MySQL do Aiven (exemplo fornecido)
    mysql_url = "mysql://avnadmin:AVNS_E32b0q-c_kZ3Wvhjjeq@wooki-wooki.e.aivencloud.com:24234/defaultdb?ssl-mode=REQUIRED"
    
    try:
        db_connector = DatabaseConnector()
        
        print("1. 🔍 Testando validação da URL MySQL...")
        is_valid, message = db_connector.validate_database_url(mysql_url)
        print(f"   Válida: {is_valid}")
        print(f"   Mensagem: {message}")
        
        if not is_valid:
            print("❌ URL inválida, parando teste")
            return False
        
        print("\n2. 🔌 Tentando conectar ao MySQL...")
        connection_info = db_connector.connect_to_database(mysql_url)
        print(f"   ✅ Conectado!")
        print(f"   Tipo: {connection_info['database_type']}")
        print(f"   Host: {connection_info['host']}")
        print(f"   Database: {connection_info.get('database', 'N/A')}")
        
        print("\n3. 📋 Testando extração de esquema...")
        schema_info = db_connector.get_database_schema()
        print(f"   ✅ Esquema extraído!")
        print(f"   Total de tabelas: {schema_info['total_tables']}")
        
        # Lista algumas tabelas
        table_count = 0
        for table_name, table_info in schema_info['tables'].items():
            if table_count < 5:  # Mostra apenas as primeiras 5
                print(f"   - Tabela '{table_name}': {table_info['column_count']} colunas, {table_info['row_count']} registros")
                table_count += 1
        
        print("\n4. 📊 Testando extração de dados...")
        sample_data = db_connector.extract_sample_data(limit=10)
        print(f"   ✅ Dados extraídos!")
        print(f"   Tabelas processadas: {sample_data['tables_processed']}")
        print(f"   Total de registros: {sample_data['total_records']}")
        
        print("\n5. 🔐 Fechando conexão...")
        db_connector.close_connection()
        print("   ✅ Conexão fechada")
        
        print("\n🎉 TESTE MYSQL CONCLUÍDO COM SUCESSO!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE MYSQL: {str(e)}")
        print(f"Tipo do erro: {type(e).__name__}")
        
        # Informações adicionais para debug
        import traceback
        print("\nTraceback completo:")
        traceback.print_exc()
        
        return False

def test_mysql_validation_only():
    """Teste apenas da validação"""
    print("\n🔍 TESTE DE VALIDAÇÃO APENAS")
    print("=" * 30)
    
    urls_teste = [
        "mysql://user:pass@host:3306/db",
        "mysql://avnadmin:pass@wooki-wooki.e.aivencloud.com:24234/defaultdb",
        "mysql://avnadmin:pass@wooki-wooki.e.aivencloud.com:24234/defaultdb?ssl-mode=REQUIRED",
        "postgresql://user:pass@host:5432/db",  # Para comparação
    ]
    
    db_connector = DatabaseConnector()
    
    for url in urls_teste:
        print(f"\nURL: {url[:50]}...")
        is_valid, message = db_connector.validate_database_url(url)
        print(f"  Válida: {is_valid}")
        print(f"  Mensagem: {message}")

if __name__ == "__main__":
    print("🚀 Iniciando testes MySQL")
    
    # Primeiro teste: apenas validação
    test_mysql_validation_only()
    
    # Segundo teste: conexão completa
    success = test_mysql_connection()
    
    if success:
        print("\n✅ Todos os testes MySQL passaram!")
    else:
        print("\n⚠️ Teste MySQL falhou - verifique a configuração")
