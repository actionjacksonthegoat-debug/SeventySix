# Third-Party Action Risk Register

> **Purpose:** Documents every non-`actions/` GitHub Actions action used in `.github/workflows/`. All entries are SHA-pinned. This register supports periodic supply-chain audits and incident response.
>
> **Audit schedule:** Review quarterly or after any CVE disclosure for a listed action. Dependabot is configured to auto-raise PRs for `github-actions` ecosystem updates (see `.github/dependabot.yml`).

---

## Register

| Action | Pinned SHA | Human-Readable Version | Last Audited | Owner | Risk Level | Mitigation |
| -------- | ----------- | ---------------------- | ------------- | ----- | ----------- | ----------- |
| `appleboy/ssh-action` | `0ff4204d59e8e51228ff73bce53f80d53301dee2` | v1.2.0 | 2026-04-22 | Single maintainer (appleboy) | Medium | SHA-pinned. Action only executes explicit SSH commands defined in this workflow — no arbitrary code execution on the runner. Widely adopted (10K+ stars). Monitor for maintainer changes. |
| `gitleaks/gitleaks-action` | `ff98106e4c7b2bc287b24eaf42907196329070c7` | v2.3.9 | 2026-04-22 | Gitleaks (gitleaks.io) | Low | SHA-pinned. Open-source, auditable. Runs read-only analysis of the checkout. No network egress for scan results. |
| `codecov/codecov-action` | `671740ac38dd9b0130fbe1cec585b89eea48d3de` | v5.4.3 | 2026-04-22 | Codecov (commercial, Sentry-owned) | Low | SHA-pinned. Uploads coverage to codecov.io over HTTPS. Token scoped to upload-only. Step has `continue-on-error: true` so Codecov service outages do not block CI. |
| `EnricoMi/publish-unit-test-result-action` | `c950f6fb443cb5af20a377fd0dfaa78838901040` | v2.19.0 | 2026-04-22 | Single maintainer (EnricoMi) | Medium | SHA-pinned. Reads `.trx` test result files and posts a PR comment. Requires `checks: write` and `pull-requests: write` scoped to the `server-build` job only. Monitor for maintainer changes. |
| `aquasecurity/trivy-action` | `76071ef0d7ec797419534a183b498b4d6366cf37` | v0.31.0 | 2026-04-22 | Aqua Security (commercial) | Low | SHA-pinned. Runs container vulnerability scanning locally — no data sent to external services unless Aqua DB update is triggered. Well-maintained, widely adopted. |
| `anchore/sbom-action` | `e22c389904149dbc22b58101806040fa8d37a610` | v0.18.0 | 2026-04-22 | Anchore (commercial, Cisco-owned) | Low | SHA-pinned. Generates SBOM artifact from container image. Read-only analysis, no network egress for SBOM data. |
| `ossf/scorecard-action` | `4eaacf0543bb3f2c246792bd56e8cdeffafb205a` | v2.4.2 | 2026-04-22 | OpenSSF (Linux Foundation) | Low | SHA-pinned. Runs OpenSSF Scorecard supply-chain health checks. Token scoped to `security-events: write` (per-job) and `id-token: write` (for OIDC attestation). |
| `github/codeql-action/init` | `0d579ffd059c29b07949a3cce3983f0780820c98` | v4 | 2026-04-22 | GitHub (Microsoft) | Low | SHA-pinned. First-party GitHub action for CodeQL static analysis. Minimal supply-chain risk. |
| `github/codeql-action/analyze` | `0d579ffd059c29b07949a3cce3983f0780820c98` | v4 | 2026-04-22 | GitHub (Microsoft) | Low | SHA-pinned. First-party GitHub action for CodeQL results upload. Minimal supply-chain risk. |
| `actions/github-script` | `60a0d83039c74a4aee543508d2ffcb1c3799cdea` | v7 | 2026-04-22 | GitHub (Microsoft) | Low | SHA-pinned. Used only in rollback job to create a GitHub issue on failure. Script is inline and auditable. Requires `issues: write` scoped to the rollback job only. |

---

## Audit Procedure

1. Check each action's GitHub repository for new releases or security advisories.
2. If a new release is available, review the changelog for security fixes or breaking changes.
3. Update the SHA pin in the relevant workflow file(s) and record the new SHA + version here.
4. Update the `Last Audited` date in this register.
5. Re-run `node scripts/audit-workflows.mjs` to confirm the new SHA is a valid 40-char hex pin.

## SSH Key Rotation Procedure

See [Deployment.md — SSH Key Rotation](Deployment.md#ssh-key-rotation) for the full procedure for rotating `PROD_SSH_KEY`.

## Adding New Third-Party Actions

Before adding a new non-`actions/` action:

1. Assess the action's owner (commercial vs. single maintainer), star count, and maintenance cadence.
2. Always use a full 40-character commit SHA pin — never a mutable tag like `@v1` or `@main`.
3. Scope the minimum necessary permissions to the job, not the top-level workflow.
4. Add an entry to this register on the day of first use.
5. Run `node scripts/audit-workflows.mjs` to confirm the SHA format is correct.
