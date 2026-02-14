# Application Settings Reference

> **Last Updated**: February 13, 2026

## Overview

SeventySix uses a layered configuration system. This document provides a high-level reference for all `appsettings.json` sections. **No actual secret values are documented here.**

---

## Setting Categories

| Section | Purpose | Location |
|---------|---------|----------|
| Authentication & Security | JWT, OAuth, MFA, passwords, lockout | `appsettings.json` + user secrets |
| Background Jobs | Scheduled maintenance tasks | `appsettings.json` |
| Caching | FusionCache + Output Cache | `appsettings.json` |
| Email | SMTP and queue settings | `appsettings.json` + user secrets |
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
| `Auth:PasswordPolicy:MinimumLength` | Minimum password length | 12 |
| `Auth:PasswordPolicy:HashAlgorithm` | Password hashing algorithm | Argon2id |
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
| `IpAnonymization:IntervalDays` | GDPR IP anonymization frequency | 7 days |
| `IpAnonymization:RetentionDays` | IP address retention before anonymization | 90 days |
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
| `Email:Smtp:Host` | SMTP server | `smtp-relay.brevo.com` |
| `Email:Smtp:Port` | SMTP port | 587 |
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

---

## Secret vs Config

| Setting | Source | Notes |
|---------|--------|-------|
| `Jwt:SecretKey` | User Secrets / Env Var | **Never** in `appsettings.json` |
| `Auth:OAuth:Providers:*:ClientSecret` | User Secrets / Env Var | GitHub OAuth secret |
| `Email:Smtp:Password` | User Secrets / Env Var | Brevo API key |
| `AdminSeeder:InitialPassword` | User Secrets | Dev admin password |
| `Grafana:AdminPassword` | User Secrets | Grafana admin password |
| `Altcha:HmacKeyBase64` | User Secrets / Env Var | CAPTCHA signing key |
| All other settings | `appsettings.json` | Safe to commit |

> **Rule**: If a value is sensitive (passwords, API keys, tokens), it goes in user secrets or environment variables — **never** in `appsettings.json`.
