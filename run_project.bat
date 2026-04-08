@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe"
set "PHP_PATH=C:\xampp\php\php.exe"
set "DB_NAME=gestion_formateurs"
set "DB_USER=root"
set "DB_PASSWORD="
set "SQL_FILE=%ROOT_DIR%database\final_database.sql"
set "FRONTEND_PATH=%ROOT_DIR%frontend"
set "BACKEND_PATH=%ROOT_DIR%backend"
set "BACKEND_ENV=%BACKEND_PATH%\.env"
set "FRONTEND_ENV=%FRONTEND_PATH%\.env.local"
set "PHP_PORT=8000"
set "FRONTEND_PORT=5173"

echo ==========================================
echo Gestion des horaires des formateurs
echo ==========================================
echo.

if not exist "%MYSQL_PATH%" (
    echo [ERROR] MySQL introuvable : %MYSQL_PATH%
    echo Verifie que XAMPP est installe dans C:\xampp
    pause
    exit /b 1
)

if not exist "%PHP_PATH%" (
    echo [ERROR] PHP introuvable : %PHP_PATH%
    echo Verifie que XAMPP est installe dans C:\xampp
    pause
    exit /b 1
)

if not exist "%SQL_FILE%" (
    echo [ERROR] Fichier SQL introuvable : %SQL_FILE%
    pause
    exit /b 1
)

echo [1/5] Importing database...
"%MYSQL_PATH%" -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo [ERROR] Impossible de creer la base de donnees %DB_NAME%.
    echo Assure-toi que MySQL est demarre dans XAMPP.
    pause
    exit /b 1
)

"%MYSQL_PATH%" -u %DB_USER% %DB_NAME% < "%SQL_FILE%"
if errorlevel 1 (
    echo [ERROR] Echec lors de l import de la base de donnees.
    pause
    exit /b 1
)
echo Database ready.
echo.

echo [2/5] Preparing backend environment...
(
    echo DB_HOST=127.0.0.1
    echo DB_PORT=3306
    echo DB_NAME=%DB_NAME%
    echo DB_USER=%DB_USER%
    echo DB_PASSWORD=%DB_PASSWORD%
    echo APP_FRONTEND_URL=http://127.0.0.1:%FRONTEND_PORT%
    echo APP_DEBUG=true
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USERNAME=
    echo SMTP_PASSWORD=
    echo SMTP_FROM_EMAIL=
    echo SMTP_FROM_NAME=Gestion des horaires
) > "%BACKEND_ENV%"

pushd "%BACKEND_PATH%"
where composer >nul 2>nul
if not errorlevel 1 (
    echo Installing PHP dependencies...
    call composer install
    if errorlevel 1 (
        echo [WARN] composer install failed. The app can still start, but reports/mail may fail.
    )
) else (
    echo Composer not found, skipping PHP dependencies installation.
)
popd
echo Backend environment ready.
echo.

echo [3/5] Preparing front-end environment...
(
    echo VITE_API_BASE=/api
    echo VITE_API_PROXY_TARGET=http://127.0.0.1:%PHP_PORT%
    echo VITE_PREVIEW_PORT=4173
) > "%FRONTEND_ENV%"
echo Front-end environment ready.
echo.

echo [4/5] Installing front-end dependencies...
pushd "%FRONTEND_PATH%"
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    popd
    pause
    exit /b 1
)
popd
echo Front-end dependencies ready.
echo.

echo [5/5] Starting servers...
start "Backend PHP" /D "%BACKEND_PATH%" cmd /k ""%PHP_PATH%" -S 127.0.0.1:%PHP_PORT% router.php"
start "Frontend Vite" /D "%FRONTEND_PATH%" cmd /k "npm run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"

timeout /t 4 >nul
start "" "http://127.0.0.1:%FRONTEND_PORT%"

echo.
echo Front-end: http://127.0.0.1:%FRONTEND_PORT%
echo Back-end : http://127.0.0.1:%PHP_PORT%
echo.
echo Two windows were opened for the servers. Keep them open while using the app.
pause
