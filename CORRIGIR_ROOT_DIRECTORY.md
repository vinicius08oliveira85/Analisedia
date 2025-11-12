# 🔴 ERRO CRÍTICO: Root Directory Não Existe

## ⚠️ Erro Encontrado

```
The specified Root Directory 'análise-de-jogo-de-futebol' does not exist.
```

## ✅ SOLUÇÃO IMEDIATA

O Vercel não está encontrando o diretório `análise-de-jogo-de-futebol` no repositório GitHub.

### Opção 1: Root Directory Deve Estar VAZIO (Mais Provável)

Se os arquivos do projeto (`package.json`, `index.html`, etc.) estão na **raiz do repositório GitHub**, então:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **academiadasanalises**
3. Vá em **Settings > General**
4. Procure por **"Root Directory"**
5. **DEIXE COMPLETAMENTE VAZIO** (delete o texto `análise-de-jogo-de-futebol`)
6. Clique em **"Save"**
7. Faça um novo deploy

### Opção 2: Verificar Estrutura do Repositório

Para verificar onde estão os arquivos:

1. Acesse: https://github.com/vinicius08oliveira85/Academiadasanalises
2. Veja a estrutura de arquivos
3. Se `package.json` está na raiz → Root Directory deve estar **VAZIO**
4. Se `package.json` está em `análise-de-jogo-de-futebol/` → Root Directory deve ser `análise-de-jogo-de-futebol`

## 🔍 Como Verificar

No GitHub, a estrutura deve ser uma dessas:

### Estrutura 1 (Arquivos na Raiz):
```
Academiadasanalises/
├── package.json
├── index.html
├── vercel.json
└── ...
```
**→ Root Directory: VAZIO**

### Estrutura 2 (Arquivos em Subdiretório):
```
Academiadasanalises/
└── análise-de-jogo-de-futebol/
    ├── package.json
    ├── index.html
    └── ...
```
**→ Root Directory: `análise-de-jogo-de-futebol`**

## 🎯 Ação Imediata

**VÁ NO VERCEL AGORA E:**

1. Settings > General
2. Root Directory → **DEIXE VAZIO**
3. Save
4. Redeploy

---

**Este é o problema! Corrija o Root Directory no Vercel!** ✅

