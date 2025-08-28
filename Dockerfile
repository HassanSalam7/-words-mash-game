# Multi-stage Docker build for WordMash Battle

# Stage 1: Build the Next.js app
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .
COPY .env.example .env.local

# Build the app
RUN npm run build

# Stage 2: Setup the server
FROM node:20-alpine AS server-setup
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Stage 3: Final production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies for both frontend and server
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/public ./public

# Copy server
COPY --from=server-setup /app/server ./server

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 4568

# Start script that runs both frontend and server
CMD ["sh", "-c", "npm run start & cd server && npm run start"]