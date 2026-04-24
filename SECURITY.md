# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main` / `master`) | ✅ |
| Older branches | ❌ |

Security fixes are applied only to the latest version on the default branch.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

To report a vulnerability, use one of the following channels:

- **GitHub Private Vulnerability Reporting** (preferred):
  Use the [Report a vulnerability](../../security/advisories/new) button on the Security tab of this repository. This keeps the report private until a fix is available.

- **Email** (alternative):
  Send a detailed report to **<support@seventysixsandbox.com>**.
  Include the words `[SECURITY]` in the subject line.

### What to Include

Please provide as much of the following as possible:

- A clear description of the vulnerability and its potential impact.
- The affected component, route, or endpoint.
- Steps to reproduce (proof-of-concept code or a detailed walkthrough).
- Any suggested mitigation or fix.

### Response Timeline

| Stage | Target |
|-------|--------|
| Acknowledgement | Within **48 hours** of receipt |
| Initial assessment | Within **5 business days** |
| Fix or workaround | Dependent on severity — Critical within **14 days** where possible |
| Disclosure | Coordinated with reporter after fix is released |

We follow responsible disclosure: we will not take legal action against researchers who discover and report vulnerabilities in good faith following this policy.

## Scope

The following are **in scope**:

- Authentication and session handling
- Authorization and access control bypasses
- Cross-site scripting (XSS) and injection vulnerabilities
- Sensitive data exposure
- CSRF vulnerabilities
- Security misconfigurations in production Docker/nginx setup

The following are **out of scope**:

- Vulnerabilities in third-party dependencies not introduced by this project
- Rate-limiting bypass on local/development environments
- Issues requiring physical access to the host machine
- Social engineering attacks

## Disclosure Policy

Once a fix has been released, we will publish a GitHub Security Advisory. Credit will be given to reporters who wish to be acknowledged.

## Security Best Practices for Deployers

See the [deployment documentation](docs/Startup-Instructions.md) for recommended hardening steps including MFA enforcement, rate limiting (Cloudflare WAF + .NET rate limiting), and TLS configuration.

## Implemented Security Controls

| Control | Detail |
|---------|--------|
| **JWT algorithm** | HS256 only (`ValidAlgorithms` locked — algorithm-confusion attacks blocked) |
| **JWT `kid` header** | Tokens carry a key identifier derived from the signing key fingerprint |
| **JWT key rotation** | `Jwt:PreviousSecretKey` + `Jwt:PreviousKeyId` enable zero-downtime rotation |
| **Refresh token cookie scope** | `Path = "/api/v1/auth"` — token is not sent with every API request |
| **CSP** | Production `connect-src` excludes third-party domains not required by the app |
| **Sensitive data redaction** | `SensitivePropertyDestructuringPolicy` redacts passwords, tokens, and secrets from all Serilog sinks |
| **ProblemDetails** | Exception types and stack traces are never returned to clients |
| **Stripe webhooks** | Both commerce apps verify `stripe-signature` and return 400 on failure |
| **CSRF** | TanStack: origin-validation middleware on all mutating server functions; SvelteKit: built-in form-action CSRF + same origin validation |
| **OAuth** | PKCE S256, `state` cookie validation, host-validated redirect URI |
| **Caddy edge** | HSTS preload, `frame-ancestors 'none'`, `Server` header stripped |
