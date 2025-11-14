# Script para instalar dependências do projeto Analisedia
Write-Host "🚀 Instalando dependências do projeto..." -ForegroundColor Green
Write-Host ""

# Verifica se npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não encontrado. Por favor, instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ npm encontrado: $(npm --version)" -ForegroundColor Green
Write-Host ""

# Instala as dependências
Write-Host "📦 Executando npm install..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Crie um arquivo .env.local com GEMINI_API_KEY" -ForegroundColor White
    Write-Host "2. Execute: npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao instalar dependências. Verifique os logs acima." -ForegroundColor Red
    exit 1
}

