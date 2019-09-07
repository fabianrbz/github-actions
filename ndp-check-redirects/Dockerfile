FROM node:10-slim
FROM node:slim
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["node", "/index.js"]
