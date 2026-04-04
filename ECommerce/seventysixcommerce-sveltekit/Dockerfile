FROM node:22-alpine AS builder

WORKDIR /workspace

# Copy shared package (needed for file: dependency resolution)
COPY seventysixcommerce-shared/ ./seventysixcommerce-shared/

# Copy SvelteKit app
WORKDIR /workspace/seventysixcommerce-sveltekit
COPY seventysixcommerce-sveltekit/package.json seventysixcommerce-sveltekit/package-lock.json ./
RUN npm ci --install-links

COPY seventysixcommerce-sveltekit/ .
RUN npm run build

# Database init stage for E2E — pushes schema and seeds data
FROM builder AS db-init
CMD ["sh", "-c", "npx drizzle-kit push --force && npx tsx src/lib/server/db/seed.ts"]

# Production stage
FROM node:22-alpine AS production

RUN addgroup -g 1001 nodegroup && \
	adduser -u 1001 -G nodegroup -D nodeuser

WORKDIR /workspace

# Copy shared package for production install
COPY --from=builder --chown=nodeuser:nodegroup /workspace/seventysixcommerce-shared/ ./seventysixcommerce-shared/

WORKDIR /workspace/seventysixcommerce-sveltekit
COPY --from=builder --chown=nodeuser:nodegroup /workspace/seventysixcommerce-sveltekit/package.json /workspace/seventysixcommerce-sveltekit/package-lock.json ./
RUN npm ci --omit=dev --install-links
COPY --from=builder --chown=nodeuser:nodegroup /workspace/seventysixcommerce-sveltekit/build ./build

ENV NODE_ENV=production
ENV PORT=3001

USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:3001/healthz || exit 1

CMD ["node", "build"]
