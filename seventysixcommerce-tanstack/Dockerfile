FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Database init stage for E2E — pushes schema and seeds data
FROM builder AS db-init
CMD ["sh", "-c", "npx drizzle-kit push --force && npx tsx src/server/db/seed.ts"]

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
	adduser --system --uid 1001 nodeuser
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/server-entry.mjs ./server-entry.mjs
COPY --from=builder --chown=nodeuser:nodejs /app/package.json /app/package-lock.json /app/.npmrc ./
RUN npm ci --omit=dev
USER nodeuser
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/healthz || exit 1
CMD ["node", "server-entry.mjs"]
