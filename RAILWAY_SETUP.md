# Déploiement Railway - Guide Complet (Mis à jour)

Ce projet utilise une configuration **Runtime** pour le frontend, ce qui signifie que l'URL de l'API est injectée au démarrage du conteneur, et non lors du build. Cela rend le déploiement beaucoup plus robuste.

## 1. Structure du Projet

- `backend/` : Application Spring Boot (API).
- `frontend/` : Application React/Vite (UI).

## 2. Déployer sur Railway

1. **Créer un projet** sur [Railway](https://railway.app/).
2. **Provisionner PostgreSQL** : Ajoutez une base de données PostgreSQL à votre projet.

### Service Backend (Spring Boot)

1. Connectez votre repo GitHub.
2. Configurez le **Root Directory** sur `/backend`.
3. Ajoutez les variables d'environnement :
   - `PORT`: `8080`
   - `SPRING_DATASOURCE_URL`: `${DATABASE_URL}`
   - `SPRING_DATASOURCE_USERNAME`: `${PGUSER}`
   - `SPRING_DATASOURCE_PASSWORD`: `${PGPASSWORD}`
4. **Générer un domaine** public (Networking > Generate Domain).

### Service Frontend (React)

1. Connectez le *même* repo GitHub (Nouveau service > GitHub Repo).
2. Configurez le **Root Directory** sur `/frontend`.
3. Ajoutez la variable d'environnement :
   - `VITE_API_URL`: `https://votre-domaine-backend.up.railway.app`
     (Remplacez par le domaine généré à l'étape précédente, sans slash à la fin).

   > **Note** : Grâce à la nouvelle configuration, si vous changez cette variable, un simple **Redeploy** (ou Restart) suffit pour que le changement soit pris en compte. Vous n'avez plus besoin de reconstruire l'image (mais Railway reconstruira quand même par défaut).

## 3. Gestion des Erreurs Fréquentes

### "WebSocket connection failed" / HTML reçu à la place du JSON
Cela signifie que le frontend essaie de se connecter à lui-même.
**Solution** : Vérifiez que la variable `VITE_API_URL` est bien définie dans le service Frontend sur Railway et qu'elle pointe bien vers le **Backend** (et non le frontend).

### "Container failed to start - The executable `serve` could not be found"
Cela arrive si Railway garde une ancienne commande de démarrage.
**Solution** :
1. Allez dans les **Settings** de votre service Frontend sur Railway.
2. Cherchez la section **Deploy** > **Start Command**.
3. **VIDEZ** ce champ (il doit être vide pour utiliser le Dockerfile).
4. Redéployez.

### Backend "Failed to build an image"
Si le build échoue sans message clair :
1. Vérifiez les logs de build (cliquez sur le déploiement rouge > Build Logs).
2. Vérifiez que vous avez bien poussé le fichier `backend/Dockerfile`.
3. Assurez-vous que la variable `PORT` est bien définie (8080).
