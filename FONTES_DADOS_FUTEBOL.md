# 🌐 Fontes de Dados de Futebol - Sites e APIs Públicas

## 📊 APIs Públicas Gratuitas

### 1. **API Futebol BR** ⭐⭐⭐ (Melhor para Brasil!)
- **URL**: https://sportsbrapi.com/ ou https://www.api-futebol.com.br/
- **Tipo**: API REST gratuita
- **Limite**: Não especificado (parece ser generoso)
- **Dados**: Jogos do dia, resultados ao vivo, agenda, escalações, estatísticas
- **Cobertura**: Futebol brasileiro completo (Brasileirão, Copa do Brasil, estaduais)
- **Formato**: JSON
- **Autenticação**: Possivelmente token (verificar documentação)
- **Vantagem**: Específica para futebol brasileiro!
- **Documentação**: Verificar no site

### 2. **Football-Data.org** ⭐⭐ (Recomendado para Ligas Europeias)
- **URL**: https://www.football-data.org/
- **Tipo**: API REST gratuita
- **Limite**: 10 requisições/minuto (plano gratuito)
- **Dados**: Jogos, resultados, tabelas, estatísticas
- **Cobertura**: Ligas europeias principais, algumas ligas brasileiras
- **Formato**: JSON
- **Autenticação**: Token gratuito (registro necessário)
- **Documentação**: https://www.football-data.org/documentation/quickstart

**Exemplo de uso:**
```javascript
// Obter jogos de hoje
fetch('https://api.football-data.org/v4/matches?dateFrom=2024-01-01&dateTo=2024-01-01', {
  headers: {
    'X-Auth-Token': 'SEU_TOKEN_AQUI'
  }
})
```

### 3. **API-Football (RapidAPI)**
- **URL**: https://rapidapi.com/api-sports/api/api-football
- **Tipo**: API via RapidAPI
- **Limite**: 100 requisições/dia (plano gratuito)
- **Dados**: Jogos, resultados, estatísticas, odds, previsões
- **Cobertura**: Mundial (inclui Brasil)
- **Formato**: JSON
- **Autenticação**: Chave da RapidAPI (gratuita)
- **Documentação**: https://www.api-football.com/documentation-v3

### 4. **OpenLigaDB** (Ligas Alemãs)
- **URL**: https://www.openligadb.de/
- **Tipo**: API REST gratuita
- **Limite**: Sem limite conhecido
- **Dados**: Jogos, resultados, tabelas
- **Cobertura**: Principalmente ligas alemãs (Bundesliga)
- **Formato**: JSON/XML
- **Autenticação**: Não necessária
- **Documentação**: https://www.openligadb.de/api

### 5. **Soccerway (Scraping)**
- **URL**: https://www.soccerway.com/
- **Tipo**: Site (requer scraping)
- **Dados**: Jogos, resultados, estatísticas, tabelas
- **Cobertura**: Mundial
- **Formato**: HTML (requer parsing)
- **Vantagem**: Dados muito completos
- **Desvantagem**: Requer scraping (pode ser bloqueado)

---

## 🌍 Sites com Dados Estruturados

### 1. **Academia das Apostas Brasil** (Já em uso)
- **URL**: https://www.academiadasapostasbrasil.com/
- **Dados**: Jogos, estatísticas, odds, análises
- **Formato**: HTML com JSON-LD (Schema.org)
- **Status**: ✅ Já implementado no sistema
- **Nota**: Pode bloquear scraping automático (403)

### 2. **SokkerPro** (Já em uso)
- **URL**: https://sokkerpro.com/
- **Dados**: Jogos, estatísticas, análises
- **Formato**: SPA (requer HTML renderizado)
- **Status**: ✅ Já implementado no sistema
- **Nota**: Requer copiar HTML renderizado manualmente

### 3. **GolMétrica**
- **URL**: https://golmetrica.com/
- **Dados**: Agenda diária, estatísticas, palpites
- **Formato**: HTML
- **Vantagem**: Foco em futebol brasileiro
- **Desvantagem**: Requer scraping

### 4. **Scores24.live**
- **URL**: https://scores24.live/pt
- **Dados**: Resultados ao vivo, estatísticas
- **Formato**: HTML
- **Cobertura**: 22 esportes, incluindo futebol
- **Vantagem**: Dados em tempo real

### 5. **Zerozero.pt**
- **URL**: https://www.zerozero.pt/
- **Dados**: Resultados, tabelas, estatísticas
- **Formato**: HTML
- **Cobertura**: Principalmente ligas europeias e portuguesas
- **Vantagem**: Dados históricos completos

---

## 📡 Feeds RSS/XML

### 1. **RSS Feeds de Notícias Esportivas**
- **Globo Esporte RSS**: https://globoesporte.globo.com/rss/futebol/
- **ESPN Brasil RSS**: https://www.espn.com.br/rss.xml
- **Limitação**: Apenas notícias, não dados estruturados de jogos

---

## 🔧 Recomendações para Implementação

### Opção 1: Integrar Football-Data.org API ⭐
**Vantagens:**
- ✅ API oficial e estável
- ✅ Dados estruturados (JSON)
- ✅ Sem necessidade de scraping
- ✅ Documentação completa
- ✅ Plano gratuito disponível

