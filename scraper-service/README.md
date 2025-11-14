# Scraper Service - FastAPI

Serviço FastAPI separado para fazer scraping do site academiadasapostasbrasil.com com headers mais realistas para evitar bloqueios 403.

## 🚀 Como usar

### Localmente

```bash
cd scraper-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### Endpoints

- `GET /` - Status do serviço
- `GET /health` - Health check
- `POST /scrape` - Faz scraping de uma URL
- `GET /scrape?url=...` - Versão GET do scraping

### Exemplo de uso

```bash
# POST
curl -X POST "http://localhost:8000/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.academiadasapostasbrasil.com/"}'

# GET
curl "http://localhost:8000/scrape?url=https://www.academiadasapostasbrasil.com/"
```

## 🚂 Deploy no Railway

1. Crie um novo serviço no Railway
2. Conecte este diretório
3. O Railway detectará automaticamente o Python e instalará as dependências
4. O serviço estará disponível na porta configurada pelo Railway

## 📝 Notas

- Usa headers realistas para simular um navegador
- Adiciona delay para parecer mais humano
- Trata erros 403 e outros códigos HTTP
- Retorna HTML completo para processamento

