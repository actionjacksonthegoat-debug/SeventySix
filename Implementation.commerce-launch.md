# SeventySixCommerce — Production Launch & SEO Growth Plan

> **All code is complete.** Both storefronts (TanStack Start + SvelteKit) are merged to `master`. This plan covers the remaining **manual steps** — deployment, SEO, analytics, and growth — to make SeventySixCommerce a successful, high-ranking e-commerce site.

---

## What's Built

| App | Directory | Production Subdomain | Port |
|-----|-----------|---------------------|------|
| **TanStack Start** (React) | `seventysixcommerce-tanstack/` | `seventysixcommerce-react.seventysixsandbox.com` | 3000 |
| **SvelteKit 2+** (Svelte 5) | `seventysixcommerce-sveltekit/` | `seventysixcommerce-svelte.seventysixsandbox.com` | 3001 |

Both apps include: checkout flow (Stripe), fulfillment (Printful), email (Brevo), mock mode, 9-product catalog, dark/light themes, full test suites, CI/CD pipeline, Docker publish to GHCR, SSH deploy workflow, and security hardening.

---

## What Remains

### 1. Deploy to Production (Manual)

| File | Scope | Status |
|------|-------|--------|
| [deploy.md](deploy.md) | Deployment orchestrator | ✅ Code fixes complete |
| [deploy-1.md](deploy-1.md) | Caddy import + subdomain alignment | ✅ Code fixes complete |
| [deploy-2.md](deploy-2.md) | Cloudflare DNS/SSL + GitHub secrets + first deploy | Manual steps remain |

**Code changes completed:**
- `Caddyfile.production` — `import` directive already present
- `Caddyfile.seventysixcommerce` — routes configured
- `seventysixcommerce-deploy.yml` — subdomain defaults fixed to match Caddyfile
- `docker-compose.seventysixcommerce.yml` — `MOCK_SERVICES` now configurable via env var
- `.env.production.example` files — subdomain names corrected

**Manual steps remaining** (see deploy-2.md for full details):
- Cloudflare: Create DNS A records, verify SSL origin cert covers wildcards
- GitHub: Set `SSXC_*` secrets/variables in `production` environment
- Hetzner: Verify Docker, Caddy, certs, GHCR access
- First deploy: Trigger workflow, verify health checks

### 2. SEO Execution (Post-Deploy)

| File | Scope | Status |
|------|-------|--------|
| [implementation-10.md](implementation-10.md) | Search engine submission, analytics, structured data validation | Manual steps only |

All SEO code is built (JSON-LD, sitemaps, GA4, OG tags, cookie consent, verification env vars). Remaining work is account setup and verification.

### 3. Post-Launch Growth

| File | Scope | Status |
|------|-------|--------|
| [implementation-11.md](implementation-11.md) | Content expansion, backlink strategy, email marketing, performance monitoring | Manual steps only |

---

## Execution Order

```
deploy-2.md  →  implementation-10.md  →  implementation-11.md
(deploy)         (SEO setup)              (growth)
```

---

## Gates

| Gate | Criteria |
|------|----------|
| **Deployment** | Both sites 200 OK on health endpoints, SSL valid, existing platform unaffected |
| **SEO Readiness** | Google/Bing Search Console verified, sitemaps indexed, structured data passes Rich Results Test, GA4 tracking conversions |
| **Growth** | Content published, social media linked, performance monitoring active |

---

## Security Checklist (Before Live Payments)

- [ ] No secrets in source control — all via GitHub Secrets
- [ ] Stripe webhook signature verification working
- [ ] CSRF protection active on all mutation endpoints
- [ ] PII not logged in plain text
- [ ] Error responses don't leak internals
- [ ] Cloudflare Full (Strict) SSL mode
- [ ] Origin cert covers `*.seventysixsandbox.com`
- [ ] Docker containers run as non-root
- [ ] PostgreSQL not exposed on public interface
- [ ] Hetzner firewall allows only 80/443 inbound

---

## Infrastructure

| Resource | Value |
|----------|-------|
| Server | Hetzner CCX23 (4 vCPU, 16GB RAM, 160GB SSD) |
| Domain | `seventysixsandbox.com` |
| CDN/SSL | Cloudflare free tier, Full (Strict) mode |
| Reverse Proxy | Caddy with Cloudflare origin certificates |
| Registry | GHCR (`ghcr.io`) |
| CI/CD | GitHub Actions → SSH deploy |

---

## Reference: Completed Build Phases

<details>
<summary>Click to expand completed implementation files (1-9)</summary>

| File | Scope |
|------|-------|
| implementation-1.md | Business Plan & Market Strategy |
| implementation-2.md | TanStack Start Technical Track |
| implementation-3.md | SvelteKit Technical Track |
| implementation-4.md | SEO & Bot Crawler Master Strategy |
| implementation-5.md | Payment, Fulfillment & E-Commerce Domain |
| implementation-6.md | Deployment, Infrastructure & Go-Live |
| implementation-7.md | TanStack Start: Bug Fixes & Security Hardening |
| implementation-8.md | SvelteKit: Bug Fixes & Production Hardening |
| implementation-9.md | Mock Mode, Product Library & One-Command Startup |

</details>
