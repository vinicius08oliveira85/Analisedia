# 🚀 Como Criar o Repositório no GitHub

O repositório Git local já está configurado e pronto! Agora você precisa criar o repositório no GitHub e conectar.

## 📋 Opção 1: Usando o Script Automático (Recomendado)

### Passo 1: Obter Token do GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** > **"Generate new token (classic)"**
3. Dê um nome (ex: "Analisedia Repo")
4. Selecione a permissão **`repo`** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **Copie o token** (você só verá ele uma vez!)

### Passo 2: Executar o Script

No PowerShell, execute:

```powershell
.\create-github-repo.ps1 -Token "seu_token_aqui" -RepoName "Analisedia"
```

O script irá:
- ✅ Criar o repositório no GitHub
- ✅ Conectar o remote
- ✅ Fazer push do código

---

## 📋 Opção 2: Criar Manualmente no GitHub

### Passo 1: Criar o Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name**: `Analisedia`
3. **Description**: `Aplicativo de análise de partidas e probabilidade de over 1.5 gols`
4. Escolha **Public** ou **Private**
5. **NÃO** marque "Initialize this repository with a README" (já temos um)
6. Clique em **"Create repository"**

### Passo 2: Conectar e Fazer Push

Após criar o repositório, o GitHub mostrará instruções. Execute no PowerShell:

```powershell
# Substitua SEU_USUARIO pelo seu nome de usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/Analisedia.git
git branch -M main
git push -u origin main
```

---

## ✅ Verificação

Após qualquer uma das opções, verifique:

```powershell
git remote -v
```

Deve mostrar:
```
origin  https://github.com/SEU_USUARIO/Analisedia.git (fetch)
origin  https://github.com/SEU_USUARIO/Analisedia.git (push)
```

---

## 🔐 Segurança

⚠️ **Nunca compartilhe seu token do GitHub!**
- Não commite o token no código
- Não compartilhe em mensagens ou emails
- Se expor acidentalmente, revogue o token imediatamente

---

## 📝 Próximos Passos

Após criar o repositório:

1. ✅ Configure os GitHub Secrets (se usar GitHub Actions)
2. ✅ Conecte o repositório no Vercel
3. ✅ Configure as variáveis de ambiente no Vercel

---

**Pronto! Seu repositório está configurado localmente e pronto para ser criado no GitHub! 🎉**

