# 📚 Guia de Deploy - Futibou Analytics

Este documento contém instruções detalhadas para configurar o deploy automático do projeto.

## 🔄 Deploy Automático Configurado

O projeto está configurado para fazer deploy automático no **Vercel** sempre que houver um push na branch `main`.

## ⚙️ Configuração Inicial

### 1. Conectar Repositório ao Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `vinicius08oliveira85/Academiadasanalises`
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```
GEMINI_API_KEY = sua_chave_api_gemini
```

### 3. Configurar GitHub Secrets (Opcional - para GitHub Actions)

Se quiser usar GitHub Actions para validação antes do deploy:

1. No GitHub, vá em **Settings > Secrets and variables > Actions**
2. Adicione os seguintes secrets:

   - **VERCEL_TOKEN**: 
     - Obtenha em [Vercel Settings > Tokens](https://vercel.com/account/tokens)
     - Crie um novo token com escopo de projeto
   
   - **VERCEL_ORG_ID** e **VERCEL_PROJECT_ID**:
     - Após o primeiro deploy no Vercel, execute `vercel link` localmente
     - Os IDs estarão no arquivo `.vercel/project.json`
     - Ou encontre no dashboard do Vercel em Settings > General

   - **GEMINI_API_KEY**: 
     - Mesma chave usada no Vercel (para builds no GitHub Actions)

## 🚀 Como Funciona

### Deploy Automático via Vercel (Recomendado)

1. **Push para `main`**:
   ```bash
   git add .
   git commit -m "Sua mensagem"
   git push origin main
   ```

2. O Vercel detecta automaticamente o push
3. Executa o build
4. Faz deploy da aplicação
5. Você recebe uma URL de preview e produção

### Deploy via GitHub Actions (Opcional)

O workflow `.github/workflows/deploy.yml` está configurado para:
- Validar o build em cada push/PR
- Fazer deploy para produção quando mergeado em `main`

## 📋 Checklist de Deploy

- [ ] Repositório conectado ao Vercel
- [ ] Variável `GEMINI_API_KEY` configurada no Vercel
- [ ] Primeiro deploy realizado com sucesso
- [ ] URL de produção funcionando
- [ ] (Opcional) GitHub Secrets configurados

## 🔍 Verificar Status do Deploy

1. **No Vercel Dashboard**: Veja todos os deploys em tempo real
2. **No GitHub Actions**: Veja os logs de build e validação
3. **URLs**:
   - Produção: `https://seu-projeto.vercel.app`
   - Preview: Cada PR/commit gera uma URL única

## 🐛 Solução de Problemas

### Build falha no Vercel

1. Verifique se `GEMINI_API_KEY` está configurada
2. Verifique os logs no dashboard do Vercel
3. Teste o build localmente: `npm run build`

### GitHub Actions falha

1. Verifique se todos os secrets estão configurados
2. Verifique se os IDs do Vercel estão corretos
3. Veja os logs detalhados na aba Actions do GitHub

### Deploy não dispara automaticamente

1. Verifique se o repositório está conectado no Vercel
2. Verifique se está fazendo push para a branch `main`
3. Verifique as configurações de integração no Vercel

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no repositório GitHub.

