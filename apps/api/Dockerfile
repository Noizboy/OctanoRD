FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN NODE_ENV=development npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
