#!/usr/bin/env node
/**
 * @fileoverview GitHub Actions workflow + supply-chain security audit.
 *
 * Validates every `.github/workflows/*.yml` and every Dockerfile / install script
 * against project security policy. Implements OpenSSF Scorecard "Token-Permissions"
 * and "Pinned-Dependencies" guidance.
 *
 * Workflow checks:
 *   1. Top-level `permissions:` block exists AND is exactly `contents: read`,
 *      `permissions: {}`, or `permissions: read-all` (scorecard.yml only).
 *   2. Every job has its own `permissions:` block (defence-in-depth — Scorecard
 *      Token-Permissions requires this in addition to top-level).
 *   3. Any job that requests a `: write` scope must be justified by a matching
 *      entry in `scripts/workflow-permissions-allowlist.json`.
 *   4. No third-party action uses a mutable tag reference — only 40-char hex SHA pins.
 *   5. Every `continue-on-error:` with a truthy value must have a `# justification:` comment.
 *   6. Workflows triggered on `push: branches: [master]` must have a `concurrency:` block.
 *
 * Pinned-deps checks:
 *   7. Every Dockerfile `FROM` line must use `@sha256:<digest>` (Scorecard Pinned-Dependencies).
 *   8. Every install command in `scripts/**` (`npm install`, `apt-get install`, `pip install`)
 *      must either pin versions or be excused via `scripts/pinned-deps-allowlist.json`.
 *
 * Run:  node scripts/audit-workflows.mjs
 * Exit: 0 = all checks pass, 1 = one or more failures.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const WORKFLOWS_DIR = resolve(__dirname, '../.github/workflows');
const PERMISSIONS_ALLOWLIST_PATH = resolve(__dirname, 'workflow-permissions-allowlist.json');
const PINNED_DEPS_ALLOWLIST_PATH = resolve(__dirname, 'pinned-deps-allowlist.json');

/** Matches a 40-character lowercase hex SHA (Git commit hash). */
const SHA_PATTERN = /^[0-9a-f]{40}$/i;
/** Matches a Docker image digest pin (`@sha256:<64-hex>`). */
const DOCKER_DIGEST_PATTERN = /@sha256:[0-9a-f]{64}/i;

/**
 * Loads a JSON allowlist file. Returns an empty array if missing or invalid.
 * @param {string} path - Absolute path to the JSON file.
 * @returns {Array<object>} Parsed allowlist entries.
 */
function loadAllowlist(path) {
    if (!existsSync(path)) {
        return [];
    }
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return [];
    }
}

const permissionsAllowlist = loadAllowlist(PERMISSIONS_ALLOWLIST_PATH);
const pinnedDepsAllowlist = loadAllowlist(PINNED_DEPS_ALLOWLIST_PATH);

let failures = 0;

/**
 * Records a failure for a workflow file.
 * @param {string} file - Workflow filename.
 * @param {string} message - Description of the violation.
 */
function fail(file, message) {
    console.error(`FAIL  [${file}] ${message}`);
    failures++;
}

/**
 * Records a passing check.
 * @param {string} file - Workflow filename.
 * @param {string} message - Description of the check.
 */
function pass(file, message) {
    console.log(`PASS  [${file}] ${message}`);
}

const workflowFiles = readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => ({ name: f, path: join(WORKFLOWS_DIR, f) }));

console.log(`Auditing ${workflowFiles.length} workflow file(s) in ${WORKFLOWS_DIR}\n`);

