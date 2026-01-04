# Script de lancement pour TaleWeaver
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Démarrage de TaleWeaver..." -ForegroundColor Cyan
Write-Host ""

try {
    # Vérifier si pnpm est installé
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "❌ pnpm n'est pas installé. Veuillez l'installer avec: npm install -g pnpm" -ForegroundColor Red
        Write-Host ""
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }

    # Vérifier si les dépendances sont installées
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
            Write-Host ""
            Read-Host "Appuyez sur Entrée pour quitter"
            exit 1
        }
    }

    # Générer le client Prisma
    Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Yellow
    Push-Location apps/backend
    try {
        pnpm prisma generate
        if ($LASTEXITCODE -ne 0) {
            throw "Erreur lors de la génération du client Prisma"
        }
    }
    finally {
        Pop-Location
    }

    # Vérifier si la base de données existe, sinon créer les migrations
    if (-not (Test-Path "apps/backend/prisma/dev.db")) {
        Write-Host "🗄️  Création de la base de données..." -ForegroundColor Yellow
        Push-Location apps/backend
        try {
            pnpm prisma migrate dev --name init
            if ($LASTEXITCODE -ne 0) {
                throw "Erreur lors de la création de la base de données"
            }
        }
        finally {
            Pop-Location
        }
    }

    # Lancer le projet
    Write-Host ""
    Write-Host "✨ Lancement du projet..." -ForegroundColor Green
    Write-Host "   Backend: http://localhost:3000" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter le projet" -ForegroundColor Yellow
    Write-Host ""

    pnpm start
}
catch {
    Write-Host ""
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

