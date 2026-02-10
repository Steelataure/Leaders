#!/bin/bash

# ==============================================================================
# Script de Déploiement Automatique pour le projet 'Leaders'
# Auteur: Expert DevOps Railway & Docker (Antigravity)
# ==============================================================================

# --- Variables ---
DOCKER_USER="steelataure0312"
PROJECT_NAME="leaders"
BACKEND_IMAGE="$DOCKER_USER/$PROJECT_NAME-backend:latest"
FRONTEND_IMAGE="$DOCKER_USER/$PROJECT_NAME-frontend:latest"
BACKEND_SERVICE="leaders-backend"
FRONTEND_SERVICE="leaders-frontend"

# --- Couleurs ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Fonctions ---
error_exit() {
    echo -e "${RED}❌ ERREUR : $1${NC}" >&2
    exit 1
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_step() {
    echo -e "${YELLOW}🚀 $1${NC}"
}

# --- Début du script ---

# 1. Gestion Git
CURRENT_BRANCH=$(git branch --show-current)
echo -n "🌳 Voulez-vous créer une nouvelle branche ? (y/N) : "
read CREATE_NEW

if [[ "$CREATE_NEW" =~ ^[Yy]$ ]]; then
    echo -n "📝 Entrez le nom de la nouvelle branche : "
    read BRANCH_NAME
    if [ -z "$BRANCH_NAME" ]; then
        error_exit "Le nom de la branche ne peut pas être vide."
    fi
    log_step "Création et bascule sur la branche '$BRANCH_NAME'..."
    git checkout -b "$BRANCH_NAME" || error_exit "Impossible de créer la branche '$BRANCH_NAME'."
    TARGET_BRANCH="$BRANCH_NAME"
else
    log_info "Utilisation de la branche actuelle : $CURRENT_BRANCH"
    TARGET_BRANCH="$CURRENT_BRANCH"
fi

log_step "Commit des changements actuels..."
git add .
git commit -m "Auto-deploy from script: modifications on $TARGET_BRANCH" || echo -e "${YELLOW}⚠️ Aucun changement à committer.${NC}"

log_step "Envoi des changements sur GitHub (origin)..."
git push origin "$TARGET_BRANCH" || log_info "Note: Le push GitHub a échoué ou n'est pas configuré, on continue..."

# 2. Build Docker
log_step "Construction de l'image Backend ($BACKEND_IMAGE)..."
docker build -t "$BACKEND_IMAGE" ./backend || error_exit "Échec du build de l'image Backend."

log_step "Construction de l'image Frontend ($FRONTEND_IMAGE)..."
docker build -t "$FRONTEND_IMAGE" ./frontend || error_exit "Échec du build de l'image Frontend."

# 3. Push Docker Hub
push_with_retry() {
    local image=$1
    log_step "Envoi de l'image $image sur Docker Hub..."
    for i in {1..3}; do
        docker push "$image" && return 0
        echo -e "${YELLOW}⚠️ Échec de l'envoi (Tentative $i/3). Nouvel essai dans 5s...${NC}"
        sleep 5
    done
    error_exit "Échec définitif de l'envoi de l'image $image."
}

push_with_retry "$BACKEND_IMAGE"
push_with_retry "$FRONTEND_IMAGE"

# 4. Déploiement Railway
log_step "Déclenchement du redéploiement sur Railway..."
# On cible spécifiquement les services. Vérifiez les noms avec 'railway status'
railway redeploy --service "$BACKEND_SERVICE" -y
railway redeploy --service "$FRONTEND_SERVICE" -y || error_exit "Le redéploiement Railway a échoué."

# 5. Nettoyage
log_step "Retour sur la branche principale (main)..."
git checkout main || error_exit "Impossible de retourner sur la branche main."

log_success "Le déploiement est terminé avec succès ! 🎉"
