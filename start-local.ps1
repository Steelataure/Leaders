# ==============================================================================
# Script de Lancement Local pour 'Leaders'
# ==============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n🚀 $Message" -ForegroundColor Yellow
}

# 1. Lancement de la BDD
Write-Step "Lancement de la base de données PostgreSQL (Docker)..."
docker compose up -d database
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Échec du lancement de la DB. Assurez-vous que Docker Desktop est lancé." -ForegroundColor Red
    exit 1 
}

# 2. Information sur le Backend
Write-Step "Lancement du Backend (Spring Boot)..."
Write-Host "Le backend va être lancé sur http://localhost:8085" -ForegroundColor Cyan
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; mvn spring-boot:run"

# 3. Information sur le Frontend
Write-Step "Lancement du Frontend (Vite)..."
Write-Host "Le frontend va être lancé sur http://localhost:5173" -ForegroundColor Cyan
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n✅ Environnement prêt !" -ForegroundColor Green
Write-Host "1. Ouvrez un terminal dans ./backend et lancez: mvn spring-boot:run" -ForegroundColor Yellow
Write-Host "2. Ouvrez un terminal dans ./frontend et lancez: npm run dev" -ForegroundColor Yellow
Write-Host "3. Accédez au jeu sur http://localhost:5173" -ForegroundColor Green
