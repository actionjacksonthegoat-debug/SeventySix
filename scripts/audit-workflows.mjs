#!/usr/bin/env node
/**
 * @fileoverview GitHub Actions workflow security audit script.
 *
 * Validates every `.github/workflows/*.yml` against project security policy:
 *   1. Every workflow has a top-level `permissions:` block.
 *   2. No third-party action uses a mutable tag reference — only 40-char hex SHA pins are allowed.
 *   3. Every `continue-on-error:` with a truthy value must have an inline `# justification:` comment.
 *   4. Every workflow that triggers on `push: branches: [master]` has a `concurrency:` block.
 *
 * Run:  node scripts/audit-workflows.mjs
 * Exit: 0 = all checks pass, 1 = one or more failures.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_DIR = resolve(__dirname, '../.github/workflows');

/** Matches a 40-character lowercase hex SHA (Git commit hash). */
const SHA_PATTERN = /^[0-9a-f]{40}$/i;

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

    // ── Check 1: top-level permissions block ──────────────────────────────────
    // The block must appear at column 0 (not indented), confirming it is top-level.
    const hasTopLevelPermissions = lines.some((l) => /^permissions:/.test(l) || /^permissions:\s*\{\}/.test(l));
    if (!hasTopLevelPermissions) {
        fail(name, 'Missing top-level permissions: block — add "permissions: {}" or a minimal set');
    } else {
        pass(name, 'Has top-level permissions: block');
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
console.log(`─────────────────────────────────────────────`);
console.log(`Audit complete: ${failures} failure(s) found`);
console.log(`─────────────────────────────────────────────`);

if (failures > 0) {
    process.exit(1);
}
