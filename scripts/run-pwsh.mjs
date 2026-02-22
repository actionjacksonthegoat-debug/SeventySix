#!/usr/bin/env node
// run-pwsh.mjs — Cross-platform PowerShell 7 runner for npm scripts.
// Resolves pwsh from PATH or known Windows install locations.
// On Linux/macOS, 'pwsh' must be on PATH (bootstrap.sh installs it).
//
// Usage in package.json:
//   "start": "node scripts/run-pwsh.mjs -File scripts/start-dev.ps1"

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

const args = process.argv.slice(2);

let pwsh = 'pwsh';

if (platform() === 'win32') {
    // Check PATH first (works after a fresh terminal with proper PATH)
    const fromPath = spawnSync('where', ['pwsh'], { encoding: 'utf8' });
    if (fromPath.status === 0 && fromPath.stdout.trim()) {
        pwsh = fromPath.stdout.trim().split('\n')[0].trim();
    } else {
        // Fall back to known install locations (works when PATH isn't refreshed)
        const candidates = [
            'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
            'C:\\Program Files\\PowerShell\\7-preview\\pwsh.exe',
        ];
        const found = candidates.find(p => existsSync(p));
        if (found) {
            pwsh = found;
        } else {
            console.error('[ERROR] PowerShell 7 not found. Run: scripts\\bootstrap.cmd');
            process.exit(1);
        }
    }
}

const result = spawnSync(pwsh, ['-ExecutionPolicy', 'Bypass', ...args], {
    stdio: 'inherit',
    shell: false,
});

process.exit(result.status ?? 1);
