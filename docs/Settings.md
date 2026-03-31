# Application Settings Reference

> **Last Updated**: March 12, 2026

## Overview

SeventySix uses a layered configuration system. This document provides a high-level reference for all `appsettings.json` sections. **No actual secret values are documented here.**

---

## Setting Categories

| Section | Purpose | Location |
|---------|---------|----------|
| Authentication & Security | JWT, OAuth, MFA, passwords, lockout | `appsettings.json` + user secrets |
| Background Jobs | Scheduled maintenance tasks | `appsettings.json` |
| Caching | FusionCache + Output Cache | `appsettings.json` |
| Email | Brevo HTTP API and queue settings | `appsettings.json` + user secrets |
| Observability | Logging, tracing, metrics | `appsettings.json` |
| Infrastructure | CORS, rate limiting, resilience | `appsettings.json` |

---

## Authentication & Security

| Setting | Purpose | Default |
|---------|---------|---------|
| `Jwt:AccessTokenExpirationMinutes` | Access token lifetime | 15 min |
| `Jwt:RefreshTokenExpirationDays` | Refresh token lifetime | 1 day |
| `Jwt:RefreshTokenRememberMeExpirationDays` | Extended refresh with "remember me" | 14 days |
| `Jwt:AbsoluteSessionExpirationDays` | Maximum session duration | 30 days |
| `Auth:Password:MinLength` | Minimum password length | 12 |
| `Auth:Password:Argon2` | Password hashing parameters | Argon2id |
| `Auth:Lockout:MaxFailedAttempts` | Failed logins before lockout | 5 |
| `Auth:Lockout:LockoutDurationMinutes` | Lockout duration | 15 min |
| `Mfa:CodeLength` | TOTP code digits | 6 |
| `Mfa:ExpirationMinutes` | Code validity period | 10 min |
| `TrustedDevices:MaxPerUser` | Maximum trusted devices | 5 |
| `TrustedDevices:ExpirationDays` | Trusted device token lifetime | 30 days |
| `BackupCodes:Count` | Backup codes per user | 10 |
| `Altcha:ComplexityMin/Max` | CAPTCHA proof-of-work range | 50000–100000 |
| `Auth:OAuth:Providers` | OAuth providers (GitHub) | Configured via user secrets |
| `Auth:RateLimiting` | Per-action rate limits | Per-action defaults |

## Background Jobs

| Setting | Purpose | Default |
|---------|---------|---------|
| `Logging:Cleanup:IntervalHours` | Log file cleanup frequency | 24h |
| `Logging:Cleanup:RetentionDays` | Log file retention | 7 days |
| `Database:Maintenance:IntervalHours` | DB maintenance (VACUUM, REINDEX) | 24h |
| `RefreshTokenCleanup:IntervalHours` | Expired token purge frequency | 24h |
| `RefreshTokenCleanup:RetentionDays` | Keep expired tokens for | 7 days |
| `OrphanedRegistrationCleanup:RetentionHours` | Unconfirmed registration cleanup | 48h |

## Caching

| Setting | Purpose | Default |
|---------|---------|---------|
| `Cache:Valkey:ConnectionString` | Valkey/Redis connection | `localhost:6379` |
| `Cache:Valkey:InstanceName` | Key prefix | `seventysix:` |
| `Cache:FusionCache:Identity:DurationMinutes` | Identity cache TTL | 1 min |
| `Cache:FusionCache:Logging:DurationMinutes` | Logging cache TTL | 5 min |
| `Cache:FusionCache:ApiTracking:DurationMinutes` | API tracking cache TTL | 5 min |
| `Cache:OutputCache:Policies:*` | HTTP response cache per policy | See [Caching-Strategy.md](Caching-Strategy.md) |

## Email

| Setting | Purpose | Default |
|---------|---------|---------|
| `Email:ApiUrl` | Brevo HTTP API endpoint | `https://api.brevo.com/v3/smtp/email` |
| `Email:Queue:IntervalSeconds` | Queue processing frequency | 30s |
| `Email:Queue:BatchSize` | Emails per batch | 50 |
| `Email:Queue:MaxRetries` | Retry count per email | 3 |

## Observability

| Setting | Purpose | Default |
|---------|---------|---------|
| `OpenTelemetry:Enabled` | Enable OTLP export | `true` |
| `OpenTelemetry:OtlpEndpoint` | OTLP collector URL | `http://localhost:4317` |
| `OpenTelemetry:SamplingStrategy` | Trace sampling | `AlwaysOn` |
| `Serilog:WriteTo` | Log sinks | Console + Rolling File |
| `Serilog:Properties:RetainedFileCountLimit` | Max log files | 30 |

## Infrastructure

