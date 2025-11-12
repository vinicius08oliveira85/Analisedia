# 🚀 DEPLOY PASSO A PASSO - Vercel

## ✅ TUDO PRONTO PARA DEPLOY!

Seu código está 100% pronto. Siga estes passos:

---

## 📋 PASSO 1: Acessar o Vercel

1. Abra seu navegador
2. Acesse: **https://vercel.com**
3. Clique em **"Sign Up"** ou **"Log In"**
4. **Escolha:** "Continue with GitHub"
5. Autorize o Vercel a acessar seus repositórios

---

## 📋 PASSO 2: Importar o Projeto

1. No dashboard do Vercel, clique no botão grande: **"Add New Project"**
2. Você verá uma lista dos seus repositórios GitHub
3. **Procure e selecione:** `Analisedia` (ou `vinicius08oliveira85/Analisedia`)
4. Clique em **"Import"**

---

## 📋 PASSO 3: Configurar o Projeto

O Vercel vai mostrar uma tela de configuração. Configure assim:

### 3.1 Framework Preset
- ✅ **Deve estar:** `Vite` (já detectado automaticamente)
- Se não estiver, selecione manualmente: `Vite`

### 3.2 Root Directory
- ✅ **Deixe:** `./` (vazio ou ponto e barra)
- ❌ **NÃO** coloque nada aqui

### 3.3 Build and Output Settings

Clique em **"Edit"** ao lado de "Build and Output Settings" se necessário:

#### Build Command:
```
npm run build
```

#### Output Directory:
```
dist
```

#### Install Command:
- ✅ **Toggle deve estar LIGADO** (ativado)
- Deve mostrar: `npm install`

---

## 📋 PASSO 4: Configurar Variável de Ambiente (CRÍTICO!)

1. Na mesma tela, role até a seção **"Environment Variables"**
2. Clique em **"+ Add More"**
3. Preencha:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Cole aqui sua chave da API do Google Gemini
   - **Environments:** Selecione todas (Production, Preview, Development)
4. Clique em **"Add"**

⚠️ **IMPORTANTE:** Sem essa variável, o app não funcionará!

**Onde conseguir a chave:**
- Acesse: https://aistudio.google.com/app/apikey
- Crie uma nova chave se não tiver
- Copie e cole no campo "Value"

---

## 📋 PASSO 5: Fazer Deploy

1. Role até o final da página
2. Clique no botão grande: **"Deploy"**
3. Aguarde 2-3 minutos enquanto o Vercel:
   - ✅ Instala Node.js
   - ✅ Instala dependências
   - ✅ Compila o projeto
   - ✅ Faz deploy

---

## 📋 PASSO 6: Verificar Deploy

1. Você verá uma barra de progresso
2. Quando terminar, verá: **"Congratulations! Your project has been deployed"**
3. Clique no botão **"Visit"** ou na URL mostrada
4. Seu app estará online! 🎉

**URL será algo como:**
- `https://analisedia.vercel.app`
- ou `https://analisedia-xxxxx.vercel.app`

---

## ✅ VERIFICAÇÕES PÓS-DEPLOY

### 1. Testar a Aplicação
- Acesse a URL fornecida
- Deve ver a tela inicial com a lista de jogos
- Deve ver o componente "Atualizar Jogos do Dia"

### 2. Testar a API
- Acesse: `https://sua-url.vercel.app/api/matches`
- Deve retornar uma mensagem JSON

### 3. Verificar Logs (se houver erro)
- No dashboard do Vercel, vá em **"Deployments"**
- Clique no último deploy
- Veja os **"Build Logs"** para verificar erros

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Erro: "Build Failed"

**Solução:**
1. Vá em **Settings > General**
2. Verifique se:
   - Root Directory está como `./` (vazio)
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Vá em **Deployments** > Clique nos 3 pontos > **"Redeploy"**

### ❌ Erro: "404 Not Found"

**Solução:**
1. Verifique se o Output Directory está como `dist`
2. Verifique se o `vercel.json` está na raiz do projeto
3. Faça um novo deploy

### ❌ Erro: "GEMINI_API_KEY not found"

**Solução:**
1. Vá em **Settings > Environment Variables**
2. Verifique se `GEMINI_API_KEY` está configurada
3. Se não estiver, adicione
4. Faça um novo deploy (as variáveis só são aplicadas em novos deploys)

### ❌ Erro: "Module not found"

**Solução:**
- O Vercel instala automaticamente, mas se houver erro:
1. Verifique se o `package.json` está correto
2. Veja os Build Logs para mais detalhes

---

## 🎯 CHECKLIST FINAL

Antes de clicar em "Deploy", verifique:

- [ ] Framework: **Vite** ✅
- [ ] Root Directory: **./** (vazio) ✅
- [ ] Build Command: **npm run build** ✅
- [ ] Output Directory: **dist** ✅
- [ ] Install Command: **npm install** (toggle ligado) ✅
- [ ] Environment Variable: **GEMINI_API_KEY** adicionada ✅
- [ ] Repositório correto selecionado: **Analisedia** ✅

---

## 🚀 DEPLOY AUTOMÁTICO (Futuro)

Após o primeiro deploy, o Vercel configurará automaticamente:

- ✅ **Deploy automático** a cada push na branch `main`
- ✅ **Preview deployments** para Pull Requests
- ✅ **Domínio personalizado** (se configurado)

---

## 📞 PRECISA DE AJUDA?

Se algo der errado:

1. **Veja os Build Logs** no Vercel
2. **Verifique** se todas as configurações estão corretas
3. **Tente fazer um Redeploy**

---

## 🎉 PRONTO!

Após seguir esses passos, seu aplicativo estará:
- ✅ Online e acessível
- ✅ API funcionando em `/api/matches`
- ✅ Componente de atualização de jogos funcionando
- ✅ Integração com Gemini AI funcionando

**Tempo total estimado:** 5-10 minutos

---

**Boa sorte com o deploy! 🚀**

