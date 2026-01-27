# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY client/package*.json ./client/

# Install dependencies
RUN cd client && npm install

# Copy source code
COPY client ./client

# Build client
RUN cd client && npm run build

# Server stage
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --only=production

# Copy server code
COPY server ./

# Runtime stage
FROM node:22-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy server files
COPY --from=builder /app/server /app

# Copy built client assets to server public directory
COPY --from=builder /app/client/dist /app/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME /app/data

USER node

EXPOSE 3000

CMD ["node", "server.js"]
