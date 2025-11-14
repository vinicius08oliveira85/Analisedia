# Guia: Configurar Repositório em Múltiplos Computadores

Este guia explica como manter o mesmo repositório GitHub funcionando em dois computadores (empresa e pessoal) com deploy automático.

## 📋 Pré-requisitos

1. **Git instalado** em ambos os computadores
2. **Conta GitHub** com acesso ao repositório
3. **Node.js instalado** (se for projeto Node.js/Next.js)
4. **Vercel CLI** (se usar Vercel para deploy)

## 🚀 Passo a Passo

### 1. No Computador Pessoal - Clonar o Repositório

```bash
# Navegue até a pasta onde quer clonar o projeto
cd C:\Users\vinic\projetos  # ou onde preferir

# Clone o repositório
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Entre na pasta do projeto
cd SEU_REPOSITORIO
```

### 2. Configurar Git (se ainda não configurou)

```bash
# Configure seu nome e email (pode ser diferente em cada computador)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"

# Ou configure globalmente para todos os projetos
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 3. Instalar Dependências

```bash
# Se for projeto Node.js/Next.js
npm install
# ou
yarn install
# ou
pnpm install
```

### 4. Configurar Variáveis de Ambiente

Se o projeto usa variáveis de ambiente (Supabase, APIs, etc.):

```bash
# Copie o arquivo .env.example (se existir) ou crie um .env.local
# Configure as mesmas variáveis que estão no computador da empresa
```

**Importante:** Não commite arquivos `.env` com credenciais reais no Git!

### 5. Verificar Deploy Automático

#### Se usar GitHub Actions:
- O deploy automático continuará funcionando automaticamente
- Verifique em: `https://github.com/SEU_USUARIO/SEU_REPOSITORIO/actions`

#### Se usar Railway:
- O Railway faz deploy automático via GitHub Actions
- Configure os secrets no GitHub:
  - `RAILWAY_TOKEN`: Token do Railway
  - `RAILWAY_PROJECT_ID`: ID do projeto (opcional)
  - `RAILWAY_SERVICE_ID`: ID do serviço (opcional)

### 6. Fluxo de Trabalho Diário

#### Para trabalhar no computador pessoal:

```bash
# 1. Sempre atualize antes de começar
git pull origin main  # ou master, dependendo da branch principal

# 2. Faça suas alterações

# 3. Commit e push
git add .
git commit -m "Descrição das alterações"
git push origin main

# 4. O deploy automático será acionado automaticamente
```

#### Para trabalhar no computador da empresa:

```bash
# 1. Sempre atualize antes de começar
git pull origin main

# 2. Faça suas alterações

# 3. Commit e push
git add .
git commit -m "Descrição das alterações"
git push origin main
```

## ⚠️ Dicas Importantes

### Evitar Conflitos

1. **Sempre faça `git pull` antes de começar a trabalhar**
2. **Commite e faça push frequentemente** (não deixe acumular)
3. **Use branches para features grandes:**
```bash
git checkout -b feature/nova-funcionalidade
# trabalhe na branch
git push origin feature/nova-funcionalidade
# depois faça merge na main
```

### Sincronização

Se você fez alterações em um computador e quer continuar no outro:

```bash
# No computador onde vai continuar
git pull origin main
```

### Verificar Status

```bash
# Ver o status atual
git status

# Ver histórico de commits
git log --oneline

# Ver branches
git branch -a
```

## 🔐 Segurança

1. **Nunca commite:**
   - Arquivos `.env` com credenciais
   - `node_modules/`
   - Arquivos de build
   - Chaves privadas

2. **Use `.gitignore`** para proteger arquivos sensíveis

3. **Use variáveis de ambiente** para secrets

## 📝 Checklist de Configuração

- [ ] Git instalado e configurado
- [ ] Repositório clonado no computador pessoal
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Deploy automático verificado (GitHub Actions ou Vercel)
- [ ] Teste de push/pull funcionando

## 🆘 Resolução de Problemas

### Erro: "fatal: not a git repository"
```bash
# Você precisa estar dentro da pasta do projeto
cd SEU_REPOSITORIO
```

### Conflito de merge
```bash
# Se houver conflitos ao fazer pull
git pull origin main
# Resolva os conflitos manualmente nos arquivos
# Depois:
git add .
git commit -m "Resolve conflitos"
git push origin main
```

### Esqueceu de fazer pull antes de trabalhar
```bash
# Se você já fez commits locais mas o remoto tem mudanças
git pull --rebase origin main
# Isso aplica seus commits por cima das mudanças remotas
```

## 📚 Recursos Adicionais

- [Documentação Git](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)

