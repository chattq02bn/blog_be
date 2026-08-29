# syntax=docker/dockerfile:1

# ---------- Stage 1: cài dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build và generate Prisma ----------
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies và source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ---------- Stage 3: runtime production ----------
FROM node:24-alpine AS runtime
WORKDIR /app

# Copy toàn bộ node_modules từ builder (đã có Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema và migrations
COPY prisma ./prisma

# Copy code đã build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

# Set environment
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# Chạy migrations + seed + start app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node --enable-source-maps dist/src/server.js"]