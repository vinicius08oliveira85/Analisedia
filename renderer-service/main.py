"""
Serviço FastAPI para renderizar sites com JavaScript usando Playwright
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, Page
import asyncio
import logging
from typing import Optional

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Site Renderer Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Browser global (reutilizado para performance)
_browser: Optional[Browser] = None
_playwright = None


class RenderRequest(BaseModel):
    url: str
    wait_time: Optional[int] = 5000  # Tempo de espera em ms
    wait_selector: Optional[str] = None  # Seletor CSS para aguardar
    timeout: Optional[int] = 30000  # Timeout em ms


class RenderResponse(BaseModel):
    success: bool
    html: Optional[str] = None
    error: Optional[str] = None
    url: Optional[str] = None
    render_time_ms: Optional[float] = None


async def get_browser() -> Browser:
    """Obtém ou cria uma instância do browser"""
    global _browser, _playwright
    
    if _browser is None:
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ]
        )
        logger.info("Browser iniciado")
    
    return _browser


@app.on_event("shutdown")
async def shutdown_event():
    """Fecha o browser ao encerrar o serviço"""
    global _browser, _playwright
    
    if _browser:
        await _browser.close()
        logger.info("Browser fechado")
    
    if _playwright:
        await _playwright.stop()
        logger.info("Playwright encerrado")


@app.get("/")
async def root():
    return {
        "service": "Site Renderer",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check"""
    try:
        browser = await get_browser()
        return {"status": "healthy", "browser": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/render", response_model=RenderResponse)
async def render_page(request: RenderRequest):
    """
    Renderiza uma página web com JavaScript e retorna o HTML renderizado
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"Renderizando URL: {request.url}")
        
        browser = await get_browser()
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        
        try:
            # Navega para a URL
            await page.goto(
                request.url,
                wait_until='networkidle',
                timeout=request.timeout
            )
            
            # Aguarda seletor específico (se fornecido)
            if request.wait_selector:
                try:
                    await page.wait_for_selector(
                        request.wait_selector,
                        timeout=request.timeout
                    )
                    logger.info(f"Seletor '{request.wait_selector}' encontrado")
                except Exception as e:
                    logger.warning(f"Seletor '{request.wait_selector}' não encontrado: {e}")
            
            # Aguarda tempo adicional (útil para SPAs)
            if request.wait_time > 0:
                await asyncio.sleep(request.wait_time / 1000)
            
            # Obtém o HTML renderizado
            html = await page.content()
            
            render_time = (time.time() - start_time) * 1000
            
            logger.info(f"HTML renderizado com sucesso ({len(html)} chars, {render_time:.2f}ms)")
            
            return RenderResponse(
                success=True,
                html=html,
                url=request.url,
                render_time_ms=render_time
            )
            
        finally:
            await page.close()
            await context.close()
            
    except Exception as e:
        render_time = (time.time() - start_time) * 1000
        error_msg = str(e)
        logger.error(f"Erro ao renderizar {request.url}: {error_msg}")
        
        return RenderResponse(
            success=False,
            error=error_msg,
            url=request.url,
            render_time_ms=render_time
        )


@app.post("/render-batch")
async def render_batch(requests: list[RenderRequest]):
    """
    Renderiza múltiplas URLs em paralelo
    """
    tasks = [render_page(req) for req in requests]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return {
        "success": True,
        "results": [
            result if isinstance(result, RenderResponse) 
            else RenderResponse(success=False, error=str(result))
            for result in results
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

