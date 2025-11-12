# 🔧 Troubleshooting - API de Atualização de Jogos

## ❌ Erro: "Nenhum jogo encontrado no HTML fornecido"

Se você está recebendo este erro, siga estes passos:

### 1. Verificar o HTML Copiado

O HTML deve conter scripts com `application/ld+json`. Verifique:

1. **Abra o arquivo HTML no Notepad ou editor de texto**
2. **Procure por:** `application/ld+json` ou `SportsEvent`
3. **Se encontrar:** O HTML está correto
4. **Se NÃO encontrar:** Você copiou o HTML errado

### 2. Como Copiar o HTML Corretamente

#### Opção A: Copiar HTML Completo da Página

1. Acesse a página "Academia Jogos Do Dia"
2. Pressione **F12** para abrir o DevTools
3. Vá na aba **Elements** (ou **Elementos**)
4. Clique com botão direito no elemento `<html>` (primeiro elemento)
5. Selecione **"Copy" > "Copy outerHTML"**
6. Cole no aplicativo

#### Opção B: Ver Código Fonte

1. Na página, clique com botão direito
2. Selecione **"Ver código-fonte da página"** ou **"View Page Source"**
3. Pressione **Ctrl+A** (selecionar tudo)
4. Pressione **Ctrl+C** (copiar)
5. Cole no aplicativo

### 3. Verificar o Conteúdo do HTML

O HTML deve conter algo como:

```html
<script type="application/ld+json" data-force="1" type=module>
{"@context":"https://schema.org/","@graph":[
  {"@type":"SportsEvent","sport":"Soccer",...}
]}
</script>
```

### 4. Testar com Arquivo de Exemplo

Se você tem o arquivo `Academia Jogos Do Dia.txt`:

1. No aplicativo, clique em **"Upload de Arquivo"**
2. Selecione o arquivo `Academia Jogos Do Dia.txt`
3. Deve funcionar!

### 5. Verificar Logs de Debug

A API agora retorna informações de debug quando não encontra jogos:

```json
{
  "error": "Nenhum jogo encontrado no HTML fornecido",
  "debug": {
    "htmlLength": 12345,
    "hasScript": true,
    "hasSportsEvent": true,
    "hasGraph": true,
    "sample": "..."
  }
}
```

**Interpretação:**
- `hasScript: false` → HTML não contém scripts JSON
- `hasSportsEvent: false` → HTML não contém dados de jogos
- `hasGraph: false` → HTML não contém estrutura @graph

### 6. Soluções Comuns

#### Problema: HTML muito pequeno
**Solução:** Certifique-se de copiar o HTML COMPLETO da página, não apenas uma parte.

#### Problema: HTML não contém JSON
**Solução:** Use a opção "Ver código-fonte" em vez de copiar do DevTools.

#### Problema: Erro 400 Bad Request
**Solução:** Verifique se está enviando `{ "html": "..." }` no body da requisição.

### 7. Teste Manual da API

Você pode testar a API diretamente:

```bash
curl -X POST https://seu-app.vercel.app/api/matches \
  -H "Content-Type: application/json" \
  -d '{"html":"<script type=\"application/ld+json\">{\"@context\":\"https://schema.org/\",\"@graph\":[{\"@type\":\"SportsEvent\",\"sport\":\"Soccer\",\"homeTeam\":{\"name\":\"Time A\"},\"awayTeam\":{\"name\":\"Time B\"}}]}</script>"}'
```

### 8. Se Ainda Não Funcionar

1. **Verifique os logs do Vercel:**
   - Vá em Deployments > Último deploy > Functions
   - Veja os logs da função `/api/matches`

2. **Verifique o tamanho do HTML:**
   - HTML muito grande pode causar timeout
   - Tente com um HTML menor primeiro

3. **Entre em contato:**
   - Envie o erro completo
   - Envie um trecho do HTML (primeiros 1000 caracteres)

---

## ✅ Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] HTML contém `application/ld+json`
- [ ] HTML contém `SportsEvent`
- [ ] HTML contém `@graph`
- [ ] HTML foi copiado completamente
- [ ] Tamanho do HTML é razoável (> 1000 caracteres)
- [ ] Testou com o arquivo de exemplo fornecido

---

**A API foi melhorada com 3 estratégias diferentes de extração. Se ainda não funcionar, o problema pode estar no formato do HTML fornecido.**

