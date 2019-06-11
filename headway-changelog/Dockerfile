FROM ianwalter/puppeteer:1.0.0
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .

ENTRYPOINT ["node", "/app/add-changelog.js"]
