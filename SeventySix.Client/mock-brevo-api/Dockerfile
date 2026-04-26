FROM node:24-alpine3.22@sha256:b689d4005875ae167178471a7a622ec2909459a3bbb32277260be1971af7a99f
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.js .
EXPOSE 3000
CMD ["node", "server.js"]
