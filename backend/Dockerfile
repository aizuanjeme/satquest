# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first — layer is cached unless package.json changes
COPY package.json package-lock.json* ./
RUN npm ci

COPY nest-cli.json tsconfig*.json ./
COPY src ./src

RUN npm run build

# Keep only production dependencies
RUN npm ci --omit=dev

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Non-root user for security
RUN addgroup -S satquest && adduser -S satquest -G satquest

# Create persistent storage dir and give ownership to the app user before switching
RUN mkdir -p /data/breez && chown -R satquest:satquest /data/breez

WORKDIR /app

COPY --from=builder --chown=satquest:satquest /app/node_modules ./node_modules
COPY --from=builder --chown=satquest:satquest /app/dist ./dist

USER satquest

ENV NODE_ENV=production
# Port is internal only — docker-compose does NOT publish it
EXPOSE 3000

CMD ["node", "dist/main"]
