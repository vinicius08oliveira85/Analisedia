# ⚡ Instruções Rápidas - Computador Pessoal

## ✅ O que já está pronto:

1. ✅ Repositório clonado e configurado
2. ✅ Git conectado ao GitHub
3. ✅ Todos os arquivos do projeto copiados

## 🚀 Execute agora (no terminal):

### 1. Instalar Dependências
```bash
npm install
```
⏱️ Isso pode levar 2-5 minutos na primeira vez.

### 2. Criar arquivo de variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com:
```env
GEMINI_API_KEY=sua_chave_api_gemini_aqui
```

**Importante:** Use a mesma chave do computador da empresa ou obtenha uma nova em:
https://aistudio.google.com/app/apikey

### 3. Testar localmente
```bash
npm run dev
```

Acesse: http://localhost:5173

## 🔄 Trabalhar no projeto:

### Sempre antes de começar:
```bash
git pull origin main
```

### Depois de fazer alterações:
```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```

O deploy automático no Railway acontecerá automaticamente! 🚀

⚠️ **Importante**: Os secrets do GitHub Actions são configurados no repositório GitHub (não em computadores). Se você já configurou no computador da empresa, **já está funcionando** para ambos!

## 📝 Notas:

- O deploy automático funciona em ambos os computadores
- Sempre sincronize com `git pull` antes de trabalhar
- Sempre faça `git push` após suas alterações
- O Railway faz deploy automático via GitHub Actions

---

**Tudo configurado! Agora é só instalar as dependências e começar a trabalhar! 🎉**

