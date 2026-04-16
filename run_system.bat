@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   ⚡ ROBO MT5 FOREX v2 - COMANDO CENTRAL ⚡
echo ============================================================
echo.

:: 1. Subindo infraestrutura Docker
echo [1/3] Iniciando Banco de Dados e Dashboard (Docker)...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao iniciar containers. Certifique-se que o Docker está rodando.
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Containers rodando em segundo plano.
echo.

:: 2. Gerenciando dependencias Python
echo [2/3] Verificando ambiente e dependencias...
if exist venv\Scripts\activate (
    echo [INFO] Ativando ambiente virtual...
    call venv\Scripts\activate
) else (
    echo [AVISO] Ambiente 'venv' nao encontrado. Usando Python global.
)

echo [INFO] Atualizando requirements.txt...
python -m pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %ERRORLEVEL%
)
echo [OK] Dependencias prontas.
echo.

:: 3. Iniciando API
echo [3/3] Iniciando Backend API (Controle)...
echo [INFO] Acesse o dashboard em http://localhost:3000
echo [INFO] Pressione CTRL+C para encerrar.
echo.

python src/api/main.py

pause
