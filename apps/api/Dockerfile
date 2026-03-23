FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json ./
RUN NODE_ENV=development npm install --legacy-peer-deps
COPY . .
RUN ./node_modules/.bin/nest build && ls -la dist/main.js
EXPOSE 3000
CMD ["node", "dist/main"]
