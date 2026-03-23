FROM node:20-alpine
WORKDIR /app
COPY apps/api/package.json ./
RUN npm install --legacy-peer-deps
COPY apps/api/ .
RUN npm run build && echo "BUILD OK" && ls dist/ || (echo "BUILD FAILED" && exit 1)
EXPOSE 3000
CMD ["node", "dist/main"]
