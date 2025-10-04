"""
Teste de Conexão com Base de Dados PostgreSQL
============================================

Script para testar a nova funcionalidade de conexão direta com base de dados.

"""

import asyncio
import json
import sys
import os
from datetime import datetime

# Adiciona o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_connector import DatabaseConnector
from gemini_analyzer import GeminiAnalyzer
from models import DatabaseConnectionRequest


async def test_database_connection():
    """
    Testa a conexão com uma base de dados PostgreSQL
    """
    
    print("🧪 TESTE DE CONEXÃO COM BASE DE DADOS PostgreSQL")
    print("=" * 60)
    
    # URL de exemplo (substitua pela sua URL real)
    database_url = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    
    try:
        # 1. Testa validação do modelo Pydantic
        print("\n📋 1. Testando validação do modelo...")
        request = DatabaseConnectionRequest(database_url=database_url)
        print(f"✅ Modelo validado: {request.database_url[:50]}...")
        
        # 2. Testa conexão
        print("\n🔌 2. Testando conexão com base de dados...")
        db_connector = DatabaseConnector()
        
        connection_info = db_connector.connect_to_database(database_url)
        print(f"✅ Conexão estabelecida:")
        print(f"   - Tipo: {connection_info['database_type']}")
        print(f"   - Host: {connection_info['host']}")
        print(f"   - Database: {connection_info.get('database', 'N/A')}")
        print(f"   - Conectado em: {connection_info['connected_at']}")
        
        # 3. Testa extração do esquema
        print("\n📋 3. Extraindo esquema da base de dados...")
        schema_info = db_connector.get_database_schema()
        print(f"✅ Esquema extraído:")
        print(f"   - Total de tabelas: {schema_info['total_tables']}")
        print(f"   - Tabelas processadas: {len(schema_info['tables'])}")
        
        for table_name, table_info in list(schema_info['tables'].items())[:3]:
            print(f"   - Tabela '{table_name}': {table_info['column_count']} colunas, {table_info['row_count']} registros")
        
        # 4. Testa extração de dados de amostra
        print("\n📊 4. Extraindo dados de amostra...")
        sample_data = db_connector.extract_sample_data(limit=50)
        print(f"✅ Dados extraídos:")
        print(f"   - Tabelas processadas: {sample_data['tables_processed']}")
        print(f"   - Total de registros: {sample_data['total_records']}")
        
        # 5. Prepara dados para análise
        print("\n📝 5. Preparando dados para Gemini...")
        data_content = db_connector.prepare_data_for_analysis(sample_data)
        print(f"✅ Dados preparados: {len(data_content)} caracteres")
        
        # 6. Testa análise com Gemini
        print("\n🤖 6. Testando análise com Gemini...")
        gemini_analyzer = GeminiAnalyzer()
        
        if gemini_analyzer.check_connection():
            print("✅ Gemini API conectada")
            
            # Executa análise
            gemini_analysis = await gemini_analyzer.analyze_data(
                data_content=data_content[:5000],  # Limita para teste
                data_info=sample_data,
                file_type="database"
            )
            
            print(f"✅ Análise concluída:")
            print(f"   - Tempo de processamento: {gemini_analysis.get('processing_time', 0):.2f}s")
            print(f"   - Modelo usado: {gemini_analysis.get('model_used', 'N/A')}")
            print(f"   - Resposta (preview): {gemini_analysis['gemini_response'][:200]}...")
            
        else:
            print("⚠️ Gemini API não configurada, pulando análise")
        
        # 7. Fecha conexão
        print("\n🔐 7. Fechando conexão...")
        db_connector.close_connection()
        print("✅ Conexão fechada")
        
        print("\n🎉 TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {str(e)}")
        print("=" * 60)
        return False


async def test_custom_query():
    """
    Testa execução de query personalizada
    """
    
    print("\n🔍 TESTE DE QUERY PERSONALIZADA")
    print("=" * 40)
    
    database_url = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    
    try:
        db_connector = DatabaseConnector()
        db_connector.connect_to_database(database_url)
        
        # Testa queries básicas
        test_queries = [
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5",
            "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public'",
        ]
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n📋 Query {i}: {query}")
            result = db_connector.execute_custom_query(query)
            print(f"✅ Resultado: {result['rows_returned']} registros")
            print(f"   Colunas: {result['columns']}")
            print(f"   Dados: {result['data']}")
        
        db_connector.close_connection()
        return True
        
    except Exception as e:
        print(f"❌ Erro na query personalizada: {e}")
        return False


if __name__ == "__main__":
    print(f"🚀 Iniciando testes - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Executa testes
    loop = asyncio.get_event_loop()
    
    # Teste principal
    success1 = loop.run_until_complete(test_database_connection())
    
    # Teste de query personalizada
    success2 = loop.run_until_complete(test_custom_query())
    
    if success1 and success2:
        print("\n🎯 TODOS OS TESTES PASSARAM!")
    else:
        print("\n⚠️ Alguns testes falharam.")
        
    print(f"\n⏰ Testes finalizados - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
