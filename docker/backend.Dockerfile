# Backend Dockerfile for PD-OS
FROM node:20-alpine AS base

# Install dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema first (for generate)
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the backend code
COPY backend/src ./src/
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy built files from base stage
COPY --from=base /app/dist ./dist/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api || exit 1

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
