"""
Teste Simples da API
===================
"""

import requests
import json

def test_api_status():
    """Testa se a API está respondendo"""
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ API está online!")
            print(f"Resposta: {response.json()}")
            return True
        else:
            print(f"❌ API retornou status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro ao conectar com a API: {e}")
        return False

def test_health():
    """Testa o endpoint de health"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check OK!")
            print(f"Status: {response.json()}")
            return True
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro no health check: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Teste Básico da API")
    print("=" * 30)
    
    if test_api_status():
        test_health()
    else:
        print("❌ API não está disponível")
