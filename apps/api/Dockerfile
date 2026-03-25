FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN NODE_ENV=development npm install --legacy-peer-deps
COPY . .
RUN ./node_modules/.bin/nest build
RUN test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found after nest build" && ls -la dist/ 2>/dev/null && exit 1)
EXPOSE 3000
CMD ["node", "dist/src/main"]
