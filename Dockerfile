FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npx", "tsx", "--watch", "src/server.ts"]