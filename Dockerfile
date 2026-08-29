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

# Copy package.json và package-lock.json
COPY package.json package-lock.json ./

# Copy toàn bộ node_modules (đã có Prisma Client và dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema và migrations
COPY prisma ./prisma

# Copy code đã build
COPY --from=builder /app/dist ./dist

# Copy scripts nếu có
COPY --from=builder /app/scripts ./scripts

# Copy prisma.config.ts nếu có
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Set environment
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# Start command
CMD ["sh", "-c", "echo '=== Checking environment variables ===' && echo 'DATABASE_URL:' ${DATABASE_URL:+exists} && echo 'DB_USER:' ${DB_USER:-not set} && echo '=== Running migrations ===' && npx prisma migrate deploy && echo '=== Running seed ===' && npm run db:seed && echo '=== Starting app ===' && node --enable-source-maps dist/src/server.js"]