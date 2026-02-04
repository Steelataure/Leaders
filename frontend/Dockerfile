# ---- Étape : Build et Run ----
FROM node:20-alpine
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source
COPY . .

# On build l'application
RUN npx vite build

# Installation du serveur statique
RUN npm install -g serve

# On expose le port 80 (EXIGENCE ESIEA.CLOUD)
EXPOSE 80

# Lancement sur le port 80
CMD ["serve", "-s", "dist", "-l", "80"]