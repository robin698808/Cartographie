# ─── Étape 1 : build Vite ────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# URLs relatives par défaut (/api, /ws) → relayées par nginx. Pas besoin de
# VITE_API_URL/VITE_WS_URL ici puisque le proxy et le front partagent l'origine.
RUN npm run build

# ─── Étape 2 : nginx (statique + reverse proxy) ──────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
