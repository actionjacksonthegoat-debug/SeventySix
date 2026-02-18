#!/usr/bin/env node
// bootstrap.mjs — Cross-platform npm run bootstrap dispatcher.
// Node.js is guaranteed to be present when npm is available.
// Picks bootstrap.cmd (Windows) or bootstrap.sh (Linux/macOS) and runs it.

import { spawnSync } from 'child_process';
import { platform } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chmodSync, existsSync } from 'fs';

const dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (platform() === 'win32') {
    const cmd = join(dir, 'bootstrap.cmd');
    const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
    process.exit(result.status ?? 1);
} else {
    const sh = join(dir, 'bootstrap.sh');
    // Ensure execute bit is set (git may strip it on clone)
    if (existsSync(sh)) {
        try { chmodSync(sh, 0o755); } catch { /* ignore */ }
    }
    const result = spawnSync('bash', [sh, ...args], { stdio: 'inherit' });
    process.exit(result.status ?? 1);
}
