# 🔧 Configuração Completa do Serviço FastAPI de Scraping

## 📋 Passo a Passo Completo

### 1️⃣ Obter a URL do Serviço FastAPI

Após criar o serviço no Railway:

1. Acesse: https://railway.app/dashboard
2. Clique no serviço FastAPI que você criou
3. Vá em **Settings** → **Networking**
4. Em **Public Domain**, você verá a URL (ex: `https://scraper-service-production.up.railway.app`)
5. **Copie essa URL completa**

### 2️⃣ Configurar Variável de Ambiente no Serviço Principal

1. No Railway Dashboard, clique no **serviço principal** (Node.js)
2. Vá em **Variables**
3. Clique em **+ New Variable**
4. Configure:
   - **Name**: `SCRAPER_SERVICE_URL`
   - **Value**: Cole a URL que você copiou (ex: `https://scraper-service-production.up.railway.app`)
5. Clique em **Add**
6. **Reinicie o serviço** (Settings → Redeploy)

### 3️⃣ Verificar se Está Funcionando

#### Teste 1: Health Check do Serviço FastAPI
```bash
curl https://sua-url-fastapi.railway.app/health
```

Deve retornar:
```json
{"status": "ok", "timestamp": "2025-11-14T..."}
```

#### Teste 2: Teste de Scraping
```bash
curl "https://sua-url-fastapi.railway.app/scrape?url=https://www.academiadasapostasbrasil.com/"
```

Deve retornar JSON com `success: true` e o HTML.

#### Teste 3: Verificar Logs
1. No Railway Dashboard, vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Logs**
4. Procure por mensagens como:
   - `✅ HTML obtido via serviço FastAPI` (sucesso)
   - `Tentando usar serviço FastAPI de scraping...` (tentando usar)

### 4️⃣ Testar na Aplicação

1. Acesse sua aplicação no Railway
2. Vá em **⚙️ Configurações**
3. Clique em **🔄 Site** ou ative a **Atualização Automática**
4. Verifique se não aparece mais erro 403
5. Verifique os logs do Railway para confirmar que está usando o serviço FastAPI

## 🔍 Troubleshooting

### Problema: Ainda recebe erro 403

**Soluções:**
1. Verifique se a variável `SCRAPER_SERVICE_URL` está configurada corretamente
2. Verifique se o serviço FastAPI está rodando (teste o `/health`)
3. Verifique os logs do serviço FastAPI no Railway
4. O serviço tem retry automático (3 tentativas), mas se ainda falhar, use as alternativas:
   - Colar HTML manualmente
   - Upload de arquivo

### Problema: Serviço FastAPI não responde

**Soluções:**
1. Verifique se o deploy do serviço FastAPI foi concluído
2. Verifique os logs do serviço FastAPI
3. Teste o endpoint `/health` diretamente
4. Verifique se a porta está configurada corretamente no `railway.json`

### Problema: Variável de ambiente não está sendo lida

**Soluções:**
1. Certifique-se de que o nome da variável está correto: `SCRAPER_SERVICE_URL`
2. Reinicie o serviço principal após adicionar a variável
3. Verifique se não há espaços extras no valor da URL
4. A URL deve começar com `https://` ou `http://`

## ✅ Checklist de Configuração

- [ ] Serviço FastAPI criado no Railway
- [ ] URL do serviço FastAPI copiada
- [ ] Variável `SCRAPER_SERVICE_URL` configurada no serviço principal
- [ ] Serviço principal reiniciado
- [ ] Health check do FastAPI funcionando (`/health`)
- [ ] Teste de scraping funcionando (`/scrape`)
- [ ] Aplicação usando o serviço FastAPI (verificar logs)
- [ ] Sem mais erros 403 (ou reduzidos significativamente)

## 📊 Monitoramento

### Logs Importantes

**No serviço principal (Node.js):**
- `Tentando usar serviço FastAPI de scraping...` - Tentando usar o serviço
- `✅ HTML obtido via serviço FastAPI` - Sucesso!
- `Serviço FastAPI não disponível, tentando método direto...` - Fallback

**No serviço FastAPI:**
- `HTML obtido com sucesso (X caracteres) na tentativa Y` - Sucesso
- `Acesso negado (403)` - Bloqueio (tentará retry)

## 🚀 Próximos Passos

Se o serviço FastAPI simples ainda não resolver completamente:

1. **Usar o renderer-service** (já existe no projeto)
   - Usa Playwright para simular navegador completo
   - Mais eficaz contra bloqueios
   - Configuração similar

2. **Adicionar mais estratégias anti-bloqueio:**
   - Rotação de proxies
   - Delays mais inteligentes
   - Cache de requisições

---

**Configuração concluída! O serviço deve estar funcionando agora.** ✅

