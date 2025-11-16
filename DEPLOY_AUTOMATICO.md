# 🚀 Deploy Automático - GitHub e Railway

Este documento descreve como funciona o deploy automático configurado para este projeto.

## 📋 Visão Geral

O projeto está configurado para fazer deploy automático no Railway sempre que houver um push para a branch `main` no GitHub.

## 🔧 Configuração

### 1. GitHub Actions Workflow

O workflow está localizado em `.github/workflows/deploy-railway.yml` e é acionado automaticamente quando:
- Há um push para a branch `main`
- Execução manual via GitHub Actions (workflow_dispatch)

### 2. Secrets do GitHub

Para que o deploy funcione, você precisa configurar os seguintes secrets no GitHub:

1. **RAILWAY_TOKEN**: Token de autenticação do Railway
   - Obtenha em: https://railway.app/account/tokens
   - Configure em: https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions

2. **RAILWAY_PROJECT_ID** (opcional): ID do projeto no Railway
   - Encontre na URL do projeto: `https://railway.app/project/[PROJECT_ID]`

3. **RAILWAY_SERVICE_ID** (opcional): ID do serviço específico
   - Encontre na URL do serviço: `https://railway.app/project/[PROJECT_ID]/service/[SERVICE_ID]`
   - Necessário apenas se houver múltiplos serviços no projeto

### 3. Como Configurar os Secrets

1. Acesse: https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione cada secret com o nome e valor correspondente

## 🚀 Como Fazer Deploy

### Deploy Automático

Simplesmente faça push para a branch `main`:

```bash
git add .
git commit -m "Sua mensagem de commit"
git push origin main
```

O GitHub Actions irá automaticamente:
1. Fazer checkout do código
2. Instalar dependências
3. Fazer build do projeto
4. Fazer deploy no Railway

### Deploy Manual

Você também pode acionar o deploy manualmente:

1. Acesse: https://github.com/vinicius08oliveira85/Analisedia/actions
2. Selecione o workflow "Deploy to Railway"
3. Clique em "Run workflow"
4. Selecione a branch `main`
5. Clique em "Run workflow"

## 📊 Monitoramento

Você pode acompanhar o progresso do deploy:

1. **GitHub Actions**: https://github.com/vinicius08oliveira85/Analisedia/actions
2. **Railway Dashboard**: https://railway.app/dashboard

## 🔍 Troubleshooting

### Deploy não está funcionando

1. Verifique se os secrets estão configurados corretamente
2. Verifique os logs do GitHub Actions para erros
3. Verifique os logs do Railway para problemas de build/deploy

### Erro: "RAILWAY_TOKEN não está configurado"

- Configure o secret `RAILWAY_TOKEN` no GitHub
- Verifique se o token está válido no Railway

### Erro: "Múltiplos serviços encontrados"

- Configure o secret `RAILWAY_SERVICE_ID` no GitHub
- Use o ID do serviço específico que deseja fazer deploy

## 📝 Notas

- O deploy usa o Dockerfile para construir a imagem
- O servidor inicia automaticamente após o deploy
- O Railway monitora a saúde do serviço via endpoint `/health`

