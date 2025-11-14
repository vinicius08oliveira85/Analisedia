from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

app = FastAPI(title="Scraper Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str

class ScrapeResponse(BaseModel):
    success: bool
    html: Optional[str] = None
    error: Optional[str] = None
    message: str

import random

def get_realistic_headers():
    """Retorna headers que simulam um navegador real com variação"""
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]
    
    return {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': random.choice(['none', 'same-origin', 'cross-site']),
        'Sec-Fetch-User': '?1',
        'Cache-Control': random.choice(['max-age=0', 'no-cache', '']),
        'DNT': '1',
        'Referer': random.choice([
            'https://www.google.com/',
            'https://www.google.com.br/',
            'https://www.bing.com/',
        ]),
    }

@app.get("/")
async def root():
    return {"message": "Scraper Service API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    """
    Faz scraping de uma URL com headers realistas para evitar bloqueios 403
    Com retry automático e delay humano
    """
    import time
    
    max_retries = 3
    base_delay = 0.5
    
    for attempt in range(max_retries):
        try:
            headers = get_realistic_headers()
            
            # Adiciona delay progressivo para parecer mais humano
            delay = base_delay + (attempt * 0.3) + random.uniform(0, 0.5)
            time.sleep(delay)
            
            # Cria sessão para manter cookies entre requisições
            session = requests.Session()
            session.headers.update(headers)
            
            # Faz a requisição com timeout
            response = session.get(
                request.url,
                timeout=30,
                allow_redirects=True,
                verify=True
            )
        
            if response.status_code == 403:
                if attempt < max_retries - 1:
                    # Tenta novamente com delay maior
                    wait_time = (attempt + 1) * 2
                    time.sleep(wait_time)
                    continue
                return ScrapeResponse(
                    success=False,
                    error="403",
                    message="Acesso negado (403): O site está bloqueando requisições automáticas. Use 'Colar HTML' ou 'Upload de Arquivo' como alternativa."
                )
            
            if response.status_code != 200:
                if attempt < max_retries - 1 and response.status_code in [429, 503, 502]:
                    # Retry em caso de rate limit ou erro de servidor
                    wait_time = (attempt + 1) * 2
                    time.sleep(wait_time)
                    continue
                return ScrapeResponse(
                    success=False,
                    error=f"HTTP {response.status_code}",
                    message=f"Erro ao acessar o site: HTTP {response.status_code}"
                )
            
            html = response.text
            
            # Verifica se o HTML não está vazio
            if not html or len(html) < 100:
                if attempt < max_retries - 1:
                    continue
                return ScrapeResponse(
                    success=False,
                    error="empty_response",
                    message="Resposta vazia ou muito pequena do servidor"
                )
            
            return ScrapeResponse(
                success=True,
                html=html,
                message=f"HTML obtido com sucesso ({len(html)} caracteres) na tentativa {attempt + 1}"
            )
            
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                time.sleep(wait_time)
                continue
            return ScrapeResponse(
                success=False,
                error="timeout",
                message=f"Timeout ao acessar o site após {max_retries} tentativas. Tente novamente."
            )
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                time.sleep(wait_time)
                continue
            return ScrapeResponse(
                success=False,
                error=str(e),
                message=f"Erro ao fazer requisição após {max_retries} tentativas: {str(e)}"
            )
        except Exception as e:
            return ScrapeResponse(
                success=False,
                error=str(e),
                message=f"Erro inesperado: {str(e)}"
            )
    
    # Se chegou aqui, todas as tentativas falharam
    return ScrapeResponse(
        success=False,
        error="max_retries_exceeded",
        message=f"Falha após {max_retries} tentativas"
    )

@app.get("/scrape")
async def scrape_url_get(url: str):
    """
    Versão GET do endpoint de scraping
    """
    request = ScrapeRequest(url=url)
    return await scrape_url(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

