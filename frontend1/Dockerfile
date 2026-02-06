# ---- Étape 1 : Build ----
FROM node:20-alpine AS build
WORKDIR /app

# On installe les dépendances
COPY package*.json ./
RUN npm install

# On copie le reste du code et on build
COPY . .
RUN npx vite build

# ---- Étape 2 : Production (Image légère) ----
FROM node:20-alpine
WORKDIR /app

# On installe uniquement le serveur statique
RUN npm install -g serve

# On récupère UNIQUEMENT le dossier buildé de l'étape précédente
COPY --from=build /app/dist ./dist

# EXIGENCE ESIEA.CLOUD : Port 80
EXPOSE 80

# On lance le serveur sur le port 80
CMD ["serve", "-s", "dist", "-l", "80"]