#!/usr/bin/env node
/**
 * run-lighthouse.mjs
 * Builds the Angular app in production mode, serves it locally,
 * runs Lighthouse, and reports whether all categories hit the target score.
 *
 * Usage:
 *   node scripts/run-lighthouse.mjs              # default threshold: 70
 *   node scripts/run-lighthouse.mjs --threshold=75   # custom threshold
 *   node scripts/run-lighthouse.mjs --skip-build     # reuse last build
 *
 * Output:
 *   lighthouse-reports/report.html  (human-readable)
 *   lighthouse-reports/report.json  (machine-readable, for CI)
 */

import { execSync, execFileSync, spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = join(__dirname, "..");
const reportsDir = join(clientRoot, "lighthouse-reports");
const port = 4299;
const url = `http://localhost:${port}`;

// Parse CLI flags
const args = process.argv.slice(2);
const threshold = parseInt(
  args.find((argument) => argument.startsWith("--threshold="))?.split("=")[1] ?? "70",
  10,
);
const skipBuild = args.includes("--skip-build");

// Ensure output directory exists
if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

// ── Step 1: Build ─────────────────────────────────────────────────────────────
if (!skipBuild) {
  console.log("\n📦  Building production bundle…");
  execSync("npx ng build --configuration production", {
    cwd: clientRoot,
    stdio: "inherit",
  });
}

const distDir = join(clientRoot, "dist", "SeventySix.Client", "browser");
if (!existsSync(distDir)) {
  console.error(`\n❌  Build output not found at: ${distDir}`);
  process.exit(1);
}

// ── Step 2: Start static server ───────────────────────────────────────────────
console.log(`\n🌐  Starting static server on port ${port}…`);
const server = spawn(
  "npx",
  ["serve", distDir, "--listen", String(port), "--single"],
  // stdio:"ignore" prevents Node stream handles from keeping the event loop open.
  // shell:true is required on Windows for npx to resolve correctly.
  { cwd: clientRoot, stdio: "ignore", shell: true },
);
// Unref the child so Node doesn't wait for it to exit before terminating.
server.unref();

const killServer = () => {
  if (process.platform === "win32") {
    // On Windows, SIGTERM through a shell wrapper does NOT propagate to the
    // serve child. Use taskkill /F /T to force-kill the full process tree.
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: "ignore" });
    } catch (_) {
      // ignore — process may already be gone
    }
  } else {
    try {
      server.kill("SIGTERM");
    } catch (_) {
      // ignore
    }
  }
};

process.on("exit", killServer);
process.on("SIGINT", () => { killServer(); process.exit(130); });

// Wait for server to be ready (poll for up to 30 s)
console.log("⏳  Waiting for server to be ready…");
await new Promise((resolve, reject) => {
  const start = Date.now();
  const check = async () => {
    try {
      const { default: http } = await import("http");
      http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) return resolve(null);
        setTimeout(check, 500);
      }).on("error", () => {
        if (Date.now() - start > 30_000) return reject(new Error("Server did not start in 30 s"));
        setTimeout(check, 500);
      });
    } catch {
      setTimeout(check, 500);
    }
  };
  check();
});
console.log("✅  Server ready.");

// ── Step 3: Run Lighthouse ────────────────────────────────────────────────────
console.log(`\n🔦  Running Lighthouse against ${url}…`);
const reportBase = join(reportsDir, "report");
try {
  execFileSync(
    "npx",
    [
      "lighthouse",
      url,
      "--output=html,json",
      `--output-path=${reportBase}`,
      "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
      "--quiet",
    ],
    { cwd: clientRoot, stdio: "inherit", shell: true },
  );
} catch (err) {
  // Lighthouse may exit non-zero on Windows due to an EPERM error deleting its
  // temp Chrome user-data directory (a known Windows/sandboxing quirk).
  // The report files are written before cleanup, so we continue if they exist.
  const reportJsonPath = `${reportBase}.report.json`;
  if (!existsSync(reportJsonPath)) {
    console.error("\n❌  Lighthouse failed and no report was produced.");
    console.error(err.message);
    killServer();
    process.exit(1);
  }
  console.warn("\n⚠️  Lighthouse exited with an error (likely EPERM temp-dir cleanup on Windows) — report was generated, continuing.");
} finally {
  killServer();
}

// ── Step 4: Parse + print results ─────────────────────────────────────────────
const { readFileSync } = await import("fs");
const reportJson = JSON.parse(readFileSync(`${reportBase}.report.json`, "utf8"));

const categories = {
  performance: reportJson.categories.performance?.score,
  accessibility: reportJson.categories.accessibility?.score,
  "best-practices": reportJson.categories["best-practices"]?.score,
  seo: reportJson.categories.seo?.score,
  pwa: reportJson.categories.pwa?.score,
};

console.log("\n╔══════════════════════════════════════╗");
console.log("║       LIGHTHOUSE SCORES              ║");
console.log("╠══════════════════════════════════════╣");

let allPassed = true;
for (const [cat, score] of Object.entries(categories)) {
  if (score == null) continue;
  const pct = Math.round(score * 100);
  const icon = pct >= threshold ? "✅" : "❌";
  if (pct < threshold) allPassed = false;
  console.log(`║  ${icon}  ${cat.padEnd(18)} ${String(pct).padStart(3)}/100  ║`);
}
console.log("╚══════════════════════════════════════╝");
console.log(`\nThreshold: ${threshold}/100`);
console.log(`\nFull report: ${reportBase}.report.html`);

if (!allPassed) {
  console.error(`\n❌  One or more categories are below ${threshold}. See report for details.`);
  killServer();
  process.exit(1);
}

console.log(`\n✅  All categories ≥ ${threshold}!`);
killServer();
process.exit(0);