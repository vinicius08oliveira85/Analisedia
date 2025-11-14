#!/usr/bin/env python3
"""
Script de teste para o serviço de scraping
"""
import requests
import sys
import json

def test_health(base_url):
    """Testa o endpoint de health check"""
    print("🔍 Testando health check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check OK: {data}")
            return True
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro no health check: {e}")
        return False

def test_scrape(base_url, test_url):
    """Testa o endpoint de scraping"""
    print(f"\n🔍 Testando scraping de: {test_url}")
    try:
        response = requests.get(
            f"{base_url}/scrape",
            params={"url": test_url},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                html_length = len(data.get("html", ""))
                print(f"✅ Scraping bem-sucedido!")
                print(f"   - HTML obtido: {html_length} caracteres")
                print(f"   - Mensagem: {data.get('message')}")
                return True
            else:
                print(f"❌ Scraping falhou: {data.get('message')}")
                print(f"   - Erro: {data.get('error')}")
                return False
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"   - Resposta: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Erro no scraping: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Uso: python test_scraper.py <URL_DO_SERVICO> [URL_PARA_TESTAR]")
        print("Exemplo: python test_scraper.py https://scraper-service.railway.app")
        print("Exemplo: python test_scraper.py https://scraper-service.railway.app https://www.academiadasapostasbrasil.com/")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    test_url = sys.argv[2] if len(sys.argv) > 2 else "https://www.academiadasapostasbrasil.com/"
    
    print(f"🚀 Testando serviço: {base_url}\n")
    
    # Testa health check
    if not test_health(base_url):
        print("\n❌ Health check falhou. Verifique se o serviço está rodando.")
        sys.exit(1)
    
    # Testa scraping
    if not test_scrape(base_url, test_url):
        print("\n❌ Teste de scraping falhou.")
        sys.exit(1)
    
    print("\n✅ Todos os testes passaram!")

if __name__ == "__main__":
    main()

