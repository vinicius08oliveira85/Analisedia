# 🚀 API de Atualização de Jogos do Dia

Sistema completo para atualizar os jogos do dia no aplicativo Futibou Analytics através de uma API serverless no Vercel integrada ao Supabase.

## 📋 Como Funciona

1. **API Serverless** (`/api/matches.ts`): Processa o HTML (manual ou automático) e normaliza os jogos
2. **Supabase** (`daily_matches`): Persiste os jogos processados
3. **Serviços Frontend** (`/services/matchesService.ts`): Comunicam com a API
4. **Componente de Atualização** (`/components/UpdateMatches.tsx`): Interface para sincronização automática, upload ou colagem de HTML

## 🔧 Estrutura

```
api/
  └── matches.ts          # API serverless (Vercel)
services/
  └── matchesService.ts  # Serviço para chamar a API
components/
  └── UpdateMatches.tsx  # Componente de UI
```

- Banco de dados: tabela `daily_matches` no Supabase (configurável via `SUPABASE_MATCHES_TABLE`)

## 📝 Como Usar

### Opção 0: Atualização Automática

1. Configure as variáveis `DAILY_MATCHES_SOURCE_URL` e credenciais do Supabase
2. No aplicativo, clique em **"Atualização Automática"** para que a API busque e processe os jogos do dia
3. Alternativamente, agende um cron job no Vercel para fazer `POST /api/matches` diariamente

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

Processa o HTML e persiste os jogos no Supabase. Caso nenhum HTML seja informado, a função busca automaticamente o conteúdo configurado pela variável de ambiente `DAILY_MATCHES_SOURCE_URL`.

**Request:**
```json
{
  "html": "<!DOCTYPE html>...",          // opcional se for usar o fetch automático
  "sourceUrl": "https://...",            // opcional, sobrescreve a URL padrão
  "refresh": true                        // opcional, indica atualização forçada para fins de log
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
      "teamA": { "name": "Atlético-MG", "logo": "https://..." },
      "teamB": { "name": "Fortaleza", "logo": "https://..." },
      "matchInfo": {
        "date": "12 novembro 2025",
        "time": "20:30",
        "competition": "Brasileirão Série A"
      }
    }
  ],
  "matchDay": "2025-11-12",
  "source": "https://www.academiadasapostasbrasil.com/",
  "syncedAt": "2025-11-12T15:02:11.000Z",
  "message": "3 jogos processados com sucesso"
}
```

### GET `/api/matches`

Retorna os jogos persistidos no Supabase. Por padrão traz o dia atual (`?date=YYYY-MM-DD` para filtrar outra data).

```http
GET /api/matches?date=2025-11-12
```

**Resposta:**
```json
{
  "success": true,
  "count": 3,
  "matches": [ /* mesmo formato acima */ ],
  "matchDay": "2025-11-12",
  "lastUpdated": "2025-11-12T15:02:11.000Z",
  "source": "https://www.academiadasapostasbrasil.com/",
  "message": "3 jogos encontrados para 2025-11-12"
}
```

## 💾 Armazenamento

- **Primário:** Tabela `daily_matches` no Supabase (JSON dos jogos, data da partida, horário e metadados).
- **Cache opcional:** `localStorage` do navegador (chave `updatedMatches`) para funcionamento offline e carregamento rápido.

## 🚀 Deploy no Vercel

A API está configurada para funcionar automaticamente no Vercel:

1. ✅ Arquivo em `api/matches.ts` será deployado como serverless function
2. ✅ Rota `/api/matches` estará disponível automaticamente
3. ✅ CORS configurado para permitir requisições do frontend
4. ✅ Integração com Supabase via variáveis de ambiente

## 🔒 Segurança

- ✅ CORS configurado para permitir requisições do frontend
- ✅ Validação de entrada (verifica se HTML foi fornecido ou se a fonte automática está disponível)
- ✅ Tratamento de erros robusto
- ✅ Recomenda-se usar `SUPABASE_SERVICE_ROLE_KEY` apenas no backend (funções serverless)

## ⚙️ Configuração Necessária

Defina as seguintes variáveis de ambiente no projeto (locais e Vercel):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_ANON_KEY` para acessos restritos)
- `SUPABASE_MATCHES_TABLE` (opcional, padrão `daily_matches`)
- `DAILY_MATCHES_SOURCE_URL` (URL oficial dos jogos do dia a ser baixada automaticamente)

### Estrutura sugerida da tabela `daily_matches`

```sql
create table if not exists public.daily_matches (
  match_id text primary key,
  match_day date,
  kickoff timestamptz,
  data jsonb not null,
  source_url text,
  updated_at timestamptz default timezone('utc', now())
);
```

> Ajuste os índices/conflitos conforme sua estratégia. A aplicação utiliza `match_id` como chave para `upsert`.

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
import { refreshMatchesAutomatically } from './services/matchesService';

const result = await refreshMatchesAutomatically();
console.log(`${result.count} jogos processados a partir da fonte ${result.source}`);
```

## ✅ Checklist de Implementação

- [x] API serverless criada
- [x] Integração com Supabase para persistência diária
- [x] Serviço frontend criado
- [x] Componente de UI criado com atualização automática/manual
- [x] Integração com App.tsx
- [x] Cache local opcional no `localStorage`
- [x] Tratamento de erros
- [x] Feedback visual para o usuário
- [x] CORS configurado
- [x] Documentação completa

---

**Pronto para usar! 🎉**

