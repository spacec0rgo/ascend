
# Backend
FROM node:25-bookworm-slim AS backend
WORKDIR /app
RUN mkdir skill-trees
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/src/ ./src/
EXPOSE 3030
CMD ["node", "src/index.js"]

# Frontend
FROM node:25-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Nginx
FROM nginx:trixie AS frontend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4080
CMD ["nginx", "-g", "daemon off;"]