**Desvantagens:**
- ❌ Limite de 10 req/min
- ❌ Cobertura limitada de ligas brasileiras
- ❌ Requer registro e token

**Implementação:**
```typescript
// Criar novo endpoint: api/football-data.ts
// Buscar jogos do dia via API
// Converter formato para MatchDetails
```

### Opção 2: Integrar API-Football (RapidAPI) ⭐
**Vantagens:**
- ✅ Cobertura mundial completa
- ✅ Dados muito completos (odds, estatísticas)
- ✅ 100 req/dia no plano gratuito
- ✅ Inclui ligas brasileiras

**Desvantagens:**
- ❌ Requer conta RapidAPI
- ❌ Limite diário (100 req)
- ❌ Pode precisar de plano pago para uso intensivo

### Opção 3: Melhorar Scraping Atual
**Vantagens:**
- ✅ Já implementado
- ✅ Sem limites de API
- ✅ Dados completos

**Desvantagens:**
- ❌ Pode ser bloqueado (403)
- ❌ Requer manutenção constante
- ❌ Depende da estrutura HTML do site

---

## 🎯 Sugestão de Implementação

### Fase 1: Adicionar API Futebol BR ⭐ (Prioridade!)
**Por quê?**
- ✅ Específica para futebol brasileiro
- ✅ Dados completos (jogos, escalações, estatísticas)
- ✅ Parece ser gratuita
- ✅ Cobertura completa do Brasil

**Implementação:**
1. Verificar documentação da API
2. Criar endpoint `/api/api-futebol-br.ts`
3. Buscar jogos do dia
4. Converter para formato `MatchDetails`
5. Usar como fonte primária para futebol brasileiro

### Fase 2: Adicionar Football-Data.org (Ligas Europeias)
1. Criar endpoint `/api/football-data`
2. Buscar jogos do dia
3. Converter para formato `MatchDetails`
4. Usar como fallback quando scraping falhar

### Fase 3: Adicionar API-Football (Opcional)
1. Criar endpoint `/api/api-football`
2. Usar para ligas não cobertas pelo Football-Data
3. Priorizar para dados de odds e estatísticas avançadas

### Fase 4: Sistema Híbrido
1. Tentar Football-Data primeiro (mais rápido)
2. Se não encontrar, tentar scraping
3. Se scraping falhar, tentar API-Football
4. Dar opção manual (colar HTML) como último recurso

---

## 📝 Exemplo de Código (Football-Data.org)

```typescript
// api/football-data.ts
export async function getMatchesFromFootballData(date: string) {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  
  const response = await fetch(
    `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`,
    {
      headers: {
        'X-Auth-Token': token || ''
      }
    }
  );
  
  const data = await response.json();
  return data.matches;
}
```

---

## 🔑 Como Obter Tokens/Chaves

### Football-Data.org:
1. Acesse: https://www.football-data.org/
2. Clique em "Sign Up" (gratuito)
3. Confirme email
4. Acesse "API" no menu
5. Copie seu token

### API-Football (RapidAPI):
1. Acesse: https://rapidapi.com/api-sports/api/api-football
2. Clique em "Subscribe to Test"
3. Crie conta gratuita
4. Copie sua chave X-RapidAPI-Key

---

## ⚠️ Considerações Legais

- ✅ APIs públicas: Uso permitido conforme termos de serviço
- ⚠️ Scraping: Verificar termos de uso de cada site
- ⚠️ Rate Limits: Respeitar limites das APIs
- ⚠️ Dados Comerciais: Alguns dados podem ter restrições

---

## 📊 Comparação Rápida

| Fonte | Tipo | Limite | Cobertura BR | Facilidade | Custo |
|-------|------|--------|--------------|------------|-------|
| Football-Data.org | API | 10/min | Limitada | ⭐⭐⭐⭐⭐ | Grátis |
| API-Football | API | 100/dia | Completa | ⭐⭐⭐⭐ | Grátis |
| Academia Apostas | Scraping | Ilimitado | Completa | ⭐⭐⭐ | Grátis |
| SokkerPro | Scraping | Ilimitado | Completa | ⭐⭐ | Grátis |

---

**Recomendação Final**: 
1. **Primeiro**: Implementar **API Futebol BR** (melhor para futebol brasileiro) ⭐
2. **Segundo**: Adicionar **Football-Data.org** para ligas europeias
3. **Terceiro**: Manter scraping como fallback quando APIs não tiverem dados

---

## 🔗 Links Úteis

- **API Futebol BR**: https://sportsbrapi.com/ ou https://www.api-futebol.com.br/
- **Football-Data.org**: https://www.football-data.org/
- **API-Football (RapidAPI)**: https://rapidapi.com/api-sports/api/api-football
- **OpenLigaDB**: https://www.openligadb.de/

---

## 📝 Próximos Passos

1. ✅ Verificar documentação da API Futebol BR
2. ✅ Obter token/chave de acesso (se necessário)
3. ✅ Implementar endpoint `/api/api-futebol-br.ts`
4. ✅ Testar com jogos do dia
5. ✅ Integrar no componente `UpdateMatches.tsx`
6. ✅ Adicionar botão "Buscar da API Futebol BR" 🚀

