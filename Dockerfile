# syntax=docker/dockerfile:1

# ---------- Stage 1: cài dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build ----------
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# Debug: In ra biến môi trường (ẩn password)
RUN echo "DB_USER: ${DB_USER}" && \
    echo "DB_HOST: ${DB_HOST}" && \
    echo "DB_NAME: ${DB_NAME}" && \
    echo "DATABASE_URL exists: ${DATABASE_URL:+yes}"

# Start command
CMD ["sh", "-c", "echo '=== Checking environment variables ===' && echo 'DATABASE_URL:' ${DATABASE_URL:+exists} && echo 'DB_USER:' ${DB_USER:-not set} && echo 'DB_HOST:' ${DB_HOST:-not set} && echo 'DB_NAME:' ${DB_NAME:-not set} && echo '=== Running migrations ===' && npx prisma migrate deploy && echo '=== Running seed ===' && npm run db:seed && echo '=== Starting app ===' && node --enable-source-maps dist/src/server.js"]