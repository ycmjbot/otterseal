# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy root config and catalogs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy all package.json files for better caching
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN CI=true pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages (including shared)
RUN pnpm build

# Deploy server with all dependencies (resolves pnpm symlinks)
RUN mkdir -p /app/server-deploy && \
    cp apps/server/package.json /app/server-deploy/ && \
    cp -r apps/server/dist /app/server-deploy/ && \
    mkdir -p /app/packages-temp && \
    cp -r packages/shared /app/packages-temp/ && \
    cd /app/server-deploy && \
    pnpm install --prod --no-frozen-lockfile && \
    rm -rf /app/packages-temp

# Runtime stage
FROM node:22-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy deployed server (self-contained with real node_modules)
COPY --from=builder /app/server-deploy /app

# Copy built client
COPY --from=builder /app/apps/client/dist /app/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME /app/data

USER node

EXPOSE 3000

CMD ["node", "server.js"]
