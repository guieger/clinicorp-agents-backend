 # Etapa de build
 FROM node:18 as build

 WORKDIR /app
 
 COPY package*.json ./
 RUN npm install
 
 COPY . .
 RUN npm run build
 
 # Etapa de produção
 FROM node:18
 
 WORKDIR /app
 
 COPY package*.json ./
 RUN npm install --only=production
 
 COPY --from=build /app/dist ./dist
 
 EXPOSE 3000
 
 CMD ["node", "dist/server.js"]
 