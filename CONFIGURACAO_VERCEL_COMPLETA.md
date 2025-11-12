# 🚀 Configuração Completa do Vercel

Guia passo a passo para configurar o projeto **Analisedia** no Vercel.

## 📋 Configurações na Página do Vercel

### 1. Framework Preset
✅ **Selecione:** `Vite` (já deve estar selecionado)

### 2. Root Directory
✅ **Configure como:** `./` (raiz do projeto)

### 3. Build and Output Settings

#### Build Command
✅ **Configure como:**
```
npm run build
```

#### Output Directory
✅ **Configure como:**
```
dist
```

#### Install Command
✅ **Deixe o toggle LIGADO** (ativado) e use:
```
npm install
```

### 4. Environment Variables (IMPORTANTE!)

Você **DEVE** adicionar a seguinte variável de ambiente:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | `sua_chave_api_gemini_aqui` |

**Como adicionar:**
1. Clique em **"+ Add More"** na seção Environment Variables
2. **Key:** `GEMINI_API_KEY`
3. **Value:** Cole sua chave da API do Google Gemini
4. Salve

⚠️ **IMPORTANTE:** Sem essa variável, o aplicativo não funcionará corretamente!

---

## 🔧 Configurações Adicionais Recomendadas

### Node.js Version
No Vercel, você pode especificar a versão do Node.js. Recomendado:
- **Node.js Version:** `20.x` ou superior

### Build Settings Avançadas (Opcional)

Se necessário, você pode adicionar estas configurações no painel do Vercel:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

---

## ✅ Checklist de Configuração

Antes de clicar em **Deploy**, verifique:

- [ ] Framework Preset: **Vite** ✓
- [ ] Root Directory: **./** ✓
- [ ] Build Command: **npm run build** ✓
- [ ] Output Directory: **dist** ✓
- [ ] Install Command: **npm install** (toggle ativado) ✓
- [ ] Environment Variable **GEMINI_API_KEY** adicionada ✓

---

## 🚀 Deploy

Após configurar tudo:

1. Clique no botão **"Deploy"** na parte inferior da página
2. Aguarde o build completar (geralmente 1-3 minutos)
3. O Vercel fornecerá uma URL do tipo: `https://analisedia.vercel.app`

---

## 🔄 Deploy Automático

Após o primeiro deploy, o Vercel configurará automaticamente:

- ✅ Deploy automático a cada push na branch `main`
- ✅ Preview deployments para Pull Requests
- ✅ Domínio personalizado (se configurado)

---

## 🐛 Troubleshooting

### Erro: "Build failed"
- Verifique se a variável `GEMINI_API_KEY` está configurada
- Verifique os logs de build no Vercel para mais detalhes

### Erro: "404 Not Found"
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que o Output Directory está como `dist`

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para testar

---

## 📝 Notas Importantes

1. **Variáveis de Ambiente:** As variáveis configuradas no Vercel são injetadas durante o build
2. **Segurança:** Nunca commite a `GEMINI_API_KEY` no código
3. **Build Time:** O build pode levar alguns minutos na primeira vez

---

**Pronto! Após seguir esses passos, seu projeto estará configurado e deployado no Vercel! 🎉**

