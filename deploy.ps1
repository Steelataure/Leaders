# ==============================================================================
# Script de Déploiement Automatique pour le projet 'Leaders' (Windows PowerShell)
# Auteur: Expert DevOps Railway & Docker (Antigravity)
# ==============================================================================

$DockerUser = "steelataure0312"
$ProjectName = "leaders"
$BackendImage = "$DockerUser/$ProjectName-backend:latest"
$FrontendImage = "$DockerUser/$ProjectName-frontend:latest"
$BackendService = "leaders-backend"  # À vérifier avec 'railway status'
$FrontendService = "leaders-frontend"

function Write-Step {
    param([string]$Message)
    Write-Host "`n🚀 $Message" -ForegroundColor Yellow
}

function Write-ErrorExit {
    param([string]$Message)
    Write-Host "`n❌ ERREUR : $Message" -ForegroundColor Red
    exit 1
}

function Write-Success {
    param([string]$Message)
    Write-Host "`n✅ $Message" -ForegroundColor Green
}

# 1. Gestion Git
# (Désactivé à la demande de l'utilisateur pour éviter les commits automatiques)
Write-Step "Ignorer l'étape Git (mode manuel)..."
# $CurrentBranch = git branch --show-current
# ... Git operations removed ...


# 2. Build Docker
Write-Step "Construction de l'image Backend ($BackendImage)..."
docker build -t $BackendImage ./backend
if ($LASTEXITCODE -ne 0) { Write-ErrorExit "Échec du build de l'image Backend." }

Write-Step "Construction de l'image Frontend ($FrontendImage)..."
docker build -t $FrontendImage ./frontend
if ($LASTEXITCODE -ne 0) { Write-ErrorExit "Échec du build de l'image Frontend." }

# 3. Push Docker Hub
function Push-WithRetry {
    param([string]$Image)
    Write-Step "Envoi de l'image $Image sur Docker Hub..."
    for ($i = 1; $i -le 3; $i++) {
        docker push $Image
        if ($LASTEXITCODE -eq 0) { return }
        Write-Host "⚠️ Échec de l'envoi (Tentative $i/3). Nouvel essai dans 5s..." -ForegroundColor Cyan
        Start-Sleep -Seconds 5
    }
    Write-ErrorExit "Échec définitif de l'envoi de l'image $Image."
}

Push-WithRetry $BackendImage
Push-WithRetry $FrontendImage

# 4. Déploiement Railway
Write-Step "Déclenchement du redéploiement sur Railway..."
# On cible spécifiquement les services. Si vous avez une erreur, vérifiez les noms avec 'railway status'
railway redeploy --service $BackendService -y
railway redeploy --service $FrontendService -y
if ($LASTEXITCODE -ne 0) { Write-ErrorExit "Le redéploiement Railway a échoué." }

# 5. Nettoyage
Write-Step "Fin du script."
# git checkout main

Write-Success "Le déploiement est terminé avec succès ! 🎉"
