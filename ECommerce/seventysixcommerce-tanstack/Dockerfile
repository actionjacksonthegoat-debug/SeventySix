FROM node:22-alpine AS builder
WORKDIR /workspace

# Copy shared package (needed for file: dependency resolution)
COPY seventysixcommerce-shared/ ./seventysixcommerce-shared/

# Copy TanStack app
WORKDIR /workspace/seventysixcommerce-tanstack
COPY seventysixcommerce-tanstack/package*.json seventysixcommerce-tanstack/.npmrc ./
RUN npm ci --install-links
COPY seventysixcommerce-tanstack/ .
RUN npm run build

# Database init stage for E2E — pushes schema and seeds data
FROM builder AS db-init
CMD ["sh", "-c", "npx drizzle-kit push --force && npx tsx src/server/db/seed.ts"]

FROM node:22-alpine AS runner
WORKDIR /workspace
RUN addgroup --system --gid 1001 nodejs && \
	adduser --system --uid 1001 nodeuser

# Copy shared package for production install
COPY --from=builder --chown=nodeuser:nodejs /workspace/seventysixcommerce-shared/ ./seventysixcommerce-shared/

WORKDIR /workspace/seventysixcommerce-tanstack
COPY --from=builder --chown=nodeuser:nodejs /workspace/seventysixcommerce-tanstack/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /workspace/seventysixcommerce-tanstack/server-entry.mjs ./server-entry.mjs
COPY --from=builder --chown=nodeuser:nodejs /workspace/seventysixcommerce-tanstack/package.json /workspace/seventysixcommerce-tanstack/package-lock.json /workspace/seventysixcommerce-tanstack/.npmrc ./
RUN npm ci --omit=dev --install-links
USER nodeuser
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/healthz || exit 1
CMD ["node", "server-entry.mjs"]
