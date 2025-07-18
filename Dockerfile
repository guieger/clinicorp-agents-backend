FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm install

RUN npx prisma generate

RUN npm run build

FROM node:18-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json tsconfig.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["node", "dist/server.js"]