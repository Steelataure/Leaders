# Résolution du problème de déploiement Railway

## Le Problème
L'erreur `Unexpected token '<'` et `WebSocket connection failed` indiquait que votre frontend essayait de se connecter à **lui-même** (il interrogeait son propre domaine pour `/api`, recevait la page React `index.html` en réponse, et échouait à parser ce HTML comme du JSON).

Cela se produisait car la variable `VITE_API_URL` n'était pas correctement intégrée lors du build Docker sur Railway, ou le domaine du backend n'était pas connu à ce moment-là.

## La Solution : Runtime Configuration
J'ai modifié l'application pour que l'URL de l'API soit injectée au **démarrage du conteneur** (Runtime) plutôt qu'à la construction (Build time).

### Changements effectués :
1.  **`config.js`** : Créé un fichier de configuration dynamique chargé par le navigateur.
2.  **Code Frontend** : Mis à jour `client.ts`, `gameApi.ts`, et `WebSocketService.ts` pour lire `window.config.API_URL` en priorité.
3.  **Docker** : Ajouté un script de démarrage (`entrypoint.sh`) qui, sur Railway, prend la variable d'environnement `VITE_API_URL` et l'écrit dans `config.js` avant que Nginx ne démarre.

## Comment appliquer le fix :
1.  Faites un commit et push des changements.
2.  Sur Railway (Service Frontend) :
    - Allez dans **Variables**.
    - Assurez-vous que `VITE_API_URL` est bien définie et pointe vers votre URL de Backend (ex: `https://...up.railway.app`).
    - **Redeployez** le service Frontend.

Désormais, pour changer l'URL du backend, il suffit de changer la variable sur Railway et de redémarrer (Restart) ou redéployer, sans avoir à tout recompiler.
