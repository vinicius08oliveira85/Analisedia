<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 Futibou Analytics - Análise de Jogo de Futebol

Aplicativo de análise de partidas e probabilidade de over 1.5 gols com integração do Google Gemini AI.

## 📋 Pré-requisitos

- Node.js 20 ou superior
- Conta no Google Cloud com API do Gemini habilitada
- Conta no Vercel (para deploy)

## 🏃 Executar Localmente

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   GEMINI_API_KEY=sua_chave_api_gemini_aqui
   ```

3. **Executar o aplicativo:**
   ```bash
   npm run dev
   ```

4. **Acessar o aplicativo:**
   Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🚀 Deploy Automático

O projeto está configurado para deploy automático no Vercel a cada push na branch `main`.

### Configuração Inicial no Vercel

1. **Conectar o repositório:**
   - Acesse [Vercel](https://vercel.com)
   - Importe o repositório `Academiadasanalises`
   - Configure as variáveis de ambiente:
     - `GEMINI_API_KEY`: Sua chave da API do Gemini

2. **Configurar GitHub Secrets (para GitHub Actions):**
   No repositório GitHub, vá em Settings > Secrets and variables > Actions e adicione:
   - `VERCEL_TOKEN`: Token do Vercel (obtenha em [Vercel Settings > Tokens](https://vercel.com/account/tokens))
   - `VERCEL_ORG_ID`: ID da organização (encontre no arquivo `.vercel/project.json` após primeiro deploy)
   - `VERCEL_PROJECT_ID`: ID do projeto (encontre no arquivo `.vercel/project.json` após primeiro deploy)
   - `GEMINI_API_KEY`: Chave da API do Gemini (para builds)

### Como Funciona o Deploy Automático

- **Push para `main`**: Dispara automaticamente o deploy no Vercel
- **GitHub Actions**: Executa build e validação antes do deploy
- **Vercel**: Faz o deploy automático via integração com GitHub

### Deploy Manual

Se preferir fazer deploy manual:

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## 📁 Estrutura do Projeto

```
├── components/          # Componentes React
├── services/           # Serviços (Gemini, Probabilidade)
├── types.ts           # Tipos TypeScript
├── data.ts            # Dados de exemplo
├── vite.config.ts     # Configuração do Vite
└── vercel.json        # Configuração do Vercel
```

## 🔧 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Google Gemini AI** - Análise inteligente
- **Vercel** - Deploy e hospedagem

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | Chave da API do Google Gemini | Sim |

## 📄 Licença

Este projeto é privado e pertence a Vinicius Carvalho.

---

**Desenvolvido com ❤️ para análise de futebol**
