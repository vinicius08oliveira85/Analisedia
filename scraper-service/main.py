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

def get_realistic_headers():
    """Retorna headers que simulam um navegador real"""
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://www.google.com/',
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
    """
    try:
        headers = get_realistic_headers()
        
        # Adiciona delay para parecer mais humano
        import time
        time.sleep(0.5)
        
        # Faz a requisição com timeout
        response = requests.get(
            request.url,
            headers=headers,
            timeout=30,
            allow_redirects=True,
            verify=True
        )
        
        if response.status_code == 403:
            return ScrapeResponse(
                success=False,
                error="403",
                message="Acesso negado (403): O site está bloqueando requisições automáticas. Use 'Colar HTML' ou 'Upload de Arquivo' como alternativa."
            )
        
        if response.status_code != 200:
            return ScrapeResponse(
                success=False,
                error=f"HTTP {response.status_code}",
                message=f"Erro ao acessar o site: HTTP {response.status_code}"
            )
        
        html = response.text
        
        return ScrapeResponse(
            success=True,
            html=html,
            message=f"HTML obtido com sucesso ({len(html)} caracteres)"
        )
        
    except requests.exceptions.Timeout:
        return ScrapeResponse(
            success=False,
            error="timeout",
            message="Timeout ao acessar o site. Tente novamente."
        )
    except requests.exceptions.RequestException as e:
        return ScrapeResponse(
            success=False,
            error=str(e),
            message=f"Erro ao fazer requisição: {str(e)}"
        )
    except Exception as e:
        return ScrapeResponse(
            success=False,
            error=str(e),
            message=f"Erro inesperado: {str(e)}"
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

