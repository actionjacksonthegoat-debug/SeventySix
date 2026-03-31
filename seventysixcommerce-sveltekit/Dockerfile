FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Database init stage for E2E — pushes schema and seeds data
FROM builder AS db-init
CMD ["sh", "-c", "npx drizzle-kit push --force && npx tsx src/lib/server/db/seed.ts"]

# Production stage
FROM node:22-alpine AS production

RUN addgroup -g 1001 nodegroup && \
	adduser -u 1001 -G nodegroup -D nodeuser

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodegroup /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder --chown=nodeuser:nodegroup /app/build ./build

ENV NODE_ENV=production
ENV PORT=3001

USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1

CMD ["node", "build"]
