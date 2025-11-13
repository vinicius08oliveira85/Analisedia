# 🎭 Configuração do Serviço de Renderização

Este guia explica como configurar o serviço FastAPI com Playwright para renderizar sites com JavaScript.

## 📋 Visão Geral

O serviço de renderização resolve o problema de sites SPA (Single Page Applications) que carregam conteúdo via JavaScript. Ele usa Playwright para abrir um navegador real, aguardar o JavaScript executar, e retornar o HTML renderizado.

## 🚀 Deploy no Railway

### 1. Criar Novo Serviço no Railway

1. No Railway Dashboard, clique em **New Project**
2. Selecione **Deploy from GitHub Repo**
3. Escolha o repositório `Analisedia`
4. Configure o **Root Directory** como `renderer-service`
5. O Railway detectará automaticamente o `Dockerfile` e `railway.json`

### 2. Configurar Variáveis de Ambiente

No serviço de renderização no Railway, não são necessárias variáveis de ambiente especiais. O serviço roda na porta 8000 por padrão.

### 3. Obter URL do Serviço

Após o deploy, o Railway fornecerá uma URL pública. Exemplo:
```
https://renderer-service-production.up.railway.app
```

## 🔗 Integração com o App Principal

### 1. Configurar Variável de Ambiente

No serviço principal (app Node.js) no Railway, adicione:

**Variável:**
```
RENDERER_SERVICE_URL
```

**Valor:**
```
https://renderer-service-production.up.railway.app
```

(Substitua pela URL real do seu serviço de renderização)

### 2. Como Funciona

Quando o app principal precisa fazer scraping de um site com JavaScript:

1. Verifica se `RENDERER_SERVICE_URL` está configurada
2. Se sim, chama o serviço de renderização
3. O serviço abre o site no Playwright, aguarda JavaScript executar
4. Retorna o HTML renderizado
5. O app principal processa o HTML normalmente

### 3. Fallback Automático

Se o serviço de renderização não estiver disponível ou falhar:
- O app usa o método tradicional (fetch direto)
- Funciona normalmente para sites sem JavaScript
- Para SPAs, ainda será necessário colar HTML manualmente

## 🧪 Testar Localmente

### Serviço de Renderização

```bash
cd renderer-service
pip install -r requirements.txt
playwright install chromium
python main.py
```

### Testar API

```bash
curl -X POST "http://localhost:8000/render" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sokkerpro.com",
    "wait_time": 5000
  }'
```

### App Principal

```bash
# Configure a variável de ambiente
export RENDERER_SERVICE_URL=http://localhost:8000

# Execute o app
npm run dev
```

## 📊 Monitoramento

### Health Check

```bash
curl http://renderer-service-url/health
```

### Logs

No Railway, você pode ver os logs do serviço de renderização em tempo real.

## ⚙️ Configurações Avançadas

### Ajustar Tempo de Espera

No código do app principal (`api/scrape-sokkerpro.ts`), você pode ajustar:

```typescript
wait_time: 5000, // 5 segundos (aumente para sites mais lentos)
timeout: 30000,  // 30 segundos máximo
```

### Aguardar Seletor Específico

Para sites específicos, você pode aguardar um elemento aparecer:

```typescript
wait_selector: '.matches-container', // Aguarda este elemento aparecer
```

## 🔍 Troubleshooting

### Erro: "Browser not found"
- Verifique se o Playwright instalou os browsers: `playwright install chromium`

### Erro: "Timeout"
- Aumente o `timeout` na requisição
- Verifique se o site está acessível

### Erro: "Connection refused"
- Verifique se o serviço está rodando
- Verifique se a URL está correta em `RENDERER_SERVICE_URL`

### HTML ainda vazio
- Aumente o `wait_time` para dar mais tempo ao JavaScript
- Use `wait_selector` para aguardar elemento específico

## 💰 Custos

O serviço de renderização usa recursos do Railway:
- CPU: Média (para executar o navegador)
- Memória: ~500MB por instância
- Tempo de execução: Depende do tempo de renderização (geralmente 2-5s por requisição)

## 🎯 Sites Suportados

O serviço funciona especialmente bem para:
- ✅ sokkerpro.com
- ✅ soccerway.com
- ✅ Qualquer SPA (React, Vue, Angular)
- ✅ Sites com conteúdo carregado via AJAX

## 📝 Notas

- O serviço mantém uma instância do browser aberta para performance
- Múltiplas requisições são processadas sequencialmente (evita sobrecarga)
- O browser é reutilizado entre requisições

