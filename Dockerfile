FROM node:20-slim

ENV NODE_ENV=development

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# 開発用: ソースは docker-compose (omabo-platform/local) で volume マウントされる前提。
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
