# 🚀 API de Atualização de Jogos do Dia

Sistema completo para atualizar os jogos do dia no aplicativo Futibou Analytics através de uma API serverless no Vercel.

## 📋 Como Funciona

1. **API Serverless** (`/api/matches.ts`): Processa HTML, converte em `MatchDetails` e persiste no Supabase.
2. **API de Automação** (`/api/update-daily-matches.ts`): Faz o scraping automático diário e dispara a atualização.
3. **Serviço Frontend** (`/services/matchesService.ts`): Busca os jogos diretamente do endpoint.
4. **Componentes de UI** (`/components/UpdateMatches.tsx`): Interface para upload/colar HTML manualmente quando necessário.

## 🔧 Estrutura

```
api/
  ├── matches.ts              # API serverless (processamento manual)
  └── update-daily-matches.ts # API serverless (atualização automática)
lib/
  ├── matchParser.ts          # Funções de parsing de HTML
  ├── matchStorage.ts         # Persistência em Supabase
  └── supabase.ts             # Cliente Supabase reutilizável
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

### `POST /api/matches`

Processa HTML bruto copiado manualmente e grava os resultados.

**Body**
```json
{
  "html": "<!DOCTYPE html>...",
  "sourceUrl": "https://opcionalmentedefinido.com/jogos"
}
```

- `html` (obrigatório): conteúdo completo da página.
- `sourceUrl` (opcional): URL de referência salvo junto com o jogo.

**Resposta**
```json
{
  "success": true,
  "count": 3,
  "persisted": 3,
  "matches": [...],
  "supabase": { "enabled": true },
  "message": "3 jogos processados com sucesso"
}
```

### `GET /api/matches?date=2025-11-12`

Retorna os jogos armazenados para a data informada (padrão: hoje no fuso `America/Sao_Paulo`).

- `date` (opcional): formato `YYYY-MM-DD`.

**Resposta**
```json
{
  "success": true,
  "date": "2025-11-12",
  "count": 6,
  "matches": [...]
}
```

### `POST /api/update-daily-matches`

Endpoint pensado para rodar via Cron (Vercel Scheduler) e atualizar os jogos automaticamente.

**Body opcional**
```json
{
  "date": "2025-11-12",
  "sourceUrl": "https://override-da-fonte.com",
  "token": "segredo-opcional",
  "html": "<html>... apenas para depuração manual</html>"
}
```

- `date`: substitui a data padrão.
- `sourceUrl`: URL fixa para bypassar o template global.
- `token`: precisa coincidir com `MATCHES_CRON_SECRET` (ou `CRON_SECRET`) se configurado.
- `html`: se enviado, pula o download remoto (útil para testes).

> Também é possível chamar via `GET /api/update-daily-matches?date=YYYY-MM-DD&token=...`.

**Resposta**
```json
{
  "success": true,
  "date": "2025-11-12",
  "sourceUrl": "https://www.academiadasapostasbrasil.com/stats/matches/2025-11-12",
  "count": 6,
  "persisted": 6,
  "matches": [...]
}
```

## 💾 Armazenamento no Supabase

Crie uma tabela `daily_matches` (nome configurável via `SUPABASE_MATCHES_TABLE`) com chave primária composta:

```sql
create table if not exists daily_matches (
  match_id text not null,
  match_date date not null,
  event_start timestamptz,
  payload jsonb not null,
  raw_event jsonb,
  source_url text,
  updated_at timestamptz default timezone('utc', now()),
  primary key (match_id, match_date)
);
```

- `payload` guarda o objeto `MatchDetails`.
- `raw_event` mantém o JSON original `SportsEvent` para auditoria.
- `match_date` é calculado respetando o fuso definido.

### Índice recomendado

```sql
create index if not exists idx_daily_matches_date
  on daily_matches (match_date desc, event_start asc);
```

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave Service Role (armazenar com proteção em produção) |
| `SUPABASE_MATCHES_TABLE` | ❌ | Nome da tabela (`daily_matches` por padrão) |
| `MATCHES_TIMEZONE` | ❌ | Fuso horário para agrupar jogos (default `America/Sao_Paulo`) |
| `MATCHES_SOURCE_URL_TEMPLATE` | ❌ | Template da URL de scraping (`%DATE%` será substituído) |
| `MATCHES_CRON_SECRET` / `CRON_SECRET` | ❌ | Token para proteger o endpoint automático |
| `MATCHES_FETCH_USER_AGENT` | ❌ | User Agent customizado para o scraping |

Configure-as tanto no desenvolvimento (ex.: `.env.local`) quanto no Vercel.

## ⏰ Automação com Vercel Cron

1. Crie um job no [Vercel Scheduler](https://vercel.com/docs/cron-jobs) chamando `POST https://seuapp.vercel.app/api/update-daily-matches`.
2. Defina um header `Authorization: Bearer <MATCHES_CRON_SECRET>` se estiver usando segredo.
3. Cron recomendado: `0 9 * * *` (09h BRT → 12h UTC) para garantir os jogos do dia.

## 🔒 Segurança

- Endpoint automático protegido opcionalmente por token (`MATCHES_CRON_SECRET`).
- Persistência server-side via Supabase Service Role (nunca expor no frontend).
- Logs e erros tratados para fácil debugging.

## 🚀 Deploy no Vercel

A API está configurada para funcionar automaticamente no Vercel:

1. ✅ Funções em `api/*.ts` são publicadas automaticamente.
2. ✅ Rota `/api/update-daily-matches` pode ser chamada pelo Scheduler.
3. ✅ CORS liberado para o frontend consumir os dados com segurança.

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

# Endpoints disponíveis:
# http://localhost:5173/api/matches
# http://localhost:5173/api/update-daily-matches
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
- [x] Automação diária com endpoint dedicado
- [x] Serviço frontend criado
- [x] Componente de UI criado
- [x] Integração com App.tsx
- [x] Persistência no Supabase
- [x] Tratamento de erros
- [x] Feedback visual para o usuário
- [x] CORS configurado
- [x] Documentação completa

---

**Pronto para usar! 🎉**

