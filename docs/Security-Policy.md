# SeventySix Ecosystem Security Policy

> Authoritative security posture and reporting policy for the SeventySix Ecosystem
> (server, Angular client, both commerce sites, shared library, infrastructure).

---

## Reporting a Vulnerability

If you discover a security vulnerability in any SeventySix project, **please do NOT
open a public GitHub issue**. Instead:

1. Use GitHub's [Private Vulnerability Reporting](https://github.com/actionjacksonthegoat-debug/SeventySix/security/advisories/new)
   feature on this repository.
2. Provide:
   - A clear description of the vulnerability and its impact (sensitive data,
     auth bypass, code execution, etc.).
   - Reproduction steps or a proof-of-concept.
   - The affected project (`SeventySix.Server`, `SeventySix.Client`,
     `ECommerce/seventysixcommerce-sveltekit`, `ECommerce/seventysixcommerce-tanstack`,
     `ECommerce/seventysixcommerce-shared`, infrastructure files, or CI workflows).
   - Your suggested mitigation if you have one.
3. Allow up to **5 business days** for an acknowledgement and **30 days** for a
   coordinated disclosure timeline. Critical issues affecting customer data or
   payment flows will be triaged within **24 hours**.

We will credit you in the resulting security advisory unless you request anonymity.

---

## Scope

The following **are** in scope:

- All code in this repository (server, client, both commerce apps, shared library).
- GitHub Actions workflows in [.github/workflows/](../.github/workflows/).
- Container images published to GHCR under
  `ghcr.io/actionjacksonthegoat-debug/seventysixcommerce-*`.
- Production infrastructure files: [docker-compose.production.yml](../docker-compose.production.yml),
  [docker-compose.seventysixcommerce.yml](../docker-compose.seventysixcommerce.yml),
  [Caddyfile.production](../Caddyfile.production),
  [Caddyfile.seventysixcommerce](../Caddyfile.seventysixcommerce).

The following are **out of scope** (please do not test against them):

- Production hostnames or third-party services (Stripe, Printful, Brevo) —
  test against your own sandbox accounts only.
- Denial-of-service or volumetric attacks against any deployed environment.
- Social engineering of repository owners or maintainers.

---

## Supply Chain Hardening

The Ecosystem follows the [OpenSSF Scorecard](https://github.com/ossf/scorecard)
recommendations. Current controls:

| Control | Mechanism |
| ------- | --------- |
| Token-Permissions | All workflows declare `permissions:` at top level (least-privilege baseline of `contents: read`) and per-job (writes only at the job that needs them). Audited by [scripts/audit-workflows.mjs](../scripts/audit-workflows.mjs). |
| Pinned-Dependencies | All `uses:` action references are pinned by commit SHA. All Dockerfile `FROM` lines are pinned by `@sha256:<digest>`. Server projects use `packages.lock.json` files (`<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>` in [SeventySix.Server/Directory.Build.props](../SeventySix.Server/Directory.Build.props)) and CI restores with `--locked-mode`. Node packages use `package-lock.json` + `npm ci`. |
| Branch-Protection | The `master` branch requires a pull request, all required CI checks (Quality Gate, Commerce Quality Gate, CodeQL, Scorecard, Dependency Review) must pass, and at least one approving review from a CODEOWNER. Force-push and direct push are blocked. |
| Code-Review | [CODEOWNERS](../.github/CODEOWNERS) declares a global fallback owner plus path-specific reviewers for security-sensitive areas. |
| Fuzzing | Continuous fuzzing of the `LogEvent` deserialization surface via [ClusterFuzzLite](https://google.github.io/clusterfuzzlite/) on every PR. Configuration in [.clusterfuzzlite/](../.clusterfuzzlite/) and the workflow in [.github/workflows/fuzz.yml](../.github/workflows/fuzz.yml). |
| CII-Best-Practices | The badge below tracks our [OpenSSF Best Practices](https://www.bestpractices.dev/) self-assessment. Application is in progress; the badge will be wired up once the questionnaire is approved. |
| Static analysis | CodeQL on every PR via [.github/workflows/codeql.yml](../.github/workflows/codeql.yml) (C#, JavaScript/TypeScript). |
| Secret scanning | Gitleaks runs on every PR in the Security Scan job of [ci.yml](../.github/workflows/ci.yml). |
| Dependency review | [.github/workflows/dependency-review.yml](../.github/workflows/dependency-review.yml) blocks PRs that introduce known vulnerable dependencies. |
| Container scanning | Trivy SARIF scans run after every commerce image publish via [reusable-container-scan.yml](../.github/workflows/reusable-container-scan.yml). |
| DAST | OWASP ZAP scans the running stack on a schedule via [dast.yml](../.github/workflows/dast.yml). |
| SBOM | Anchore SBOM action emits SPDX JSON for every published commerce image (see the `publish` job in [seventysixcommerce-ci.yml](../.github/workflows/seventysixcommerce-ci.yml)). |

---

## OpenSSF Best Practices Badge

> Status: **application in progress**.
>
> Once the badge is awarded, the Markdown placeholder in [README.md](../README.md)
> will be replaced with the live badge URL from
> `https://www.bestpractices.dev/projects/<id>`.

---

## Security Contact

GitHub: [@actionjacksonthegoat-debug](https://github.com/actionjacksonthegoat-debug)

Use Private Vulnerability Reporting for all sensitive disclosures.
