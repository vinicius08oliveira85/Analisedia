# 📦 Guia de Instalação de Dependências

## 🔍 Passo 1: Verificar se o Node.js está Instalado

Abra o PowerShell ou Prompt de Comando e execute:

```powershell
node --version
npm --version
```

Se aparecer um erro dizendo que o comando não foi reconhecido, você precisa instalar o Node.js.

---

## 📥 Passo 2: Instalar o Node.js (se necessário)

### Opção A: Download Direto (Recomendado)

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS (Long Term Support)** - recomendada para a maioria dos usuários
3. Execute o instalador `.msi`
4. Siga as instruções do instalador (aceite os termos, clique em "Next")
5. **IMPORTANTE**: Marque a opção "Add to PATH" durante a instalação
6. Reinicie o terminal/PowerShell após a instalação

### Opção B: Via Chocolatey (se você usa Chocolatey)

```powershell
choco install nodejs-lts
```

### Opção C: Via Winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ✅ Passo 3: Verificar a Instalação

Após instalar, **feche e reabra** o PowerShell/Prompt de Comando e execute:

```powershell
node --version
npm --version
```

Você deve ver algo como:
```
v20.x.x
10.x.x
```

---

## 📂 Passo 4: Navegar até o Diretório do Projeto

No PowerShell, navegue até o diretório do projeto:

```powershell
cd "C:\Users\vinicius.carvalho\Cur Sor\Cursor\Analisedia"
```

---

## 📦 Passo 5: Instalar as Dependências

Execute o comando:

```powershell
npm install
```

Isso irá instalar todas as dependências listadas no `package.json`, incluindo:
- ✅ React e React DOM
- ✅ TypeScript
- ✅ Vite
- ✅ @google/genai
- ✅ @vercel/node (nova dependência para a API)

**Tempo estimado:** 1-3 minutos dependendo da sua conexão

---

## 🎯 Passo 6: Verificar se Tudo Funcionou

Após a instalação, você deve ver uma mensagem de sucesso e uma pasta `node_modules` será criada.

Execute para verificar:

```powershell
npm list --depth=0
```

Isso mostrará todas as dependências instaladas.

---

## 🚀 Passo 7: Executar o Projeto em Desenvolvimento

Agora você pode executar o projeto localmente:

```powershell
npm run dev
```

O aplicativo estará disponível em: **http://localhost:5173**

---

## 🐛 Problemas Comuns

### Erro: "npm não é reconhecido"

**Solução:**
1. Certifique-se de que o Node.js foi instalado corretamente
2. Reinicie o terminal/PowerShell
3. Verifique se o Node.js está no PATH:
   ```powershell
   $env:PATH
   ```
   Deve conter algo como: `C:\Program Files\nodejs\`

### Erro: "Permission denied" ou "Access denied"

**Solução:**
- Execute o PowerShell como Administrador
- Ou configure o npm para usar um diretório diferente:
  ```powershell
  npm config set prefix "$env:APPDATA\npm"
  ```

### Erro: "EACCES" ou problemas de permissão

**Solução:**
- No Windows, geralmente não é um problema
- Se persistir, execute o PowerShell como Administrador

### Erro: "ERR! network" ou problemas de conexão

**Solução:**
- Verifique sua conexão com a internet
- Tente limpar o cache do npm:
  ```powershell
  npm cache clean --force
  ```
- Tente novamente: `npm install`

---

## 📋 Checklist de Instalação

- [ ] Node.js instalado (versão 20 ou superior)
- [ ] npm instalado e funcionando
- [ ] Navegou até o diretório do projeto
- [ ] Executou `npm install` com sucesso
- [ ] Pasta `node_modules` foi criada
- [ ] Pode executar `npm run dev` sem erros

---

## 🎉 Próximos Passos Após Instalação

1. **Testar localmente:**
   ```powershell
   npm run dev
   ```

2. **Fazer build para produção:**
   ```powershell
   npm run build
   ```

3. **Fazer deploy no Vercel:**
   - Conecte o repositório GitHub ao Vercel
   - O Vercel detectará automaticamente o projeto
   - As dependências serão instaladas automaticamente no deploy

---

## 💡 Dica Extra

Se você usar o **VS Code** ou **Cursor**, pode abrir o terminal integrado:
- Pressione `` Ctrl + ` `` (backtick)
- Ou vá em: Terminal > New Terminal

O terminal já estará no diretório correto do projeto!

---

**Precisa de mais ajuda?** Verifique os logs de erro ou consulte a documentação do Node.js: https://nodejs.org/docs/

