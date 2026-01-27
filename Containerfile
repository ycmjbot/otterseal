# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
# We do this separately to leverage caching
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Copy server dependencies
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package*.json ./server/

# Copy server code
COPY --from=builder /app/server/server.js ./server/

# Copy built client assets to server public directory
COPY --from=builder /app/client/dist ./server/public

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data

USER node

EXPOSE 3000

CMD ["node", "server/server.js"]
