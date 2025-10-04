"""
Teste Melhorado - Extração de Todas as Tabelas
==============================================
"""

import sys
import os
from datetime import datetime

# Adiciona o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_connector import DatabaseConnector

def test_all_tables():
    print("🧪 TESTE DE EXTRAÇÃO DE TODAS AS TABELAS")
    print("=" * 50)
    
    # URL de teste
    database_url = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    
    try:
        db_connector = DatabaseConnector()
        
        print("1. 🔌 Conectando à base de dados...")
        connection_info = db_connector.connect_to_database(database_url)
        print(f"   ✅ Conectado: {connection_info['database_type']}")
        
        print("\n2. 📋 Extraindo esquema completo...")
        schema_info = db_connector.get_database_schema()
        print(f"   📊 Total de tabelas: {schema_info['total_tables']}")
        print(f"   ✅ Tabelas processadas: {schema_info['processed_tables']}")
        print(f"   📈 Taxa de sucesso: {schema_info['success_rate']}")
        
        if schema_info.get('failed_tables'):
            print(f"   ⚠️ Tabelas com erro: {len(schema_info['failed_tables'])}")
            for error in schema_info['failed_tables'][:3]:  # Mostra 3 primeiros erros
                print(f"      - {error}")
        
        print(f"\n   📋 Primeiras 10 tabelas encontradas:")
        for i, (table_name, table_info) in enumerate(list(schema_info['tables'].items())[:10]):
            print(f"      {i+1}. {table_name}: {table_info['column_count']} colunas, {table_info['row_count']} registros")
        
        print("\n3. 📊 Extraindo dados de amostra...")
        sample_data = db_connector.extract_sample_data(limit=10)  # Limita para 10 registros para teste rápido
        print(f"   📊 Tabelas disponíveis: {sample_data.get('total_tables_available', 'N/A')}")
        print(f"   ✅ Tabelas processadas: {sample_data['tables_processed']}")
        print(f"   📈 Taxa de sucesso: {sample_data.get('success_rate', 'N/A')}")
        print(f"   📝 Total de registros: {sample_data['total_records']}")
        
        if sample_data.get('failed_extractions'):
            print(f"   ⚠️ Falhas na extração: {len(sample_data['failed_extractions'])}")
            for error in sample_data['failed_extractions'][:3]:
                print(f"      - {error}")
        
        print(f"\n   📋 Tabelas com dados extraídos:")
        for table_name, data in sample_data['data'].items():
            print(f"      - {table_name}: {len(data)} registros de amostra")
        
        print("\n4. 🔐 Fechando conexão...")
        db_connector.close_connection()
        print("   ✅ Conexão fechada")
        
        print(f"\n🎉 TESTE CONCLUÍDO COM SUCESSO!")
        print(f"📊 Resumo: {sample_data['tables_processed']} tabelas processadas de {sample_data.get('total_tables_available', 'N/A')} disponíveis")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"🚀 Iniciando teste - {datetime.now().strftime('%H:%M:%S')}")
    success = test_all_tables()
    if success:
        print(f"\n✅ Teste passou!")
    else:
        print(f"\n❌ Teste falhou!")
    print(f"⏰ Finalizado - {datetime.now().strftime('%H:%M:%S')}")
