---
agent: agent
description: Comprehensive OWASP/PII/Auth security audit of the entire codebase
---

# Security Review

Perform a comprehensive security audit of the entire codebase. This review ensures ALL code is production-ready and prepared for penetration testing with bank-level security standards.

## MCP Tools

- Use **context7** to verify current security best practices for .NET 10, Angular 21, ASP.NET Core Identity, OWASP guidelines
- Use **postgresql** to inspect database schema for PII exposure, column encryption, and access patterns
- Use **github** to check for any security-related issues or advisories
- Use **chrome-devtools** to verify client-side security: cookie flags (Secure, HttpOnly, SameSite), CSP headers, network request security, CORS responses

## [CRITICAL] Goal

Ensure that ALL code being reviewed is ready for:
1. **Production deployment** with bank-level security
2. **Penetration testing** — no low-hanging vulnerabilities
3. **Public repository exposure** — zero secrets, PII, or sensitive data in any tracked file

---

## Stage 1: Secrets and PII Scan (HIGHEST PRIORITY)

Scan the ENTIRE repository (all tracked files) for:

### A) Hardcoded Secrets
- API keys, tokens, passwords, connection strings
- JWT signing keys, HMAC secrets, encryption keys
- OAuth client secrets, SMTP credentials
- Database credentials (usernames, passwords, hosts)
- Certificate passwords, PFX passphrases
- Any string matching patterns: `password`, `secret`, `apikey`, `token`, `connectionstring`, `smtp`, `credential`

### B) PII Exposure
- Developer names, emails, machine names, usernames in code or comments
- IP addresses (non-localhost), MAC addresses
- File paths containing user directories (e.g., `C:\Users\{name}\...`)
- Any personal data that could identify a developer or user

### C) Environment Files
- `.env`, `.env.local`, `.env.production` files that should be gitignored
- `appsettings.*.local.json` files that should be gitignored
- `appsettings.Production.json` (must be gitignored — only template allowed)
- User secrets references that might contain actual values
- Check `.gitignore` covers ALL sensitive file patterns

### D) Checked-In Certificates and Keys
- `.pfx`, `.p12`, `.pem`, `.key` files in tracked files
- SSL certificates with private keys
- Data protection keys in tracked directories

**Action**: For every finding, determine if it's a real secret or a safe placeholder (`PLACEHOLDER_USE_USER_SECRETS`). Fix real secrets immediately.

---

## Stage 2: OWASP Top 10 Audit

### A) Injection (A03:2021)
- SQL injection: Any raw SQL with string concatenation or interpolation
- Command injection: Any `Process.Start()` or shell execution with user input
- LDAP injection: Any directory queries with unescaped input
- NoSQL injection: Any document queries with unescaped input
- EF Core: Verify all queries use parameterized LINQ, `FromSqlInterpolated`, or `FromSqlRaw` with parameters

### B) Broken Authentication (A07:2021)
- Password hashing: Verify Argon2id with OWASP-recommended parameters
- Account lockout: Verify progressive lockout on failed attempts
- Brute-force protection: Rate limiting on login, MFA, and password reset endpoints
- Session management: Cookie flags (Secure, HttpOnly, SameSite=Strict)
- Token security: JWT signing algorithm (RS256/HS256), expiration, refresh rotation

### C) Sensitive Data Exposure (A02:2021)
- HTTPS enforcement: `UseHsts()`, `UseHttpsRedirection()` in production
- API responses: No raw exception messages in ProblemDetails (verify `security.instructions.md` compliance)
- Logging: No PII or secrets in log output (`ILogger` calls)
- Error pages: No stack traces or internal details in production error responses

### D) Broken Access Control (A01:2021)
- Authorization attributes on ALL controller endpoints
- Role-based access control enforcement (server-side, not just client-side)
- IDOR prevention: Verify users can only access their own resources
- CORS policy: Verify allowed origins are restrictive

### E) Security Misconfiguration (A05:2021)
- Debug mode disabled in production configs
- Default credentials removed or documented as dev-only
- Unnecessary endpoints disabled in production (Swagger/Scalar)
- Security headers: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy

### F) Cross-Site Scripting (A03:2021)
- Angular template safety: No `innerHTML` binding with user input
- `bypassSecurityTrustHtml` usage: Verify legitimate use cases only
- CSP headers preventing inline scripts

### G) Insecure Deserialization (A08:2021)
- JSON deserialization: No `TypeNameHandling` in Newtonsoft, no unsafe `System.Text.Json` converters
- Request body validation: All endpoints use FluentValidation

### H) Using Components with Known Vulnerabilities (A06:2021)
- Check `package.json` / `package-lock.json` for known CVEs: `npm audit`
- Check `.csproj` files for outdated NuGet packages: `dotnet list package --vulnerable`
- Check Docker base images for known vulnerabilities

### I) Insufficient Logging & Monitoring (A09:2021)
- Authentication events logged (login success/failure, lockout, MFA)
- Authorization failures logged
- Input validation failures logged
- Rate limit violations logged

---

## Stage 3: Authentication / Identity / MFA Deep Audit

Review EVERY file in `SeventySix.Domains.Identity/` and the `auth/` client domain:

### A) Login Flow
- Credential validation with constant-time comparison
- Account lockout with progressive delay
- Brute-force protection per IP and per account
- Failed login attempt logging (without logging the password)

### B) MFA Flow
- Code generation: Cryptographically random, sufficient length
- Code hashing: Stored hashed, never plaintext
- Code verification: Timing-safe comparison
- Code expiration: Short-lived (5-10 minutes)
- Attempt limiting: Max attempts before lockout

