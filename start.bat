@echo off
REM Script de lancement pour TaleWeaver (Windows)
REM Usage: start.bat

echo 🚀 Démarrage de TaleWeaver...
echo.

REM Vérifier si pnpm est installé
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm n'est pas installé. Veuillez l'installer avec: npm install -g pnpm
    echo.
    pause
    exit /b 1
)

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    call pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        echo.
        pause
        exit /b 1
    )
)

REM Générer le client Prisma
echo 🔧 Génération du client Prisma...
cd apps\backend
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur: impossible d'accéder au dossier apps\backend
    echo.
    pause
    exit /b 1
)
call pnpm prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la génération du client Prisma
    cd ..\..
    echo.
    pause
    exit /b 1
)
cd ..\..

REM Vérifier si la base de données existe, sinon créer les migrations
if not exist "apps\backend\prisma\dev.db" (
    echo 🗄️  Création de la base de données...
    cd apps\backend
    call pnpm prisma migrate dev --name init
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de la création de la base de données
        cd ..\..
        echo.
        pause
        exit /b 1
    )
    cd ..\..
)

REM Lancer le projet
echo.
echo ✨ Lancement du projet...
echo    Backend: http://localhost:3000
echo    Frontend: http://localhost:5173
echo.
echo Appuyez sur Ctrl+C pour arrêter le projet
echo.

call pnpm start

REM Si on arrive ici, le script s'est terminé
echo.
echo Le projet s'est arrêté.
pause

