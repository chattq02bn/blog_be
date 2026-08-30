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

RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src ./src

ENV NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 4000

# CMD: migrate → seed (chỉ khi NODE_ENV=development) → start app
CMD ["sh", "-c", "\
  echo '=== Running migrations ===' && \
  npx prisma migrate deploy && \
  if [ \"$NODE_ENV\" = \"development\" ]; then \
    echo '=== Running seed ===' && \
    npx tsx prisma/seed.ts; \
  else \
    echo '=== Skipping seed (production) ==='; \
  fi && \
  echo '=== Starting app ===' && \
  node --enable-source-maps dist/server.js \
"]
