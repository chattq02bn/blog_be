# syntax=docker/dockerfile:1

# ---------- Stage 1: cài dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build ----------
FROM node:24-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript (chỉ build src, không build prisma)
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy node_modules từ builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema và migrations
COPY prisma ./prisma

# Copy code đã build
COPY --from=builder /app/dist ./dist

# Copy scripts
COPY --from=builder /app/scripts ./scripts

# Copy prisma.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy source (để seed chạy được)
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# Start command - seed sẽ chạy bằng tsx (runtime, không cần build)
CMD ["sh", "-c", "echo '=== Running migrations ===' && npx prisma migrate deploy && echo '=== Running seed ===' && npx tsx prisma/seed.ts && echo '=== Starting app ===' && node --enable-source-maps dist/src/server.js"]