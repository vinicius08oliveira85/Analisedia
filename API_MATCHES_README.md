# 🚀 API de Atualização de Jogos do Dia

Sistema completo para atualizar os jogos do dia no aplicativo Futibou Analytics através de uma API serverless no Vercel.

## 📋 Como Funciona

1. **API Serverless** (`/api/matches.ts`): Processa HTML e extrai dados de jogos
2. **Serviço Frontend** (`/services/matchesService.ts`): Comunica com a API
3. **Componente de Atualização** (`/components/UpdateMatches.tsx`): Interface para upload/colar HTML

## 🔧 Estrutura

```
api/
  └── matches.ts          # API serverless (Vercel)
services/
  └── matchesService.ts  # Serviço para chamar a API
components/
  └── UpdateMatches.tsx  # Componente de UI
```

## 📝 Como Usar

### Opção 1: Colar HTML da Área de Transferência

1. Acesse a página "Academia Jogos Do Dia" no navegador
2. Pressione `Ctrl+A` para selecionar tudo
3. Pressione `Ctrl+C` para copiar
4. No aplicativo, clique em **"Colar HTML da Área de Transferência"**
5. Os jogos serão processados e atualizados automaticamente

### Opção 2: Upload de Arquivo

1. Salve o HTML da página em um arquivo `.txt` ou `.html`
2. No aplicativo, clique em **"Upload de Arquivo"**
3. Selecione o arquivo salvo
4. Os jogos serão processados e atualizados automaticamente

## 🔍 O que a API Processa

A API extrai os seguintes dados do HTML:

- ✅ Nome dos times (mandante e visitante)
- ✅ Logos dos times
- ✅ Data e horário do jogo
- ✅ Competição
- ✅ URL do jogo

**Nota:** Dados estatísticos detalhados (H2H, forma, streaks, etc.) não estão disponíveis no HTML básico e são preenchidos com valores placeholder. Para dados completos, seria necessário fazer scraping adicional das páginas individuais de cada jogo.

## 🌐 Endpoints da API

### POST `/api/matches`

Processa HTML e retorna jogos atualizados.

**Request:**
```json
{
  "html": "<!DOCTYPE html>..."
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "matches": [
    {
      "id": "atletico-mg-fortaleza",
      "teamA": {
        "name": "Atlético-MG",
        "logo": "https://..."
      },
      "teamB": {
        "name": "Fortaleza",
        "logo": "https://..."
      },
      "matchInfo": {
        "date": "12 novembro 2025",
        "time": "20:30",
        "competition": "Brasileirão Série A"
      },
      ...
    }
  ],
  "message": "3 jogos processados com sucesso"
}
```

### GET `/api/matches`

Retorna informações sobre o endpoint (para desenvolvimento).

## 💾 Armazenamento

Os jogos atualizados são salvos no `localStorage` do navegador com a chave `updatedMatches`. Isso permite que os dados persistam mesmo após recarregar a página.

## 🚀 Deploy no Vercel

A API está configurada para funcionar automaticamente no Vercel:

1. ✅ Arquivo em `api/matches.ts` será deployado como serverless function
2. ✅ Rota `/api/matches` estará disponível automaticamente
3. ✅ CORS configurado para permitir requisições do frontend

## 🔒 Segurança

- ✅ CORS configurado para permitir requisições do domínio
- ✅ Validação de entrada (verifica se HTML foi fornecido)
- ✅ Tratamento de erros robusto

## 📊 Limitações

1. **Dados Estatísticos**: Apenas informações básicas são extraídas do HTML. Dados detalhados (H2H, forma, etc.) precisariam de scraping adicional.

2. **Formato do HTML**: A API espera HTML com scripts `application/ld+json` contendo dados estruturados Schema.org.

3. **Performance**: Processamento de HTML muito grande pode levar alguns segundos.

## 🛠️ Desenvolvimento Local

Para testar localmente:

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# A API estará disponível em:
# http://localhost:5173/api/matches
```

## 📝 Exemplo de Uso Programático

```typescript
import { updateMatchesFromHTML } from './services/matchesService';

const html = '<!DOCTYPE html>...'; // HTML da página
const result = await updateMatchesFromHTML(html);
console.log(`${result.count} jogos processados`);
```

## ✅ Checklist de Implementação

- [x] API serverless criada
- [x] Serviço frontend criado
- [x] Componente de UI criado
- [x] Integração com App.tsx
- [x] Persistência no localStorage
- [x] Tratamento de erros
- [x] Feedback visual para o usuário
- [x] CORS configurado
- [x] Documentação completa

---

**Pronto para usar! 🎉**

