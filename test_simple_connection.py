"""
Teste Simples de Conexão PostgreSQL
==================================
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database_connector import DatabaseConnector

def test_simple_connection():
    print("🧪 Teste simples de conexão PostgreSQL")
    
    # URL de teste (substitua pela sua)
    database_url = "postgresql://mapazzz_owner:npg_uxRkpB1V2nXM@ep-morning-hill-a5h6lsjm-pooler.us-east-2.aws.neon.tech/mapazzz?sslmode=require&channel_binding=require"
    
    try:
        db_connector = DatabaseConnector()
        
        # Testa apenas a validação
        print("1. Testando validação da URL...")
        is_valid, message = db_connector.validate_database_url(database_url)
        print(f"   Resultado: {is_valid}")
        print(f"   Mensagem: {message}")
        
        if is_valid:
            print("2. Tentando conectar...")
            connection_info = db_connector.connect_to_database(database_url)
            print(f"   ✅ Conectado: {connection_info['database_type']}")
            
            print("3. Fechando conexão...")
            db_connector.close_connection()
            print("   ✅ Conexão fechada")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

if __name__ == "__main__":
    test_simple_connection()