for (const { name, path } of workflowFiles) {
    const content = readFileSync(path, 'utf-8');
    const lines = content.split('\n');

    // ── Check 1: top-level permissions block must be tight ───────────────────
    // Acceptable forms:
    //   permissions: {}              (workflow needs no token scope)
    //   permissions: read-all        (read-only consumer; scorecard uses this)
    //   permissions:\n  contents: read   (default least-privilege baseline)
    // Anything else at top-level fails — defence in depth: workflow-wide writes
    // must be opted-in only at the job that needs them (see Check 5/6).
    const topLevel = parseTopLevelPermissions(content);
    if (!topLevel.present) {
        fail(name, 'Missing top-level permissions: block — add "permissions: contents: read" or "permissions: {}"');
    } else if (topLevel.empty || topLevel.readAll) {
        pass(name, `Top-level permissions: ${topLevel.empty ? '{}' : 'read-all'}`);
    } else if (topLevel.scopes.length === 1 && topLevel.scopes[0] === 'contents: read') {
        pass(name, 'Top-level permissions: contents: read');
    } else {
        fail(
            name,
            `Top-level permissions: block must be exactly "contents: read", "{}", or "read-all" — extra scopes (${topLevel.scopes.join(', ')}) belong in the specific job that needs them`,
        );
    }

    // ── Check 5: every job must declare its own permissions: block ───────────
    // Reusable workflows (workflow_call) are exempt at the caller — but the
    // reusable workflow file itself must still declare per-job permissions.
    const jobs = parseJobs(content);
    for (const job of jobs) {
        if (!job.hasPermissionsBlock && !job.usesReusableWorkflow) {
            fail(
                name,
                `Line ${job.startLine}: job '${job.id}' has no permissions: block — add an explicit minimal scope`,
            );
        }

        // ── Check 6: any : write scope must be justified by allowlist ────────
        for (const writeScope of job.writeScopes) {
            const allowed = permissionsAllowlist.some(
                (entry) =>
                    entry.workflow === name &&
                    (entry.job === job.id || entry.job === '*') &&
                    entry.scope.includes(`${writeScope}: write`),
            );
            if (!allowed) {
                fail(
                    name,
                    `Line ${job.startLine}: job '${job.id}' requests '${writeScope}: write' without a justification entry in scripts/workflow-permissions-allowlist.json`,
                );
            }
        }
    }

    // ── Check 2: all external action references must be SHA-pinned ────────────
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match lines with `uses: <something>` (indented — i.e. inside a step or job)
        const usesMatch = line.match(/^\s+uses:\s+(\S+)/);
        if (!usesMatch) continue;

        const ref = usesMatch[1];

        // Skip local reusable workflow references (start with ./ or /)
        if (ref.startsWith('./') || ref.startsWith('/')) continue;

        // An action reference must contain @ to specify a version
        const atIdx = ref.indexOf('@');
        if (atIdx === -1) continue;

        const actionPath = ref.substring(0, atIdx);
        const actionRef = ref.substring(atIdx + 1);

        if (!SHA_PATTERN.test(actionRef)) {
            fail(
                name,
                `Line ${i + 1}: action '${actionPath}' uses mutable ref '@${actionRef}' — pin to a full 40-char commit SHA`,
            );
        }
    }

    // ── Check 3: continue-on-error with truthy value must have justification ──
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('continue-on-error:')) continue;

        const valueMatch = line.match(/continue-on-error:\s*(.+)/);
        if (!valueMatch) continue;

        const rawValue = valueMatch[1].trim();

        // Strip inline comment to isolate the YAML value
        const commentIdx = rawValue.indexOf('#');
        const yamlValue = (commentIdx !== -1 ? rawValue.substring(0, commentIdx) : rawValue).trim();

        // `false` is always fine — the step will fail normally
        if (yamlValue === 'false') continue;

        // Any other value (true, expression) requires a justification comment
        if (!line.includes('# justification:')) {
            fail(
                name,
                `Line ${i + 1}: continue-on-error: '${yamlValue}' has no inline "# justification:" comment — add one explaining why this step may be allowed to fail`,
            );
        }
    }

    // ── Check 4: workflows that trigger on master push must have concurrency ──
    // Detect push triggers targeting master (inline array or block list form)
    const triggersMasterPush =
        /on:\s*\n(?:\s+\w[^\n]*\n)*?\s+push:\s*\n(?:\s+[^\n]*\n)*?\s+branches:\s*\[?[^\]]*\bmaster\b/m.test(
            content,
        );

    if (triggersMasterPush) {
        const hasConcurrency = /^concurrency:/m.test(content);
        if (!hasConcurrency) {
            fail(name, 'Workflow triggers on master push but has no top-level concurrency: block');
        } else {
            pass(name, 'Has concurrency: block (required for master-push workflows)');
        }
    }
}

console.log('');
console.log('─────────────────────────────────────────────');
console.log('Pinned-Dependencies audit');
console.log('─────────────────────────────────────────────');

auditDockerfiles(REPO_ROOT);
auditScriptInstalls(resolve(REPO_ROOT, 'scripts'));

console.log('');
console.log(`─────────────────────────────────────────────`);
console.log(`Audit complete: ${failures} failure(s) found`);
console.log(`─────────────────────────────────────────────`);

