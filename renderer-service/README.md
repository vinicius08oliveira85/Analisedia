# 🎭 Serviço de Renderização de Sites

Serviço FastAPI que usa Playwright para renderizar sites com JavaScript antes de fazer scraping.

## 🚀 Como Usar

### Desenvolvimento Local

1. **Instalar dependências:**
```bash
cd renderer-service
pip install -r requirements.txt
playwright install chromium
```

2. **Executar o serviço:**
```bash
python main.py
# ou
uvicorn main:app --reload
```

3. **Testar:**
```bash
curl -X POST "http://localhost:8000/render" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://sokkerpro.com", "wait_time": 5000}'
```

### Docker

```bash
docker build -t renderer-service .
docker run -p 8000:8000 renderer-service
```

### Railway

O serviço pode ser deployado no Railway como um serviço separado.

## 📡 API

### POST `/render`

Renderiza uma página e retorna o HTML renderizado.

**Request:**
```json
{
  "url": "https://sokkerpro.com",
  "wait_time": 5000,
  "wait_selector": ".matches-container",
  "timeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "html": "<html>...</html>",
  "url": "https://sokkerpro.com",
  "render_time_ms": 2345.67
}
```

### POST `/render-batch`

Renderiza múltiplas URLs em paralelo.

### GET `/health`

Health check do serviço.

## ⚙️ Configuração

- `wait_time`: Tempo de espera adicional após carregar (ms)
- `wait_selector`: Seletor CSS para aguardar antes de retornar HTML
- `timeout`: Timeout máximo para carregar a página (ms)

