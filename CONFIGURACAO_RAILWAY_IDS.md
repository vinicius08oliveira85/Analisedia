# 🔑 IDs do Projeto Railway

## 📋 IDs Identificados

Com base na URL fornecida, aqui estão os IDs do seu projeto:

### Project ID
```
3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7
```

### Environment ID
```
8263af34-6644-4a24-aeca-6aa66e93379b
```

## 🔍 Como Encontrar o Service ID

### Método 1: Pela URL do Serviço (Recomendado)

1. **Acesse o Railway Dashboard:**
   - https://railway.app/dashboard

2. **Clique no serviço desejado** (serviço principal Node.js)

3. **A URL do navegador mostrará:**
   ```
   https://railway.app/project/3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7/service/[SERVICE_ID]
   ```

4. **O SERVICE_ID é a parte após `/service/`**

### Método 2: Listar Todos os Serviços

1. Acesse: https://railway.app/project/3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7
2. Você verá todos os serviços do projeto
3. Clique em cada serviço para ver o Service ID na URL

## ⚙️ Configuração no GitHub Secrets

### Secrets Necessários

1. **RAILWAY_TOKEN** ✅ (já configurado)
   - Token de autenticação do Railway

2. **RAILWAY_PROJECT_ID** (opcional, mas recomendado)
   - Valor: `3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7`

3. **RAILWAY_SERVICE_ID** (necessário se houver múltiplos serviços)
   - Valor: [Copie da URL do serviço]

4. **RAILWAY_ENVIRONMENT_ID** (opcional)
   - Valor: `8263af34-6644-4a24-aeca-6aa66e93379b`

### Como Configurar

1. Acesse: https://github.com/vinicius08oliveira85/Analisedia/settings/secrets/actions
2. Para cada secret, clique em **"New repository secret"**
3. Configure:
   - **Name**: Nome do secret (ex: `RAILWAY_PROJECT_ID`)
   - **Secret**: Valor do ID
4. Clique em **"Add secret"**

## 📝 Checklist de Configuração

- [ ] `RAILWAY_TOKEN` - ✅ Já configurado
- [ ] `RAILWAY_PROJECT_ID` - `3e8b514d-d2d2-4e3a-a61b-e66bcd1a7ed7`
- [ ] `RAILWAY_SERVICE_ID` - [Obter da URL do serviço]
- [ ] `RAILWAY_ENVIRONMENT_ID` - `8263af34-6644-4a24-aeca-6aa66e93379b` (opcional)

## 🚀 Próximos Passos

1. Encontre o Service ID do serviço principal (Node.js)
2. Configure os secrets no GitHub
3. Faça um push para acionar o deploy

---

**Nota**: O Service ID é específico de cada serviço. Se você tiver múltiplos serviços (Node.js, FastAPI, etc.), cada um terá seu próprio Service ID.

