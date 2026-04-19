FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY static-server.js .
RUN npm install -g serve
EXPOSE 8080
CMD ["node", "static-server.js"]
