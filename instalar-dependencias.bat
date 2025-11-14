@echo off
echo 🚀 Instalando dependencias do projeto...
echo.

npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Dependencias instaladas com sucesso!
    echo.
    echo Proximos passos:
    echo 1. Crie um arquivo .env.local com GEMINI_API_KEY
    echo 2. Execute: npm run dev
) else (
    echo.
    echo ❌ Erro ao instalar dependencias.
    pause
    exit /b 1
)

pause

