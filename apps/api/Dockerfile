FROM node:20-alpine

WORKDIR /app

COPY apps/api/package.json ./
RUN npm install --legacy-peer-deps

COPY apps/api/ .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
