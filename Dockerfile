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

# Debug: Kiểm tra Prisma Client
RUN echo "=== Checking Prisma Client ===" && \
  ls -la node_modules/.prisma/ || echo ".prisma not found" && \
  ls -la node_modules/.prisma/client/ || echo ".prisma/client not found" && \
  ls -la node_modules/@prisma/client/ || echo "@prisma/client not found"

# Build TypeScript
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy node_modules từ builder (GIỮ NGUYÊN)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema và migrations
COPY prisma ./prisma

# Copy code đã build
COPY --from=builder /app/dist ./dist

# Copy scripts
COPY --from=builder /app/scripts ./scripts

# Copy prisma.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy source (cho seed)
COPY --from=builder /app/src ./src

# Set environment
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Debug: Kiểm tra lại Prisma Client
RUN echo "=== Final check ===" && \
  ls -la node_modules/.prisma/ || echo ".prisma not found" && \
  ls -la node_modules/.prisma/client/ || echo ".prisma/client not found" && \
  ls -la node_modules/@prisma/client/ || echo "@prisma/client not found"

EXPOSE 4000

# Start command: chạy migrate → seed (chỉ dev) → start app
CMD ["sh", "-c", "\
  echo '=== Running migrations ===' && \
  npx prisma migrate deploy && \
  if [ \"$NODE_ENV\" = \"development\" ]; then \
  echo '=== Running seed (development) ===' && \
  npx tsx prisma/seed.ts; \
  else \
  echo '=== Skipping seed (production) ==='; \
  fi && \
  echo '=== Starting app ===' && \
  node --enable-source-maps dist/server.js \
  "]