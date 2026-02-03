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

# On expose le port 5173
EXPOSE 5173

# Lancement du serveur sur le port 5173
# Le flag -s permet de gérer le Single Page Application (React)
CMD ["serve", "-s", "dist", "-l", "5173"]