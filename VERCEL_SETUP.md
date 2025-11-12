# 🚀 Guia Rápido: Deploy no Vercel

## Passo a Passo para Visualizar o Projeto no Vercel

### 1. Acesse o Vercel
👉 [https://vercel.com](https://vercel.com)

### 2. Faça Login
- Use sua conta GitHub (recomendado para integração automática)

### 3. Importe o Projeto
1. Clique em **"Add New..."** ou **"New Project"**
2. Selecione **"Import Git Repository"**
3. Escolha o repositório: **`vinicius08oliveira85/Academiadasanalises`**
4. Clique em **"Import"**

### 4. Configure o Projeto
O Vercel detectará automaticamente que é um projeto Vite. Verifique as configurações:

- **Framework Preset**: `Vite` (deve estar selecionado automaticamente)
- **Root Directory**: `./` (raiz do projeto)
- **Build Command**: `npm run build` (já configurado)
- **Output Directory**: `dist` (já configurado)
- **Install Command**: `npm install` (já configurado)

### 5. Configure Variáveis de Ambiente ⚠️ IMPORTANTE
1. Na seção **"Environment Variables"**, clique em **"Add"**
2. Adicione:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `sua_chave_api_gemini_aqui`
   - **Environments**: Selecione todas (Production, Preview, Development)
3. Clique em **"Save"**

### 6. Faça o Deploy
1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 1-2 minutos)
3. Quando concluir, você verá:
   - ✅ Status: "Ready"
   - 🌐 URL de produção (ex: `https://academiadasanalises.vercel.app`)

### 7. Acesse seu Projeto
- Clique na URL fornecida ou acesse pelo dashboard do Vercel
- Seu aplicativo estará online! 🎉

## 🔄 Deploy Automático

Após a configuração inicial:
- ✅ Cada push para `main` → Deploy automático
- ✅ Cada PR → Preview automático
- ✅ Builds validados antes do deploy

## 🐛 Solução de Problemas

### Build Falha
- Verifique se `GEMINI_API_KEY` está configurada
- Veja os logs no dashboard do Vercel
- Verifique se todas as dependências estão no `package.json`

### Erro 404 ao Acessar Rotas
- O `vercel.json` já está configurado com rewrites para SPA
- Se persistir, verifique se o `outputDirectory` está como `dist`

### Variável de Ambiente Não Funciona
- Certifique-se de que a variável está configurada para todos os ambientes
- Reinicie o deploy após adicionar variáveis

## 📝 Checklist

- [ ] Repositório importado no Vercel
- [ ] Framework detectado como Vite
- [ ] Variável `GEMINI_API_KEY` configurada
- [ ] Primeiro deploy concluído com sucesso
- [ ] URL de produção funcionando
- [ ] Deploy automático ativado

## 🎯 Próximos Passos

1. **Personalizar Domínio** (opcional):
   - Settings > Domains
   - Adicione seu domínio personalizado

2. **Configurar Analytics** (opcional):
   - Settings > Analytics
   - Ative o analytics do Vercel

3. **Monitorar Deploys**:
   - Acompanhe todos os deploys no dashboard
   - Veja logs em tempo real

---

**Pronto! Seu projeto está no ar! 🚀**

