# 🔍 Como Encontrar o Service ID do Railway

## 📋 Onde Encontrar o Service ID

### Método 1: Pela URL do Serviço (Mais Fácil)

1. **Acesse o Railway Dashboard:**
   - https://railway.app/dashboard

2. **Clique no serviço desejado** (ex: o serviço principal Node.js)

3. **Olhe a URL do navegador:**
   ```
   https://railway.app/project/[PROJECT_ID]/service/[SERVICE_ID]
   ```
   
   O **SERVICE_ID** é a parte após `/service/`

   **Exemplo:**
   - URL: `https://railway.app/project/3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7/service/206f8221-8753-4f33-833b-01e9a1953d66`
   - **SERVICE_ID**: `206f8221-8753-4f33-833b-01e9a1953d66`

### Método 2: Pelo Railway CLI

1. **Instale o Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Faça login:**
   ```bash
   railway login
   ```

3. **Liste os serviços:**
   ```bash
   railway service
   ```
   
   O Service ID será exibido na lista.

### Método 3: Pela API do Railway

1. **Obtenha seu token do Railway:**
   - Acesse: https://railway.app/account/tokens
   - Crie um novo token

2. **Faça uma requisição:**
   ```bash
   curl -H "Authorization: Bearer SEU_TOKEN" \
     https://api.railway.app/v1/projects/PROJECT_ID/services
   ```
   
   O Service ID estará na resposta JSON.

### Método 4: Pelos Logs do Railway

1. **Acesse o serviço no Railway**
2. **Vá em Deployments**
3. **Clique em um deployment**
4. **Vá em Logs**
5. **Procure por tags como:**
   ```json
   "service": "206f8221-8753-4f33-833b-01e9a1953d66"
   ```

## 🎯 Qual Service ID Usar?

### Para o Deploy Automático (GitHub Actions)

Você precisa do **Service ID do serviço principal** (Node.js), que é onde sua aplicação está rodando.

**Passos:**
1. Acesse o Railway Dashboard
2. Clique no serviço principal (geralmente o primeiro serviço criado)
3. Copie o Service ID da URL
4. Configure no GitHub Secrets como `RAILWAY_SERVICE_ID`

## 📝 Exemplo Prático

**URL do serviço:**
```
https://railway.app/project/3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7/service/206f8221-8753-4f33-833b-01e9a1953d66
```

**Extrair:**
- **PROJECT_ID**: `3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7`
- **SERVICE_ID**: `206f8221-8753-4f33-833b-01e9a1953d66`

## ⚙️ Configurar no GitHub Secrets

1. Acesse: https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Configure:
   - **Name**: `RAILWAY_SERVICE_ID`
   - **Secret**: Cole o Service ID (ex: `206f8221-8753-4f33-833b-01e9a1953d66`)
4. Clique em **"Add secret"**

## ✅ Verificação

Após configurar, o próximo deploy deve funcionar sem o erro:
```
Multiple services found. Please specify a service via the `--service` flag.
```

---

**Dica**: Se você tiver apenas um serviço no projeto, o Railway pode funcionar sem o Service ID, mas é recomendado configurá-lo para evitar problemas futuros.

