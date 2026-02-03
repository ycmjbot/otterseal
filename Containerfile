# Stage 1: Base & Corepack
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Pruning for production
# This stage uses pnpm's 'deploy' command to isolate the 'server' package
FROM base AS build-stage
WORKDIR /app
COPY . .

# 'pnpm deploy' is the key here. It isolates the 'server' workspace
# and its dependencies into a standalone directory.
RUN pnpm install --frozen-lockfile
RUN pnpm build

# We deploy the 'server' package to a separate folder called /out/server
# This removes workspace symlinks and creates a "real" node_modules folder
RUN pnpm -F @otterseal/server --prod deploy /out/server

# Stage 3: The Lean Runner
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only the isolated package from the deploy directory
COPY --from=build-stage /out/server .
COPY --from=build-stage /app/apps/client/dist ./public
RUN mkdir -p /app/data
VOLUME /app/data

# Ensure the 'node' user owns the files
RUN chown -R node:node /app

EXPOSE 3000

USER node

# In the 'deploy' output, you no longer need -F server
# because the context is now only that specific package.
CMD ["npm", "start"]

