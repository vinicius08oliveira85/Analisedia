# 🚂 Configuração do Railway - Deploy Automático

## 📋 Visão Geral

O projeto **Analisedia** está configurado para fazer deploy automático no Railway via GitHub Actions.

## 🔧 Como Funciona

### Deploy Automático

Quando você faz `git push` para a branch `main`:
1. GitHub Actions detecta o push
2. Executa o workflow `.github/workflows/deploy-railway.yml`
3. Faz build do projeto
4. Faz deploy automático no Railway

## 🔐 Configuração dos Secrets no GitHub

⚠️ **IMPORTANTE**: Os secrets são configurados no **repositório GitHub**, não em computadores específicos. Uma vez configurados, funcionam para **todos os computadores** que fazem push para o repositório.

Se você já configurou os secrets no computador da empresa, **não precisa configurar novamente** - eles já estão funcionando!

Para o deploy automático funcionar, você precisa configurar os seguintes secrets no GitHub (se ainda não configurou):

### 1. Acessar Secrets do GitHub

1. Acesse: `https://github.com/vinicius08oliveira85/Analisedia`
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

### 2. Secrets Necessários

#### `RAILWAY_TOKEN` (Obrigatório)
- **O que é**: Token de API do Railway
- **Como obter**:
  1. Acesse [Railway Dashboard](https://railway.app/dashboard)
  2. Vá em **Settings** → **Tokens**
  3. Clique em **New Token**
  4. Dê um nome (ex: "GitHub Actions Deploy")
  5. Copie o token gerado
- **Valor**: Cole o token copiado

#### `RAILWAY_PROJECT_ID` (Opcional)
- **O que é**: ID do projeto no Railway
- **Como obter**:
  1. No Railway Dashboard, abra seu projeto
  2. O ID está na URL: `https://railway.app/project/{PROJECT_ID}`
  3. Ou use: `railway project` (se tiver Railway CLI)
- **Valor**: Cole apenas o ID (sem espaços)

#### `RAILWAY_SERVICE_ID` (Opcional)
- **O que é**: ID do serviço específico no Railway
- **Como obter**:
  1. Clique no serviço dentro do projeto
  2. O ID está na URL: `https://railway.app/project/{PROJECT_ID}/service/{SERVICE_ID}`
- **Valor**: Cole apenas o ID (sem espaços)
- **Nota**: Se não informar, o Railway usa o serviço padrão do projeto

## 📝 Variáveis de Ambiente no Railway

No dashboard do Railway, configure as seguintes variáveis de ambiente:

### Variáveis Obrigatórias

- **`GEMINI_API_KEY`**: Chave da API do Google Gemini
  - Obtenha em: https://aistudio.google.com/app/apikey

### Variáveis Opcionais

- **`RENDERER_SERVICE_URL`**: URL do serviço de renderização (se usar)
  - Exemplo: `https://renderer-service-production.up.railway.app`
  - Veja `RENDERER_SETUP.md` para mais detalhes

## 🔄 Fluxo de Deploy

### Automático (Recomendado)

1. Faça alterações no código
2. Commit e push:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push origin main
   ```
3. O GitHub Actions detecta o push
4. Executa o workflow automaticamente
5. Deploy no Railway acontece automaticamente

### Manual

Você também pode executar o workflow manualmente:

1. Acesse: `https://github.com/vinicius08oliveira85/Analisedia/actions`
2. Clique em **Deploy to Railway**
3. Clique em **Run workflow**
4. Selecione a branch `main`
5. Clique em **Run workflow**

## 📊 Verificar Status do Deploy

### No GitHub Actions

1. Acesse: `https://github.com/vinicius08oliveira85/Analisedia/actions`
2. Clique no workflow mais recente
3. Veja os logs de cada etapa

### No Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Abra seu projeto
3. Veja os logs de deploy e status do serviço

## 🆘 Troubleshooting

### Erro: "RAILWAY_TOKEN not found"
- Verifique se o secret `RAILWAY_TOKEN` está configurado no GitHub
- Certifique-se de que o token está correto e não expirou

### Erro: "Project not found"
- Verifique se o `RAILWAY_PROJECT_ID` está correto
- Certifique-se de que o token tem permissão para acessar o projeto

### Deploy não inicia
- Verifique os logs em **Actions** no GitHub
- Certifique-se de que o workflow está habilitado
- Verifique se há erros de sintaxe no workflow

### Build falha
- Verifique os logs do GitHub Actions
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js versão 22.12.0 está sendo usada

## 📚 Documentação Adicional

- [Documentação do Railway](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
- Veja também: `DEPLOY.md` para mais detalhes

---

**Com essa configuração, cada push na branch `main` fará deploy automático no Railway! 🚀**

