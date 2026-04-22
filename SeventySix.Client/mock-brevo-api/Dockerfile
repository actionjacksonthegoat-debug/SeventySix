FROM node:24-alpine3.21@sha256:5579647898d35dbc9ca22010e46c207deb6320f785822a3c5ba3a84b81b57309
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
