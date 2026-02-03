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
COPY packages/core/package.json ./packages/core/
COPY packages/rest-api/package.json ./packages/rest-api/

# Install dependencies
RUN CI=true pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build all packages (including shared)
RUN pnpm build

# Runtime stage
FROM node:22-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy server built files
COPY --from=builder /app/apps/server/dist /app/dist
COPY --from=builder /app/apps/server/package.json /app/package.json

# Copy server's node_modules (has symlinks)
COPY --from=builder /app/apps/server/node_modules /app/node_modules

# Copy root .pnpm store
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Fix the symlinks - they point to ../../../node_modules/.pnpm but should point to ./.pnpm
# The symlinks in apps/server/node_modules point to ../../node_modules/.pnpm 
# which from /app/node_modules should be ./.pnpm
RUN for link in /app/node_modules/*; do \
      if [ -L "$link" ]; then \
        target=$(readlink "$link"); \
        # Replace ../../../node_modules/.pnpm with ./.pnpm \
        newtarget=$(echo "$target" | sed 's|../../../node_modules/.pnpm|./.pnpm|g'); \
        rm "$link"; \
        ln -s "$newtarget" "$link"; \
      fi \
    done

# Copy built client to dist/public (server expects it relative to __dirname)
COPY --from=builder /app/apps/client/dist /app/dist/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME /app/data

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
