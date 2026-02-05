# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextuser -u 1001

# Set proper permissions
RUN chown -R nextuser:nodejs /usr/share/nginx/html && \
    chown -R nextuser:nodejs /var/cache/nginx && \
    chown -R nextuser:nodejs /var/log/nginx && \
    chown -R nextuser:nodejs /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nextuser:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nextuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