### C) TOTP Flow
- Secret generation: Cryptographically random, sufficient entropy
- Secret storage: Encrypted at rest
- Enrollment: Secure QR code generation
- Verification: Time-window tolerance, replay prevention

### D) Token Management
- Access token: Short-lived (15-30 minutes)
- Refresh token: Rotation on use, stored hashed
- Token revocation: Blacklist or family invalidation
- Sliding expiration: Bounded lifetime

### E) Backup Codes
- Generation: Cryptographically random
- Storage: Hashed (never plaintext)
- Single-use enforcement: Mark as used after verification

### F) Password Policy
- Argon2id with OWASP ASVS v4 parameters
- Minimum length (12+ characters)
- Breach detection (HaveIBeenPwned k-Anonymity)
- No password in logs or error messages

---

## Stage 4: Infrastructure Security

### A) Docker Configuration
- No secrets in Dockerfiles or docker-compose files
- Secrets passed via environment variables or Docker secrets
- Non-root container users where possible
- Minimal base images

### B) nginx Configuration
- TLS 1.2+ only
- Strong cipher suites
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting configuration

### C) Database Security
- Connection strings use secrets, never hardcoded
- Schema-per-domain isolation
- No superuser access from application

---

## Stage 5: Client-Side Security

### A) Angular Security
- No `bypassSecurityTrust*` without documented justification
- HttpOnly cookies for auth tokens (no localStorage)
- CSRF protection via Angular's `HttpXsrfModule` or custom implementation
- Route guards enforcing authorization

### B) API Communication
- All API calls over HTTPS
- Auth tokens sent via secure cookies or Authorization header
- No sensitive data in URL query parameters
- Request/response interceptors for auth token management

---

## Stage 6: CodeQL Alert Triage (MANDATORY)

> This stage requires the `github.vscode-codeql` extension and CodeQL CLI (see `docs/Startup-Instructions.md`).

### A) Run Local Scan (if not already done)

```bash
# From repo root — TypeScript first (fast), then C#
npm run scan:codeql:ci

# Or individual languages:
npm run scan:codeql:ci:typescript
npm run scan:codeql:ci:csharp
```

### B) Review GitHub Code Scanning Alerts

Navigate to: **GitHub repo → Security → Code Scanning Alerts**

- Filter by: **Open** + **Tool: CodeQL**
- Record all Critical and High alerts
- Each must be fixed before declaring the review complete

### C) VS Code SARIF Review

1. Open Command Palette → **CodeQL: Open SARIF File**
2. Select `.codeql/results/csharp.sarif` and `.codeql/results/typescript.sarif`
3. Use the in-editor alert highlights to navigate to each finding
4. Apply fixes from `implementation-2.md` Phase 2-5 patterns

### D) Exit Criteria for Stage 6

- Zero open Critical or High CodeQL alerts on the Security tab
- All fixes include a corresponding unit or integration test where applicable
- No new alerts introduced by recent changes

---

## Stage 7: Cookie Consent Legal Compliance Check

### A) Banner Compliance

- [ ] Cookie consent banner appears on first visit of a fresh browser profile
- [ ] "Reject Non-Essential" and "Accept All Cookies" have equal visual weight (no dark patterns)
- [ ] No non-essential cookies are set before consent is given (check DevTools → Application → Cookies)
- [ ] Consent cookie (`seventysix_consent`) is set after accepting
- [ ] Consent cookie expires in 1 year (check cookie expiry in DevTools)
- [ ] Re-opening settings from footer triggers the dialog/banner

### B) Legal Pages

- [ ] `/privacy-policy` accessible without authentication
- [ ] `/terms-of-service` accessible without authentication
- [ ] GDPR Art. 13/14 disclosures present in Privacy Policy
- [ ] CCPA rights section present in Privacy Policy
- [ ] "We do not sell" statement present in Privacy Policy

### C) Accessibility

- [ ] axe-core WCAG 2.2 AA — 0 critical/serious violations on banner
- [ ] axe-core WCAG 2.2 AA — 0 violations on Privacy Policy page
- [ ] axe-core WCAG 2.2 AA — 0 violations on Terms of Service page
- [ ] Banner keyboard navigable (Tab, Enter/Space on buttons)
- [ ] `aria-live="polite"` on banner for screen reader announcement

---

## Output

### For Each Finding

Report the following:

| Field | Content |
|-------|---------|
| **Severity** | Critical / High / Medium / Low |
| **Category** | OWASP category or custom (PII, Secrets, etc.) |
| **File** | Full file path with line number |
| **Description** | What was found |
| **Risk** | What an attacker could exploit |
| **Fix** | Specific code change required |

### Severity Definitions

| Severity | Definition | Action |
|----------|------------|--------|
| **Critical** | Exploitable vulnerability, secret exposure, PII leak | **Fix immediately** — block release |
| **High** | Security weakness that could be exploited with effort | **Fix before release** |
| **Medium** | Defense-in-depth gap, not directly exploitable | **Fix in current sprint** |
| **Low** | Best practice deviation, hardening opportunity | **Track for future improvement** |

### Action Required

- **Critical and High findings**: Fix immediately in the current session
- **Medium findings**: Fix if time permits, otherwise document in a tracking issue
- **Low findings**: Document for future improvement

After fixing all Critical and High findings, confirm the codebase is ready for:
1. Production deployment
2. Penetration testing
3. Public repository exposure