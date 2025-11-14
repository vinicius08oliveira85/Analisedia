# 🔐 Como Configurar os Secrets do GitHub Actions

## ❌ Erro: RAILWAY_TOKEN não está configurado

O deploy falhou porque o secret `RAILWAY_TOKEN` não está configurado no GitHub.

## 📝 Passo a Passo para Configurar

### 1. Obter o Token do Railway

1. Acesse: **https://railway.app/dashboard**
2. Clique no seu perfil (canto superior direito)
3. Vá em **Settings** → **Tokens**
4. Clique em **New Token**
5. Dê um nome (ex: "GitHub Actions Deploy")
6. **Copie o token gerado** (você só verá ele uma vez!)

### 2. Configurar no GitHub

1. Acesse: **https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions**
2. Clique em **"New repository secret"**
3. Configure os seguintes secrets:

#### Secret 1: RAILWAY_TOKEN (Obrigatório)
- **Name**: `RAILWAY_TOKEN`
- **Secret**: Cole o token copiado do Railway
- Clique em **"Add secret"**

#### Secret 2: RAILWAY_PROJECT_ID (Opcional)
- **Name**: `RAILWAY_PROJECT_ID`
- **Secret**: ID do projeto no Railway
  - Encontre na URL: `https://railway.app/project/{PROJECT_ID}`
- Clique em **"Add secret"**

#### Secret 3: RAILWAY_SERVICE_ID (Opcional)
- **Name**: `RAILWAY_SERVICE_ID`
- **Secret**: ID do serviço no Railway
  - Encontre na URL: `https://railway.app/project/{PROJECT_ID}/service/{SERVICE_ID}`
- Clique em **"Add secret"**

### 3. Verificar

Após configurar, você pode:
- Fazer um novo push para acionar o deploy
- Ou executar manualmente: **Actions** → **Deploy to Railway** → **Run workflow**

## ✅ Após Configurar

O deploy automático funcionará a cada push na branch `main`!

---

**Importante**: Os secrets são configurados no repositório GitHub, não em computadores específicos. Uma vez configurados, funcionam para todos os computadores que fazem push.

