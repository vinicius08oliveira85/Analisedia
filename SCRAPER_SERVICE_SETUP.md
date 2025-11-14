# 🐍 Configuração do Serviço FastAPI de Scraping

## 📋 Visão Geral

Foi criado um serviço FastAPI separado (`scraper-service`) para fazer scraping do site `academiadasapostasbrasil.com` com headers mais realistas, ajudando a evitar bloqueios 403.

## 🚀 Como Funciona

O serviço FastAPI:
1. Usa headers que simulam um navegador real
2. Adiciona delay para parecer mais humano
3. Trata erros 403 e outros códigos HTTP
4. Retorna HTML completo para processamento

O código Node.js foi atualizado para:
1. Tentar usar o serviço FastAPI primeiro (se configurado)
2. Fazer fallback para método direto se o serviço não estiver disponível

## 📦 Estrutura

```
scraper-service/
├── main.py              # Serviço FastAPI
├── requirements.txt     # Dependências Python
├── railway.json        # Configuração Railway
└── README.md           # Documentação
```

## 🔧 Configuração

### Opção 1: Deploy no Railway (Recomendado)

1. **Criar novo serviço no Railway:**
   - Acesse: https://railway.app/dashboard
   - Clique em "New Project" ou adicione serviço ao projeto existente
   - Selecione "Deploy from GitHub repo"
   - Escolha o diretório `scraper-service`

2. **Configurar variável de ambiente:**
   - No serviço principal (Node.js), adicione:
   - `SCRAPER_SERVICE_URL` = URL do serviço FastAPI (ex: `https://scraper-service-production.up.railway.app`)

3. **Deploy automático:**
   - O Railway detectará automaticamente o Python
   - Instalará as dependências do `requirements.txt`
   - Iniciará o serviço na porta configurada

### Opção 2: Deploy Local (Desenvolvimento)

```bash
cd scraper-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Depois, configure no `.env` do serviço principal:
```
SCRAPER_SERVICE_URL=http://localhost:8000
```

## 🔗 Integração

O código Node.js já está configurado para usar o serviço se a variável `SCRAPER_SERVICE_URL` estiver definida:

- `api/scrape-matches.ts` - Atualizado
- `api/scrape-match-details.ts` - Atualizado

## 📡 Endpoints do Serviço FastAPI

### GET `/`
Status do serviço

### GET `/health`
Health check

### POST `/scrape`
Faz scraping de uma URL
```json
{
  "url": "https://www.academiadasapostasbrasil.com/"
}
```

### GET `/scrape?url=...`
Versão GET do scraping

## ✅ Vantagens

1. **Headers mais realistas** - Simula navegador real
2. **Delay humano** - Adiciona delay para parecer mais natural
3. **Melhor tratamento de erros** - Retorna mensagens claras
4. **Fallback automático** - Se o serviço não estiver disponível, usa método direto
5. **Isolamento** - Serviço separado facilita manutenção

## ⚠️ Limitações

- O site ainda pode bloquear se detectar padrões de scraping
- Se o erro 403 persistir, use as alternativas:
  - Colar HTML manualmente
  - Upload de arquivo
  - Usar outras fontes de dados

## 🔍 Testando

```bash
# Testar localmente
curl "http://localhost:8000/scrape?url=https://www.academiadasapostasbrasil.com/"

# Testar no Railway (após deploy)
curl "https://seu-servico.railway.app/scrape?url=https://www.academiadasapostasbrasil.com/"
```

## 📝 Próximos Passos

1. Fazer deploy do serviço FastAPI no Railway
2. Configurar `SCRAPER_SERVICE_URL` no serviço principal
3. Testar se o scraping funciona sem erro 403
4. Se ainda houver bloqueios, considerar usar Playwright (já existe em `renderer-service`)

---

**Nota**: O serviço `renderer-service` já existe e usa Playwright para renderizar JavaScript. Se o FastAPI simples não funcionar, podemos usar o renderer-service que simula um navegador completo.