| Setting | Purpose | Default |
|---------|---------|---------|
| `Cors:AllowedOrigins` | Allowed CORS origins | `https://localhost:4200` |
| `RateLimiting:GlobalLimit` | Global rate limit | 500 req/hr |
| `RateLimiting:HealthCheckLimit` | Health endpoint limit | 30 req/min |
| `RequestLimits:MaxRequestBodySize` | Max request body | 10 MB |
| `Resilience:Retry:Count` | HTTP retry attempts | 3 |
| `Resilience:CircuitBreaker:FailureThreshold` | Failures before breaking | 5 |
| `Security:EnforceHttps` | HTTPS enforcement | `true` |
| `HealthChecks:Enabled` | Health check endpoints | `true` |

## TLS & Certificates (Production Only)

| Setting | Purpose | Default |
|---------|---------|---------|
| `Database:SslMode` | PostgreSQL SSL connection mode | `Prefer` (dev), `VerifyFull` (prod) |
| `Database:SslCaCertificate` | CA cert path for PostgreSQL verification | — |
| `Database:SslClientCertificate` | Client cert path for PostgreSQL mTLS | — |
| `Database:SslClientKey` | Client key path for PostgreSQL mTLS | — |
| `Cache:Valkey:UseSsl` | Enable TLS for Valkey connection | `false` (dev), `true` (prod) |
| `Cache:Valkey:SslCaCertificate` | CA cert path for Valkey verification | — |
| `Cache:Valkey:SslClientCertificate` | Client cert path for Valkey mTLS | — |
| `Cache:Valkey:SslClientKey` | Client key path for Valkey mTLS | — |
| `OpenTelemetry:TlsCaCertificate` | CA cert path for OTLP exporter | — |
| `OpenTelemetry:TlsClientCertificate` | Client cert path for OTLP exporter | — |
| `OpenTelemetry:TlsClientKey` | Client key path for OTLP exporter | — |

> These settings are only used in production Docker deployments. In development, services communicate over the Docker bridge network without TLS. See [Certificate-Lifecycle.md](Certificate-Lifecycle.md) for rotation procedures.

---

## Secret vs Config

| Setting | Source | Notes |
|---------|--------|-------|
| `Jwt:SecretKey` | User Secrets / Env Var | **Never** in `appsettings.json` |
| `Auth:OAuth:Providers:*:ClientId` | User Secrets / Env Var | GitHub OAuth client ID |
| `Auth:OAuth:Providers:*:ClientSecret` | User Secrets / Env Var | GitHub OAuth secret |
| `Email:ApiKey` | User Secrets / Env Var | Brevo HTTP API key |
| `Email:FromAddress` | User Secrets / Env Var | Sender address (e.g. `noreply@yourdomain.com`) — used in all outgoing emails |
| `Site:Email` | User Secrets / Env Var | Public contact email shown on Privacy Policy and Terms of Service pages (e.g. `hello@yourdomain.com`) — served to client via `/api/v1/config/features` |
| `AdminSeeder:Email` | User Secrets / Env Var | Dev admin account email |
| `AdminSeeder:InitialPassword` | User Secrets | Dev admin initial password |
| `Grafana:AdminPassword` | User Secrets | Grafana admin password |
| `Altcha:HmacKeyBase64` | User Secrets / Env Var | CAPTCHA signing key |
| All other settings | `appsettings.json` | Safe to commit |

> **Rule**: If a value is sensitive (passwords, API keys, tokens), it goes in user secrets or environment variables — **never** in `appsettings.json`.

---

## E-Commerce Site Configuration

The e-commerce sites (SvelteKit and TanStack) use environment variables (not .NET user secrets). Configuration is defined in `docker-compose.seventysixcommerce.yml` for production and `.env` files for local development.

### Common Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Yes (production) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes (production) |
| `PRINTFUL_API_KEY` | Printful API key | Optional (mock available) |
| `BREVO_API_KEY` | Brevo transactional email key | Optional (mock available) |
| `MOCK_SERVICES` | Enable mock integrations (`true`/`false`) | Dev/test only |
| `BASE_URL` | Public URL for the application | Yes |
| `LOG_FORWARDING_URL` | SeventySix API log ingestion endpoint | Optional |
| `NODE_ENV` | `development` or `production` | Yes |

### Mock Services

Both commerce sites support `MOCK_SERVICES=true` which replaces Stripe, Printful, and Brevo with in-memory mock implementations. This is the default for development, E2E tests, and load tests.

For detailed configuration, see:
- [SvelteKit Commerce README](../seventysixcommerce-sveltekit/README.md)
- [TanStack Commerce README](../seventysixcommerce-tanstack/README.md)
