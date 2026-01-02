# Guide d'installation pour TaleWeaver

## Prérequis

Pour installer les dépendances et lancer le projet, vous devez d'abord installer Node.js et pnpm.

### Étape 1 : Installer Node.js

1. Téléchargez Node.js depuis le site officiel : https://nodejs.org/
   - Choisissez la version LTS (Long Term Support)
   - Téléchargez le fichier d'installation pour Windows (.msi)

2. Exécutez l'installateur et suivez les instructions
   - ✅ Cochez l'option "Add to PATH" si elle est proposée
   - ✅ Acceptez les options par défaut

3. Redémarrez votre terminal/PowerShell après l'installation

4. Vérifiez l'installation :
   ```powershell
   node --version
   npm --version
   ```

### Étape 2 : Installer pnpm

Une fois Node.js installé, installez pnpm globalement :

```powershell
npm install -g pnpm
```

Vérifiez l'installation :
```powershell
pnpm --version
```

### Étape 3 : Installer les dépendances du projet

Une fois Node.js et pnpm installés, vous pouvez installer les dépendances :

```powershell
pnpm install
```

### Étape 4 : Lancer le projet

Utilisez le script de lancement :

```powershell
.\start.ps1
```

ou

```cmd
start.bat
```

## Alternative : Installation automatique

Si vous préférez, vous pouvez utiliser le script `install-dependencies.ps1` qui tentera d'installer automatiquement Node.js et pnpm (nécessite des droits administrateur).


