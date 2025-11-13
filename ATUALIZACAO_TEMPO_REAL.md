# 🔴 Sistema de Atualização em Tempo Real

Sistema completo para acompanhar jogos ao vivo e odds em tempo real no aplicativo Futibou Analytics.

## 📋 Funcionalidades

### ✅ Status ao Vivo
- **Indicador visual** de jogos ao vivo com animação pulsante
- **Placar atualizado** em tempo real
- **Minuto do jogo** exibido quando disponível
- **Status do jogo**: Agendado, Ao Vivo, Intervalo, Finalizado

### ✅ Odds (Cotações)
- **Odds de resultado**: Casa, Empate, Visitante
- **Odds de gols**: Over 1.5, Under 1.5, Over 2.5, Under 2.5
- **Atualização automática** quando disponível no HTML

### ✅ Atualização Automática
- **Polling automático** a cada 30 segundos para jogos ao vivo
- **Controle manual** para iniciar/pausar atualizações
- **Indicador visual** do status de atualização

## 🚀 Como Usar

### 1. Atualizar Status ao Vivo e Odds Manualmente

#### Opção A: Atualizar na Página de Detalhes do Jogo

1. Acesse a página de detalhes de um jogo
2. Role até a seção **"Atualizar Status ao Vivo e Odds"**
3. Acesse a página do jogo no site original
4. Pressione `Ctrl+A` para selecionar tudo
5. Pressione `Ctrl+C` para copiar
6. Clique em **"Colar HTML da Página do Jogo"**
7. O status e odds serão atualizados automaticamente

#### Opção B: Atualizar na Lista de Jogos

1. Na página principal, cole o HTML da página "Academia Jogos Do Dia"
2. O sistema tentará extrair automaticamente:
   - Status ao vivo (se o jogo estiver em andamento)
   - Odds (se disponíveis no HTML)

### 2. Atualização Automática (Polling)

1. Quando houver jogos ao vivo, aparecerá um controle na parte superior
2. O sistema iniciará automaticamente a atualização a cada 30 segundos
3. Você pode **pausar** ou **retomar** a atualização manualmente
4. O indicador mostra quantos jogos estão ao vivo

## 📁 Estrutura de Arquivos

```
api/
  └── live-status.ts          # API para processar status ao vivo e odds
services/
  └── liveStatusService.ts    # Serviço para atualizar status e odds
components/
  ├── LiveStatusBadge.tsx     # Componente para exibir status e odds
  ├── UpdateLiveStatus.tsx    # Componente para atualização manual
  └── LiveStatusControl.tsx   # Controle de polling automático
hooks/
  └── useLiveStatusPolling.ts # Hook React para polling automático
types.ts                       # Tipos TypeScript atualizados
```

## 🔧 APIs Disponíveis

### POST `/api/live-status`

Atualiza status ao vivo e odds de um jogo específico.

**Request:**
```json
{
  "html": "<!DOCTYPE html>...",
  "matchId": "flamengo-palmeiras"
}
```

**Response:**
```json
{
  "success": true,
  "matchId": "flamengo-palmeiras",
  "liveStatus": {
    "isLive": true,
    "status": "live",
    "minute": 45,
    "homeScore": 2,
    "awayScore": 1,
    "lastUpdated": "2024-01-15T20:30:00.000Z"
  },
  "odds": {
    "homeWin": 2.10,
    "draw": 3.20,
    "awayWin": 3.50,
    "over1_5": 1.45,
    "under1_5": 2.80,
    "lastUpdated": "2024-01-15T20:30:00.000Z"
  },
  "message": "Status e odds atualizados com sucesso"
}
```

## 🎨 Componentes Visuais

### LiveStatusBadge
Exibe o status ao vivo e odds de forma compacta:
- 🔴 Indicador "AO VIVO" com animação
- ⏱️ Minuto do jogo
- 📊 Odds coloridas por tipo
- 🏆 Placar atual

### UpdateLiveStatus
Componente para atualização manual:
- Botão para colar HTML
- Feedback visual de sucesso/erro
- Instruções claras

### LiveStatusControl
Controle de polling automático:
- Indicador de status (ativo/pausado)
- Contador de jogos ao vivo
- Botões para iniciar/pausar

## 📊 Tipos de Dados

### LiveMatchStatus
```typescript
{
  isLive: boolean;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  homeScoreHT?: number;
  awayScoreHT?: number;
  lastUpdated?: string;
}
```

### MatchOdds
```typescript
{
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  over1_5?: number;
  under1_5?: number;
  over2_5?: number;
  under2_5?: number;
  lastUpdated?: string;
}
```

## 🔍 Como Funciona o Scraping

### Status ao Vivo
O sistema procura por:
- Palavras-chave: "ao vivo", "live", "em andamento"
- Padrões de minuto: "45 min", "45'"
- Status: "intervalo", "finalizado"
- Placar: "2-1", "2:1"

### Odds
O sistema procura por:
- Números entre 1.0 e 10.0 próximos ao evento
- Tabelas com classes relacionadas a "odds"
- Padrões de texto: "casa: 2.10", "over 1.5: 1.45"

## ⚙️ Configuração

### Intervalo de Polling
Por padrão, o polling ocorre a cada **30 segundos**. Você pode alterar isso no `App.tsx`:

```typescript
const { isPolling, startPolling, stopPolling } = useLiveStatusPolling(
  matches,
  handleMatchesUpdated,
  {
    intervalMs: 30000, // Altere aqui (em milissegundos)
    enabled: liveMatches.length > 0
  }
);
```

## 🐛 Troubleshooting

### Status não está sendo atualizado
1. Verifique se o HTML contém informações de status ao vivo
2. Certifique-se de copiar o HTML completo da página do jogo
3. Verifique o console do navegador para erros

### Odds não aparecem
1. O HTML pode não conter odds
2. Tente acessar a página específica do jogo no site original
3. Alguns sites podem não exibir odds publicamente

### Polling não funciona
1. Verifique se há jogos marcados como "ao vivo"
2. O polling só inicia automaticamente se houver jogos ao vivo
3. Use o controle manual para iniciar/pausar

## 📝 Notas Importantes

- ⚠️ O scraping depende da estrutura do HTML do site
- ⚠️ Odds podem não estar disponíveis em todos os sites
- ⚠️ O polling automático consome recursos, use com moderação
- ✅ Os dados são salvos no localStorage automaticamente
- ✅ Status e odds são preservados ao atualizar a página

## 🎯 Próximos Passos

Possíveis melhorias futuras:
- [ ] Integração com WebSockets para atualização em tempo real
- [ ] Notificações push quando houver gols
- [ ] Histórico de mudanças de odds
- [ ] Gráficos de evolução de odds
- [ ] Integração com Supabase para persistência

