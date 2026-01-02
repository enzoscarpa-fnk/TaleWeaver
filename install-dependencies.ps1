# Script d'installation automatique des dépendances
# Usage: .\install-dependencies.ps1

Write-Host "🔧 Installation des dépendances pour TaleWeaver..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Node.js est installé
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js est installé : $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
}
catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez installer Node.js depuis : https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Choisissez la version LTS et assurez-vous de cocher 'Add to PATH' lors de l'installation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Souhaitez-vous ouvrir le site de téléchargement de Node.js ? (O/N)" -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq "O" -or $response -eq "o") {
        Start-Process "https://nodejs.org/"
    }
    
    Write-Host ""
    Write-Host "Après avoir installé Node.js, redémarrez votre terminal et relancez ce script." -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier si pnpm est installé
$pnpmInstalled = $false
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ pnpm est installé : version $pnpmVersion" -ForegroundColor Green
        $pnpmInstalled = $true
    }
}
catch {
    $pnpmInstalled = $false
}

if (-not $pnpmInstalled) {
    Write-Host "📦 Installation de pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de pnpm" -ForegroundColor Red
        Write-Host "Essayez d'exécuter manuellement : npm install -g pnpm" -ForegroundColor Yellow
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
    Write-Host "✅ pnpm installé avec succès" -ForegroundColor Green
}

# Installer les dépendances du projet
Write-Host ""
Write-Host "📦 Installation des dépendances du projet..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "✅ Toutes les dépendances ont été installées avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant lancer le projet avec :" -ForegroundColor Cyan
Write-Host "  .\start.ps1" -ForegroundColor White
Write-Host "  ou" -ForegroundColor Gray
Write-Host "  start.bat" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"


