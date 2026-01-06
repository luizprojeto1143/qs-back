# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY server/package*.json ./server/
COPY package*.json ./

# Install dependencies for build
WORKDIR /app/server
RUN npm ci

COPY server/ ./
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/prisma ./prisma

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start:prod"]
