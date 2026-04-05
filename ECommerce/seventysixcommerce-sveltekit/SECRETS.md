# SeventySixCommerce SvelteKit — Secrets Reference

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
npm run start:svelte
```

---

## Required Secrets

| User Secret Key | Env Var | Default (dev) |
|-----------------|---------|---------------|
| `Commerce:Sveltekit:DatabaseUrl` | `DATABASE_URL` | `postgresql://ssxc_dev:dev_password_only@localhost:5439/seventysixcommerce_sveltekit_dev` |
| `Commerce:Sveltekit:PostgresPassword` | `POSTGRES_PASSWORD` | `dev_password_only` |
| `Commerce:Sveltekit:MockServices` | `MOCK_SERVICES` | `true` |
| `Commerce:Sveltekit:BaseUrl` | `BASE_URL` | `https://localhost:3001` |

## Optional Secrets

| User Secret Key | Env Var | Purpose |
|-----------------|---------|---------|
| `Commerce:Sveltekit:StripeSecretKey` | `STRIPE_SECRET_KEY` | Stripe payments |
| `Commerce:Sveltekit:StripeWebhookSecret` | `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `Commerce:Sveltekit:PrintfulApiKey` | `PRINTFUL_API_KEY` | Printful fulfillment |
| `Commerce:Sveltekit:PrintfulWebhookSecret` | `PRINTFUL_WEBHOOK_SECRET` | Printful webhook verification |
| `Commerce:Sveltekit:BrevoApiKey` | `BREVO_API_KEY` | Brevo email |
| `Commerce:Sveltekit:SeventySixApiUrl` | `SEVENTYSIX_API_URL` | Main API integration |
| `Commerce:Sveltekit:OtelEndpoint` | `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector |
| `Commerce:Sveltekit:PublicOtelEndpoint` | `PUBLIC_OTEL_ENDPOINT` | Client-side OTel |
| `Commerce:Sveltekit:PublicGa4MeasurementId` | `PUBLIC_GA4_MEASUREMENT_ID` | Google Analytics 4 |
| `Commerce:Sveltekit:PublicGoogleSiteVerification` | `PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `Commerce:Sveltekit:PublicBingSiteVerification` | `PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |

---

## Setting Individual Secrets

```bash
# Set a specific secret (from repo root)
dotnet user-secrets set "Commerce:Sveltekit:StripeSecretKey" "sk_test_..." --project SeventySix.Server/SeventySix.Api

# Or use the manage script
node scripts/run-pwsh.mjs -File scripts/manage-user-secrets.ps1 -Action set -Key "Commerce:Sveltekit:StripeSecretKey" -Value "sk_test_..."
```

---

## Production Deployment

Production secrets are managed via **GitHub Secrets** and injected as environment variables
during deployment. See `deploy-2.md` for setup instructions.

| GitHub Secret | Env Var | Notes |
|---------------|---------|-------|
| `SVELTE_DATABASE_URL` | `DATABASE_URL` | Production PostgreSQL URL |
| `SVELTE_STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Live Stripe key |
| `SVELTE_STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Production webhook secret |
| `SVELTE_PRINTFUL_API_KEY` | `PRINTFUL_API_KEY` | Production Printful key |
| `SVELTE_PRINTFUL_WEBHOOK_SECRET` | `PRINTFUL_WEBHOOK_SECRET` | Production webhook secret |
| `SVELTE_BREVO_API_KEY` | `BREVO_API_KEY` | Production Brevo key |
