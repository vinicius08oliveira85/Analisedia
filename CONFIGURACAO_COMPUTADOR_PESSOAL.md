# ✅ Configuração do Computador Pessoal - Concluída!

O repositório **Analisedia** foi clonado com sucesso no seu computador pessoal.

## 📍 Status Atual

- ✅ Repositório clonado de: `https://github.com/vinicius08oliveira85/Analisedia`
- ✅ Git configurado e conectado ao remoto
- ✅ Branch: `main` (sincronizada com origin/main)
- ✅ Todos os arquivos do projeto copiados
- ⏳ Dependências: **Execute `npm install` manualmente** (pode demorar alguns minutos)

## 🚀 Próximos Passos

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as mesmas variáveis do computador da empresa:

```env
GEMINI_API_KEY=sua_chave_api_gemini_aqui
```

**Importante:** Copie as variáveis do computador da empresa ou recrie o arquivo `.env.local` com as mesmas credenciais.

### 3. Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173 (Vite usa porta 5173 por padrão)

## 🔄 Como Funciona o Trabalho em Dois Computadores

### Deploy Automático

O projeto está configurado com:
- **Railway**: Deploy automático via GitHub Actions a cada push na branch `main`

**Ambos os computadores compartilham o mesmo repositório GitHub**, então:

⚠️ **IMPORTANTE**: Os secrets do GitHub Actions (RAILWAY_TOKEN, etc.) são configurados no **repositório GitHub**, não em computadores específicos. Se você já configurou no computador da empresa, **já está funcionando** para ambos os computadores!

1. **Quando você faz push de qualquer computador** → Deploy automático é acionado
2. **Sempre faça `git pull` antes de começar** → Para pegar as últimas mudanças
3. **Commite e faça push frequentemente** → Para manter ambos sincronizados

### Fluxo de Trabalho Diário

#### No Computador Pessoal (ou Empresa):

```bash
# 1. Sempre atualize antes de começar
git pull origin main

# 2. Faça suas alterações no código

# 3. Commit e push
git add .
git commit -m "Descrição das alterações"
git push origin main

# 4. O deploy automático será acionado automaticamente! 🚀
```

## 📋 Checklist de Configuração

- [x] Repositório clonado
- [x] Git configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Teste local funcionando (`npm run dev`)
- [ ] Deploy automático verificado (fazer um push de teste)

## 🔐 Segurança

⚠️ **Nunca commite arquivos `.env` ou `.env.local` com credenciais reais!**

O arquivo `.gitignore` já está configurado para ignorar:
- `*.local` (inclui `.env.local`)
- `node_modules/`
- `dist/`

## 🆘 Resolução de Problemas

### Erro ao fazer pull: "fatal: refusing to merge unrelated histories"
```bash
git pull origin main --allow-unrelated-histories
```

### Conflito de merge
```bash
# Resolva os conflitos manualmente nos arquivos
# Depois:
git add .
git commit -m "Resolve conflitos"
git push origin main
```

### Esqueceu de fazer pull antes de trabalhar
```bash
git pull --rebase origin main
```

## 📚 Informações do Projeto

- **Node.js**: Versão 22.12.0 (verifique com `node --version`)
- **Framework**: React 19 + Vite
- **Deploy**: Railway (automático via GitHub Actions)
- **URL de Produção**: Verifique no dashboard do Railway

## ✨ Dicas

1. **Use branches para features grandes:**
   ```bash
   git checkout -b feature/nova-funcionalidade
   # trabalhe na branch
   git push origin feature/nova-funcionalidade
   ```

2. **Verifique o status antes de commitar:**
   ```bash
   git status
   git log --oneline -5  # últimos 5 commits
   ```

3. **Mantenha ambos os computadores atualizados:**
   - Sempre faça `git pull` ao começar
   - Sempre faça `git push` ao terminar

---

**Tudo pronto! Agora você pode trabalhar no projeto em ambos os computadores! 🎉**

