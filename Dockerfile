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

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Debug: Kiểm tra Prisma Client
RUN echo "=== Checking Prisma Client ===" && \
    ls -la node_modules/@prisma/client/ || echo "Not found in @prisma" && \
    ls -la node_modules/.prisma/client/ || echo "Not found in .prisma"

# ---------- Stage 3: runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy node_modules từ builder (đã có Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema và migrations
COPY prisma ./prisma

# Copy code đã build
COPY --from=builder /app/dist ./dist

# Copy scripts
COPY --from=builder /app/scripts ./scripts

# Copy prisma.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Set environment
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# Debug: Kiểm tra file
RUN echo "=== Checking files ===" && \
    ls -la /app/ && \
    ls -la /app/prisma/ || echo "prisma folder not found" && \
    ls -la /app/dist/src/lib/ || echo "lib not found"

# Start command
CMD ["sh", "-c", "echo '=== Running migrations ===' && npx prisma migrate deploy && echo '=== Running seed ===' && npx tsx prisma/seed.ts && echo '=== Starting app ===' && node --enable-source-maps dist/src/server.js"]