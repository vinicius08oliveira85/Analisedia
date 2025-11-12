# ⚠️ CONFIGURAÇÃO CRÍTICA DO VERCEL

## 🔴 PROBLEMA IDENTIFICADO

O repositório GitHub tem esta estrutura:
```
Academiadasanalises/
└── análise-de-jogo-de-futebol/
    ├── package.json
    ├── index.html
    ├── vercel.json
    └── ...
```

**O Vercel precisa saber onde está o `package.json`!**

## ✅ SOLUÇÃO NO VERCEL

### Passo 1: Configurar Root Directory

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **academiadasanalises**
3. Vá em **Settings > General**
4. Procure por **"Root Directory"**
5. **CONFIGURE COMO**: `análise-de-jogo-de-futebol`
   - ✅ Deve ser exatamente: `análise-de-jogo-de-futebol`
   - ❌ NÃO deixe vazio
   - ❌ NÃO use `./`
6. Clique em **"Save"**

### Passo 2: Verificar Build Settings

Na mesma página, verifique:

- **Framework Preset**: `Vite` ✅
- **Root Directory**: `análise-de-jogo-de-futebol` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist` ✅
- **Install Command**: `npm install` ✅

### Passo 3: Verificar Environment Variables

1. Vá em **Settings > Environment Variables**
2. Verifique se existe:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: (sua chave)
   - **Environments**: Todas selecionadas

### Passo 4: Fazer Novo Deploy

1. Vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do último deploy
3. Selecione **"Redeploy"**
4. Aguarde o build concluir

## 🎯 Por Que Isso Resolve?

O Vercel procura o `package.json` na raiz do repositório. Como o projeto está em um subdiretório, o Vercel precisa saber onde procurar.

Com `Root Directory: análise-de-jogo-de-futebol`, o Vercel vai:
1. Entrar nesse diretório
2. Encontrar o `package.json`
3. Executar `npm install`
4. Executar `npm run build`
5. Procurar os arquivos em `dist/` dentro desse diretório

## 📋 Checklist

- [ ] Root Directory configurado como `análise-de-jogo-de-futebol`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] `GEMINI_API_KEY` configurada
- [ ] Novo deploy executado
- [ ] Build concluído com sucesso

## 🚨 Se Ainda Não Funcionar

1. Veja os **Build Logs** completos
2. Procure por erros específicos
3. Verifique se o build gerou `dist/index.html`
4. Se necessário, delete e recrie o projeto

---

**Esta é a configuração correta para o seu caso!** ✅

