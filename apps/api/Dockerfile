# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/api/package.json ./
RUN npm install --legacy-peer-deps --include=dev
COPY apps/api/ .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY apps/api/package.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
