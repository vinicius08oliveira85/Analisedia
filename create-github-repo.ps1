# Script para criar repositório no GitHub
# Uso: .\create-github-repo.ps1 -Token "seu_token_github" -RepoName "Analisedia"

param(
    [Parameter(Mandatory=$false)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "Analisedia",
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Aplicativo de análise de partidas e probabilidade de over 1.5 gols",
    
    [Parameter(Mandatory=$false)]
    [switch]$Private = $false
)

# Verificar se o token foi fornecido
if (-not $Token) {
    Write-Host "❌ Token do GitHub não fornecido!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para criar o repositório via API, você precisa:" -ForegroundColor Yellow
    Write-Host "1. Criar um Personal Access Token no GitHub:" -ForegroundColor Yellow
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "2. Dar permissão 'repo' ao token" -ForegroundColor Yellow
    Write-Host "3. Executar: .\create-github-repo.ps1 -Token 'seu_token'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OU criar manualmente no GitHub e depois executar:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/SEU_USUARIO/$RepoName.git" -ForegroundColor Cyan
    Write-Host "  git branch -M main" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
    exit 1
}

# Tentar obter o nome de usuário do GitHub
try {
    $headers = @{
        "Authorization" = "token $Token"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $userResponse = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
    $username = $userResponse.login
    
    Write-Host "✅ Autenticado como: $username" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao autenticar: $_" -ForegroundColor Red
    exit 1
}

# Criar o repositório
try {
    $body = @{
        name = $RepoName
        description = $Description
        private = $Private
        auto_init = $false
    } | ConvertTo-Json
    
    Write-Host "📦 Criando repositório '$RepoName'..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ Repositório criado com sucesso!" -ForegroundColor Green
    Write-Host "   URL: $($response.html_url)" -ForegroundColor Cyan
    
    # Adicionar remote e fazer push
    Write-Host ""
    Write-Host "🔗 Configurando remote e fazendo push..." -ForegroundColor Yellow
    
    # Verificar se já existe um remote origin
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "⚠️  Remote 'origin' já existe. Removendo..." -ForegroundColor Yellow
        git remote remove origin
    }
    
    git remote add origin $response.clone_url
    git branch -M main
    git push -u origin main
    
    Write-Host ""
    Write-Host "✅ Repositório criado e código enviado com sucesso!" -ForegroundColor Green
    Write-Host "   Acesse: $($response.html_url)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro ao criar repositório: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 422) {
        Write-Host "   O repositório pode já existir. Verifique em: https://github.com/$username/$RepoName" -ForegroundColor Yellow
    }
    exit 1
}

