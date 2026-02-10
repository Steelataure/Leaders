# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build variable for API URL (Railway injects this at build time if defined)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# On copie le dossier buildé
COPY --from=build /app/dist .

# On utilise les templates Nginx pour le support des variables d'environnement
# Railway injectera BACKEND_URL
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Valeur par défaut pour le backend (nom du service dans compose)
ENV BACKEND_URL=http://backend:8080

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]