# 📋 Como Obter o Service ID do Railway

## ❌ Problema
O Railway encontrou múltiplos serviços no projeto e precisa saber qual serviço usar para fazer o deploy.

## ✅ Solução
Configure o secret `RAILWAY_SERVICE_ID` no GitHub.

## 📝 Passo a Passo

### 1. Obter o Service ID no Railway

**Opção A: Pela URL do serviço (MAIS FÁCIL) ⭐**
1. Acesse seu projeto no Railway: https://railway.app/dashboard
2. Clique no serviço que você quer fazer deploy (geralmente o serviço principal Node.js)
3. **Olhe a URL do navegador**, você verá algo como:
   ```
   https://railway.app/project/[PROJECT_ID]/service/[SERVICE_ID]
   ```
4. O `SERVICE_ID` é a parte após `/service/`
   
   **Exemplo:**
   - URL: `https://railway.app/project/3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7/service/206f8221-8753-4f33-833b-01e9a1953d66`
   - **SERVICE_ID**: `206f8221-8753-4f33-833b-01e9a1953d66`

**Opção B: Pelo Railway CLI**
1. Instale o Railway CLI: `npm install -g @railway/cli`
2. Faça login: `railway login`
3. Liste os serviços: `railway service`
4. O Service ID será exibido na lista

**Opção C: Pelos Logs do Railway**
1. Acesse seu projeto no Railway
2. Clique no serviço desejado
3. Vá em **Deployments** → Clique em um deployment → **Logs**
4. Procure por tags como: `"service": "206f8221-8753-4f33-833b-01e9a1953d66"`

### 2. Configurar no GitHub Secrets

1. Acesse: https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Configure:
   - **Name**: `RAILWAY_SERVICE_ID`
   - **Secret**: Cole o Service ID obtido acima
4. Clique em **"Add secret"**

### 3. Verificar Configuração

Após configurar, você deve ter os seguintes secrets:
- ✅ `RAILWAY_TOKEN` (já configurado)
- ✅ `RAILWAY_SERVICE_ID` (novo)
- ⚙️ `RAILWAY_PROJECT_ID` (opcional, mas recomendado)

## 🚀 Próximo Deploy

Após configurar o `RAILWAY_SERVICE_ID`, o próximo push para `main` fará o deploy automaticamente no serviço correto.

---

**Dica**: Se você tiver apenas um serviço no projeto, pode tentar fazer o deploy manualmente primeiro para ver qual Service ID é usado.

