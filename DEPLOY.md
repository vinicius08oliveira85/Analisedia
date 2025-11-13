# 🚀 Guia de Deploy Automático

Este projeto está configurado para fazer deploy automático no Railway via GitHub Actions.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app/)
2. Projeto criado no Railway
3. Token de API do Railway

## 🔧 Configuração

### 1. Obter Token do Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Vá em **Settings** → **Tokens**
3. Clique em **New Token**
4. Dê um nome ao token (ex: "GitHub Actions Deploy")
5. Copie o token gerado

### 2. Obter IDs do Projeto e Serviço

1. No Railway Dashboard, abra seu projeto
2. O **Project ID** está na URL: `https://railway.app/project/{PROJECT_ID}`
3. Para o **Service ID**, clique no serviço e veja na URL: `https://railway.app/project/{PROJECT_ID}/service/{SERVICE_ID}`

### 3. Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

   - **`RAILWAY_TOKEN`**: Token de API do Railway
   - **`RAILWAY_PROJECT_ID`**: ID do projeto no Railway
   - **`RAILWAY_SERVICE_ID`**: ID do serviço no Railway (opcional, se não informado, usa o serviço padrão)

## 🔄 Como Funciona

O workflow `.github/workflows/deploy-railway.yml` é acionado automaticamente quando:

- Há um push para a branch `main`
- Você executa manualmente via **Actions** → **Deploy to Railway** → **Run workflow**

### Processo de Deploy

1. ✅ Checkout do código
2. ✅ Configuração do Node.js 22.12.0
3. ✅ Instalação de dependências (`npm ci`)
4. ✅ Build do projeto (`npm run build`)
5. ✅ Verificação do build
6. ✅ Instalação da Railway CLI
7. ✅ Deploy para Railway

## 📝 Notas

- O deploy usa o `Dockerfile` configurado no projeto
- O Railway detecta automaticamente o `railway.json` para configurações
- O build é feito localmente no GitHub Actions antes do deploy
- O servidor inicia na porta 3000 (configurada no Railway)

## 🔍 Troubleshooting

### Erro: "RAILWAY_TOKEN not found"
- Verifique se o secret `RAILWAY_TOKEN` está configurado no GitHub

### Erro: "Project not found"
- Verifique se o `RAILWAY_PROJECT_ID` está correto
- Certifique-se de que o token tem permissão para acessar o projeto

### Deploy não inicia
- Verifique os logs em **Actions** no GitHub
- Certifique-se de que o workflow está habilitado

## 🔗 Links Úteis

- [Documentação do Railway](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [GitHub Actions](https://docs.github.com/en/actions)
