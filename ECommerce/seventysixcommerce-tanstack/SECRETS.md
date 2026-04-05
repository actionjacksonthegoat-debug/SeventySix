# SeventySixCommerce TanStack Start — Secrets Reference

> **Local development** uses .NET user-secrets (shared with the main SeventySix API).
> **Production** uses GitHub Secrets injected as environment variables during deployment.
> **No `.env` files are needed** — the start script loads secrets automatically.

---

## Quick Start

```bash
# Initialize all secrets (including commerce) with development defaults
npm run secrets:init

# View current secrets
npm run secrets:list

# Start the app (secrets are loaded automatically)
npm run start:tanstack
```

---

## Required Secrets

| User Secret Key | Env Var | Default (dev) |
|-----------------|---------|---------------|
| `Commerce:Tanstack:DatabaseUrl` | `DATABASE_URL` | `postgresql://seventysixcommerce:seventysixcommerce_dev@localhost:5438/seventysixcommerce` |
| `Commerce:Tanstack:PostgresPassword` | `POSTGRES_PASSWORD` | `seventysixcommerce_dev` |
| `Commerce:Tanstack:MockServices` | `MOCK_SERVICES` / `VITE_MOCK_SERVICES` | `true` |
| `Commerce:Tanstack:BaseUrl` | `BASE_URL` | `https://localhost:3002` |

## Optional Secrets

| User Secret Key | Env Var | Purpose |
|-----------------|---------|---------|
| `Commerce:Tanstack:StripeSecretKey` | `STRIPE_SECRET_KEY` | Stripe payments |
| `Commerce:Tanstack:StripeWebhookSecret` | `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `Commerce:Tanstack:PrintfulApiKey` | `PRINTFUL_API_KEY` | Printful fulfillment |
| `Commerce:Tanstack:PrintfulWebhookSecret` | `PRINTFUL_WEBHOOK_SECRET` | Printful webhook verification |
| `Commerce:Tanstack:BrevoApiKey` | `BREVO_API_KEY` | Brevo email |
| `Commerce:Tanstack:SeventySixApiUrl` | `SEVENTYSIX_API_URL` | Main API integration |
| `Commerce:Tanstack:OtelEndpoint` | `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector |
| `Commerce:Tanstack:PublicOtelEndpoint` | `VITE_OTEL_ENDPOINT` | Client-side OTel |
| `Commerce:Tanstack:PublicGa4MeasurementId` | `VITE_GA4_MEASUREMENT_ID` | Google Analytics 4 |
| `Commerce:Tanstack:PublicGoogleSiteVerification` | `VITE_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `Commerce:Tanstack:PublicBingSiteVerification` | `VITE_BING_SITE_VERIFICATION` | Bing Webmaster Tools |

> **Note**: TanStack Start uses the `VITE_` prefix for client-accessible environment variables
> (instead of `PUBLIC_` used by SvelteKit). The secrets loader handles this mapping automatically.

---

## Setting Individual Secrets

```bash
# Set a specific secret (from repo root)
dotnet user-secrets set "Commerce:Tanstack:StripeSecretKey" "sk_test_..." --project SeventySix.Server/SeventySix.Api

# Or use the manage script
node scripts/run-pwsh.mjs -File scripts/manage-user-secrets.ps1 -Action set -Key "Commerce:Tanstack:StripeSecretKey" -Value "sk_test_..."
```

---

## Production Deployment

Production secrets are managed via **GitHub Secrets** and injected as environment variables
during deployment. See `deploy-2.md` for setup instructions.

| GitHub Secret | Env Var | Notes |
|---------------|---------|-------|
| `TANSTACK_DATABASE_URL` | `DATABASE_URL` | Production PostgreSQL URL |
| `TANSTACK_STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Live Stripe key |
| `TANSTACK_STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Production webhook secret |
| `TANSTACK_PRINTFUL_API_KEY` | `PRINTFUL_API_KEY` | Production Printful key |
| `TANSTACK_PRINTFUL_WEBHOOK_SECRET` | `PRINTFUL_WEBHOOK_SECRET` | Production webhook secret |
| `TANSTACK_BREVO_API_KEY` | `BREVO_API_KEY` | Production Brevo key |
