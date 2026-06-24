# syntax=docker/dockerfile:1

# Simple build for the JiranTetangga API server (works with pnpm workspace)

ARG NODE_VERSION=24-alpine
FROM node:${NODE_VERSION}

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/api-server/package.json ./packages/api-server/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY packages/api-server/ ./packages/api-server/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3500
CMD ["node", "packages/api-server/app.js"]
