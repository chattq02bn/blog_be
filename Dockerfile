# syntax=docker/dockerfile:1

# ---------- Stage 1: cài dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: sinh Prisma Client ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json package.json ./
COPY src ./src
RUN npx prisma generate

# ---------- Stage 3: image chạy thật ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src/generated ./src/generated
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY prisma.config.ts tsconfig.json package.json ./

EXPOSE 4000

CMD ["npx", "tsx", "src/server.ts"]