if (failures > 0) {
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses the top-level `jobs:` map of a workflow YAML and returns one descriptor
 * per job. Uses indentation heuristics — adequate for our schema-conformant files.
 *
/**
 * Parse the top-level `permissions:` block of a workflow file.
 *
 * @param {string} content - Full workflow file contents.
 * @returns {{ present: boolean, empty: boolean, readAll: boolean, scopes: string[] }}
 *   `scopes` is the list of "scope: value" entries (e.g., "contents: read").
 */
function parseTopLevelPermissions(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(/^permissions:\s*(.*)$/);
        if (!m) continue;
        // Strip trailing YAML comment (e.g. `permissions: {} # explanatory note`).
        const inline = m[1].replace(/\s+#.*$/, '').trim();
        if (inline === '{}') return { present: true, empty: true, readAll: false, scopes: [] };
        if (inline === 'read-all') return { present: true, empty: false, readAll: true, scopes: [] };
        if (inline.length > 0) {
            // Inline mapping form like `permissions: read-all` already handled;
            // anything else (e.g. inline list) is unexpected — treat as scopes.
            return { present: true, empty: false, readAll: false, scopes: [inline] };
        }
        // Multi-line form — collect indented `scope: value` entries.
        const scopes = [];
        for (let j = i + 1; j < lines.length; j++) {
            const next = lines[j];
            if (/^\S/.test(next)) break; // de-indented; block ends
            if (next.trim() === '') continue;
            const sm = next.match(/^\s+([\w-]+):\s*([\w-]+)\s*$/);
            if (sm) scopes.push(`${sm[1]}: ${sm[2]}`);
            else break;
        }
        return { present: true, empty: false, readAll: false, scopes };
    }
    return { present: false, empty: false, readAll: false, scopes: [] };
}

/**
 * Parse the `jobs:` section of a workflow file into structured records.
 *
 * @param {string} content - Full workflow file contents.
 * @returns {Array<{ id: string, startLine: number, hasPermissionsBlock: boolean, writeScopes: string[], usesReusableWorkflow: boolean }>}
 */
function parseJobs(content) {    const lines = content.split('\n');
    const jobs = [];
    let inJobs = false;
    let jobIndent = -1;
    let current = null;
    let currentBodyIndent = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const stripped = line.trimEnd();

        if (/^jobs:\s*$/.test(stripped)) {
            inJobs = true;
            continue;
        }
        if (!inJobs) continue;

        // Detect a top-level token that is NOT indented (would terminate jobs:)
        if (/^[a-zA-Z]/.test(line)) {
            if (current) jobs.push(current);
            current = null;
            inJobs = false;
            continue;
        }

        const indent = line.length - line.trimStart().length;
        const jobIdMatch = line.match(/^(\s+)([a-zA-Z][a-zA-Z0-9_-]*):\s*$/);
        if (jobIdMatch) {
            const thisIndent = jobIdMatch[1].length;
            if (jobIndent === -1) jobIndent = thisIndent;
            // Only treat as a job header if at the established jobs indent level.
            if (thisIndent === jobIndent) {
                if (current) jobs.push(current);
                current = {
                    id: jobIdMatch[2],
                    startLine: i + 1,
                    hasPermissionsBlock: false,
                    writeScopes: [],
                    usesReusableWorkflow: false,
                };
                currentBodyIndent = -1;
                continue;
            }
        }

        if (!current) continue;

        // Establish the job-body indent the first time we see a property under the job
        const bodyMatch = line.match(/^(\s+)([a-zA-Z][a-zA-Z0-9_-]*):/);
        if (bodyMatch) {
            const bodyIndent = bodyMatch[1].length;
            if (bodyIndent > jobIndent && (currentBodyIndent === -1 || bodyIndent < currentBodyIndent)) {
                currentBodyIndent = bodyIndent;
            }
            if (bodyIndent === currentBodyIndent) {
                const key = bodyMatch[2];
                if (key === 'permissions') {
                    current.hasPermissionsBlock = true;
                    // Walk forward to collect any `<scope>: write` entries.
                    for (let j = i + 1; j < lines.length; j++) {
                        const innerLine = lines[j];
                        const innerIndent = innerLine.length - innerLine.trimStart().length;
                        if (innerLine.trim() === '') continue;
                        if (innerIndent <= bodyIndent) break;
                        const writeMatch = innerLine.match(/^\s+([a-z-]+):\s+write\b/);
                        if (writeMatch) {
                            current.writeScopes.push(writeMatch[1]);
                        }
                    }
                } else if (key === 'uses') {
                    // Reusable workflow caller — permissions inherited from caller block
                    current.usesReusableWorkflow = true;
                }
            }
        }
    }
    if (current) jobs.push(current);
    return jobs;
}

/**
 * Recursively walks a directory and yields absolute file paths matching the predicate.
 * Skips `node_modules`, `.git`, `dist`, `build`, `coverage`, `playwright-report`, and
 * the dependency-loading folders that legitimately contain unpinned downstream files.
 *
 * @param {string} dir - Root directory.
 * @param {(filePath: string) => boolean} predicate - Filter function.
 * @returns {Generator<string>} Matching file paths.
 */
