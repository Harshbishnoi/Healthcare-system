# Multi-Stage Production Dockerfile for DocPulse Healthcare Platform

# Stage 1: Build Frontend SPA
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build & Package Production Backend Server
FROM node:18-alpine AS server
WORKDIR /app
ENV NODE_ENV=production

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy Prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy Server Source Code
COPY server/ ./

# Copy built frontend assets from client-builder to serve statically
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 5000

CMD ["node", "server.js"]
