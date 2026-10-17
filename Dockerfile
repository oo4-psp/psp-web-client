# ---------------------------
# Base image
# ---------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Enable pnpm via corepack
RUN apk add --no-cache libc6-compat && corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ---------------------------
# Dependencies
# ---------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------
# Build
# ---------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------
# Runner
# ---------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./public/.next/static
COPY --from=builder /app/public ./public

# Expose port 7778
EXPOSE 7778

# Next.js standalone server listens on 3000 by default
ENV PORT=7778

CMD ["npm", "start"]