function* walkFiles(dir, predicate) {
    const SKIP = new Set([
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        'playwright-report',
        'test-results',
        'TestResults',
        '.angular',
        '.svelte-kit',
        '.next',
        '.nuxt',
        '.tanstack',
        '.vite',
        'bin',
        'obj',
        'out',
    ]);
    if (!existsSync(dir)) return;
    const stack = [dir];
    while (stack.length > 0) {
        const cur = stack.pop();
        let entries;
        try {
            entries = readdirSync(cur);
        } catch {
            continue;
        }
        for (const entry of entries) {
            if (SKIP.has(entry)) continue;
            const full = join(cur, entry);
            let st;
            try {
                st = statSync(full);
            } catch {
                continue;
            }
            if (st.isDirectory()) {
                stack.push(full);
            } else if (predicate(full)) {
                yield full;
            }
        }
    }
}

/**
 * Audits every Dockerfile under the repo root for `@sha256:<digest>` pinning on
 * each `FROM` reference. Reports relative paths.
 *
 * @param {string} rootPath - Repository root.
 */
function auditDockerfiles(rootPath) {
    const dockerfiles = [
        ...walkFiles(rootPath, (p) => /(?:^|[\\/])Dockerfile(?:\.[^\\/]+)?$/.test(p)),
    ];
    if (dockerfiles.length === 0) {
        console.log('PASS  [docker] no Dockerfiles found to audit');
        return;
    }
    for (const file of dockerfiles) {
        const rel = relative(rootPath, file).replace(/\\/g, '/');
        const text = readFileSync(file, 'utf-8');
        const fromLines = text.split('\n').filter((l) => /^\s*FROM\s+/i.test(l) && !/^\s*FROM\s+scratch\b/i.test(l));
        let pinned = true;
        for (const line of fromLines) {
            // Allow `FROM <stage> AS <alias>` where <stage> is a previous-stage alias (no slash).
            const fromTarget = line.replace(/^\s*FROM\s+/i, '').split(/\s+/)[0];
            const isPreviousStageAlias = !fromTarget.includes('/') && !fromTarget.includes(':') && !fromTarget.includes('@');
            if (isPreviousStageAlias) continue;
            if (!DOCKER_DIGEST_PATTERN.test(line)) {
                fail(rel, `FROM line missing @sha256:<digest> pin: ${line.trim()}`);
                pinned = false;
            }
        }
        if (pinned && fromLines.length > 0) {
            pass(rel, `${fromLines.length} FROM line(s) pinned by digest`);
        }
    }
}

/**
 * Audits every shell/PowerShell/bash script under `scripts/` for unpinned
 * `npm install`, `apt-get install`, or `pip install` commands. An entry in
 * `scripts/pinned-deps-allowlist.json` shaped `{ file, line, command, reason }`
 * excuses a specific occurrence.
 *
 * @param {string} scriptsPath - Absolute path to the scripts directory.
 */
function auditScriptInstalls(scriptsPath) {
    if (!existsSync(scriptsPath)) {
        console.log('PASS  [scripts] no scripts directory to audit');
        return;
    }
    const scriptFiles = [
        ...walkFiles(scriptsPath, (p) => /\.(sh|ps1|cmd|bat|mjs|js)$/i.test(p)),
    ];
    // Skip this audit script itself — it contains the regex patterns it scans for.
    const SELF_PATH = fileURLToPath(import.meta.url);
    for (const file of scriptFiles) {
        if (file === SELF_PATH) continue;
        const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
        const lines = readFileSync(file, 'utf-8').split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

            // npm install (NOT npm ci, NOT npm install -g <pinned>, NOT --no-package-lock)
            if (/\bnpm\s+install\b/.test(line) && !/--no-package-lock/.test(line)) {
                const allowed = pinnedDepsAllowlist.some(
                    (e) => e.file === rel && e.line === i + 1 && e.command === 'npm install',
                );
                if (!allowed) {
                    fail(rel, `Line ${i + 1}: 'npm install' without lockfile guard — use 'npm ci' or pin via allowlist`);
                }
            }
            // apt-get install must specify =<version>
            if (/\bapt-get\s+install\b/.test(line)) {
                const hasVersionPin = /=[0-9]/.test(line);
                if (!hasVersionPin) {
                    const allowed = pinnedDepsAllowlist.some(
                        (e) => e.file === rel && e.line === i + 1 && e.command === 'apt-get install',
                    );
                    if (!allowed) {
                        fail(rel, `Line ${i + 1}: 'apt-get install' without =<version> pin`);
                    }
                }
            }
            // pip install must specify ==<version>
            if (/\bpip3?\s+install\b/.test(line) && !/-r\s+/.test(line)) {
                const hasVersionPin = /==[0-9]/.test(line);
                if (!hasVersionPin) {
                    const allowed = pinnedDepsAllowlist.some(
                        (e) => e.file === rel && e.line === i + 1 && e.command === 'pip install',
                    );
                    if (!allowed) {
                        fail(rel, `Line ${i + 1}: 'pip install' without ==<version> pin or -r requirements file`);
                    }
                }
            }
        }
    }
}
