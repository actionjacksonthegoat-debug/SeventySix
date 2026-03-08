import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
	buildNaturalMousePath,
	buildTypingDelays,
	computeStepCount,
	createSeededRandom,
	pickTargetPoint,
} from "./walkthrough/human-interaction.mjs";
import {
	resolveDwellDuration,
	shouldAvoidDirectNavigation,
} from "./walkthrough/flow.mjs";
import {
	retryAsync,
	resolveFirstVisibleCandidate,
} from "./walkthrough/reliability.mjs";

// ─── Safety guard ────────────────────────────────────────────────────────────
// This script targets a LOCAL DEV INSTANCE ONLY. It must never run against
// staging or production. The baseUrl is intentionally hardcoded to localhost.

// ─── Paths & config ─────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputRoot = path.join(repoRoot, ".dev-tools-output");
const screenshotDir = path.join(outputRoot, "screenshots");
const reportPath = path.join(outputRoot, "walkthrough-report.md");
const baseUrl = "https://localhost:4200";

// Enforce localhost-only at runtime — prevents accidental use against non-local targets.
const _parsedBaseUrl = new URL(baseUrl);
if (_parsedBaseUrl.hostname !== "localhost" && _parsedBaseUrl.hostname !== "127.0.0.1") {
	console.error(`[Safety] baseUrl must point to localhost. Got: ${baseUrl}`);
	process.exit(1);
}

// ─── Credentials ─────────────────────────────────────────────────────────────
// Admin credentials come from dotnet user-secrets (AdminSeeder:Email / InitialPassword),
// exported as ADMIN_EMAIL / ADMIN_PASSWORD by load-user-secrets.ps1 when the dev
// stack starts via `npm run start`. No hardcoded values — run `npm start` first.
const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

if (!adminEmail || !adminPassword) {
	console.error(
		"[Error] Admin credentials not found in environment.\n" +
		"  Run 'npm start' first — it loads user secrets into ADMIN_EMAIL / ADMIN_PASSWORD."
	);
	process.exit(1);
}

// ─── Test user password ───────────────────────────────────────────────────────
// Password used for the ephemeral per-run test user. Not a real account — the
// user is created and discarded each walkthrough run.
const WALKTHROUGH_USER_PASSWORD = "WalkthroughDemo76!";

const runToken = `${Date.now()}`;
const walkthroughUserName = `walkthrough_test_user_${runToken}`;
const walkthroughUserEmail = `walkthrough_test_${runToken}@test.local`;
const TOTAL_STEPS = 22;
const randomSeed = process.env.WALKTHROUGH_SEED ?? `${Date.now()}`;
const randomFn = createSeededRandom(randomSeed);

// ─── State ──────────────────────────────────────────────────────────────────
const stepResults = [];
const screenshotIndex = [];
const consoleErrors = [];
const unexpectedBanners = [];

// ─── Timing constants (tune these for demo pacing) ──────────────────────────
const PAUSE_PAGE_LOAD = 2000;
const PAUSE_BETWEEN_ACTIONS = 800;
const PAUSE_BEFORE_SCREENSHOT = 600;
const PAUSE_AFTER_CLICK = 600;
const PAUSE_SCROLL = 400;
const TYPE_MIN_DELAY = 40;
const TYPE_MAX_DELAY = 130;


const mouseState = {
	position: { x: 300, y: 200 },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function nowIso() {
	return new Date().toISOString();
}

async function ensureOutputDirs() {
	await fs.mkdir(screenshotDir, { recursive: true });
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enableDemoPointer(page) {
	// addInitScript fires on EVERY new document (full navigations, reloads).
	// It injects both CSS and cursor element with a self-healing setInterval
	// that re-creates them if Angular or any framework removes them.
	await page.addInitScript(() => {
		const STYLE_ID = "walkthrough-demo-cursor-style";
		const CURSOR_ID = "walkthrough-demo-cursor";
		const CSS = `
			* { cursor: none !important; }
			#${CURSOR_ID} {
				position: fixed;
				top: 0;
				left: 0;
				width: 28px;
				height: 28px;
				border: 3px solid #0a84ff;
				border-radius: 50%;
				background: rgba(10, 132, 255, 0.18);
				box-shadow: 0 0 0 6px rgba(10, 132, 255, 0.08);
				transform: translate(-50%, -50%);
				z-index: 2147483647;
				pointer-events: none;
				transition: transform 90ms ease, background-color 120ms ease, box-shadow 120ms ease;
			}
			#${CURSOR_ID}.clicking {
				transform: translate(-50%, -50%) scale(0.88);
				background: rgba(10, 132, 255, 0.34);
				box-shadow: 0 0 0 10px rgba(10, 132, 255, 0.14);
			}
		`;

		function injectCursorElements() {
			const headTarget = document.head || document.documentElement;
			if (headTarget && !document.getElementById(STYLE_ID)) {
				const style = document.createElement("style");
				style.id = STYLE_ID;
				style.textContent = CSS;
				headTarget.appendChild(style);
			}
			const bodyTarget = document.body || document.documentElement;
			if (bodyTarget && !document.getElementById(CURSOR_ID)) {
				const cursor = document.createElement("div");
				cursor.id = CURSOR_ID;
				bodyTarget.appendChild(cursor);
			}
		}

		// Inject immediately (may be before body exists)
		injectCursorElements();
		// Inject again when DOM is ready
		document.addEventListener("DOMContentLoaded", injectCursorElements);
		// Self-healing loop — re-creates cursor if removed by framework routing
		setInterval(injectCursorElements, 150);
	});

	// Playwright-side backup: re-inject after every full page load
	page.on("load", async () => {
		try {
			await forceInjectCursor(page);
		} catch {
			// page may have closed or be navigating — ignore
		}
	});

	// Playwright-side backup: re-inject after SPA frame navigations
	page.on("framenavigated", async (frame) => {
		if (frame === page.mainFrame()) {
			try {
				await sleep(50);
				await forceInjectCursor(page);
			} catch {
				// page may have closed or be navigating — ignore
			}
		}
	});

	// Wait for page to be ready and place cursor at initial position
	await sleep(200);
	await forceInjectCursor(page);
	await page.mouse.move(mouseState.position.x, mouseState.position.y, { steps: 1 });
	await updateCursorPosition(page, mouseState.position);
}

/** Force-inject cursor element into the page (idempotent, crash-safe) */
async function forceInjectCursor(page) {
	try {
		await page.evaluate(() => {
			const CURSOR_ID = "walkthrough-demo-cursor";
			const STYLE_ID = "walkthrough-demo-cursor-style";
			if (!document.getElementById(STYLE_ID)) {
				const style = document.createElement("style");
				style.id = STYLE_ID;
				style.textContent = `
					* { cursor: none !important; }
					#${CURSOR_ID} {
						position: fixed; top: 0; left: 0;
						width: 28px; height: 28px;
						border: 3px solid #0a84ff; border-radius: 50%;
						background: rgba(10, 132, 255, 0.18);
						box-shadow: 0 0 0 6px rgba(10, 132, 255, 0.08);
						transform: translate(-50%, -50%);
						z-index: 2147483647; pointer-events: none;
						transition: transform 90ms ease, background-color 120ms ease, box-shadow 120ms ease;
					}
					#${CURSOR_ID}.clicking {
						transform: translate(-50%, -50%) scale(0.88);
						background: rgba(10, 132, 255, 0.34);
						box-shadow: 0 0 0 10px rgba(10, 132, 255, 0.14);
					}
				`;
				(document.head || document.documentElement).appendChild(style);
			}
			if (!document.getElementById(CURSOR_ID)) {
				const cursor = document.createElement("div");
				cursor.id = CURSOR_ID;
				(document.body || document.documentElement).appendChild(cursor);
			}
		});
	} catch {
		// page may be closed or navigating — ignore
	}
}

/** Update cursor element position (crash-safe) */
async function updateCursorPosition(page, position) {
	try {
		await page.evaluate((pos) => {
			const cursor = document.getElementById("walkthrough-demo-cursor");
			if (cursor) {
				cursor.style.left = `${pos.x}px`;
				cursor.style.top = `${pos.y}px`;
			}
		}, position);
	} catch {
		// page may be closed or navigating — ignore
	}
}

async function moveMouseHumanLike(page, destination, options = {}) {
	await forceInjectCursor(page);
	const dx = destination.x - mouseState.position.x;
	const dy = destination.y - mouseState.position.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const steps = options.steps ?? computeStepCount(distance);
	const route = buildNaturalMousePath(mouseState.position, destination, {
		steps,
	});
	for (const point of route) {
		await page.mouse.move(point.x, point.y, { steps: 1 });
		await updateCursorPosition(page, point);
	}
	mouseState.position = destination;
}

async function moveToLocator(page, locator) {
	await forceInjectCursor(page);
	const target = locator.first();
	const box = await target.boundingBox();
	if (box === null) {
		return;
	}
	const point = pickTargetPoint(box, randomFn);
	await moveMouseHumanLike(page, point);
}

/** Human-like typing — one character at a time with random cadence */
async function humanTypeLocator(locator, text) {
	const page = locator.page();
	await moveToLocator(page, locator);
	await locator.click();
	await sleep(200);
	const typingDelays = buildTypingDelays(text.length, {
		minDelay: TYPE_MIN_DELAY,
		maxDelay: TYPE_MAX_DELAY,
		randomFn,
	});
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		await locator.pressSequentially(char, { delay: 0 });
		await sleep(typingDelays[index]);
	}
}

/** Hover over an element, pause, then click — like a person would */
async function hoverThenClick(page, locator, pauseMs = PAUSE_BETWEEN_ACTIONS) {
	await forceInjectCursor(page);
	if (await locator.count() === 0) {
		return false;
	}
	const target = locator.first();
	if (!(await target.isVisible())) {
		return false;
	}
	await moveToLocator(page, target);
	await target.hover();
	await sleep(pauseMs);
	try {
		await page.evaluate(() => {
			const cursor = document.getElementById("walkthrough-demo-cursor");
			if (cursor) { cursor.classList.add("clicking"); }
		});
	} catch { /* navigating */ }
	await target.click();
	try {
		await page.evaluate(() => {
			const cursor = document.getElementById("walkthrough-demo-cursor");
			if (cursor) { cursor.classList.remove("clicking"); }
		});
	} catch { /* navigating */ }
	await sleep(PAUSE_AFTER_CLICK);
	return true;
}

async function gotoWithCursor(page, url, options = {}) {
	await page.goto(url, options);
	await page.waitForLoadState("domcontentloaded");
	await sleep(200);
	await forceInjectCursor(page);
	await updateCursorPosition(page, mouseState.position);
	await moveMouseHumanLike(page, { x: 220, y: 140 }, { steps: 18 });
	await sleep(300);
}

/** Navigate by clicking a sidebar link by its visible label text */
async function clickSidebarLink(page, label) {
	const sidebarLink = await resolveFirstVisibleCandidate([
		() => page.locator("nav.app-sidebar a[mat-list-item]").filter({ hasText: new RegExp(`^\\s*${label}\\s*$`, "i") }),
		() => page.getByRole("link", { name: new RegExp(label, "i") }),
	]);
	if (sidebarLink === null) {
		throw new Error(`Unable to locate sidebar link: ${label}`);
	}
	await hoverThenClick(page, sidebarLink, 500);
	await page.waitForTimeout(PAUSE_PAGE_LOAD);
}

/** Smooth scroll down the page in steps (scrolls .app-content container, not window) */
async function smoothScrollDown(page) {
	const dims = await page.evaluate(() => {
		const container = document.querySelector(".app-content") ?? document.scrollingElement ?? document.documentElement;
		return { clientHeight: container.clientHeight, scrollHeight: container.scrollHeight };
	});
	let maxScroll = dims.scrollHeight - dims.clientHeight;
	if (maxScroll <= 80) {
		await sleep(resolveDwellDuration({ viewportHeight: dims.clientHeight, scrollHeight: dims.scrollHeight }));
		return;
	}
	let scrolled = 0;
	const increment = Math.round(dims.clientHeight * 0.33);
	while (scrolled < maxScroll) {
		scrolled = Math.min(scrolled + increment, maxScroll);
		await page.evaluate((y) => {
			const container = document.querySelector(".app-content") ?? document.scrollingElement ?? document.documentElement;
			container.scrollTo({ top: y, behavior: "smooth" });
		}, scrolled);
		await sleep(PAUSE_SCROLL + 200);
		// Re-measure in case deferred content loaded
		const updated = await page.evaluate(() => {
			const container = document.querySelector(".app-content") ?? document.scrollingElement ?? document.documentElement;
			return { clientHeight: container.clientHeight, scrollHeight: container.scrollHeight };
		});
		const newMax = updated.scrollHeight - updated.clientHeight;
		if (newMax > maxScroll) {
			maxScroll = newMax;
		}
	}
	// Safety: ensure we're at absolute bottom
	await page.evaluate(() => {
		const container = document.querySelector(".app-content") ?? document.scrollingElement ?? document.documentElement;
		container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
	});
	await sleep(resolveDwellDuration({ viewportHeight: dims.clientHeight, scrollHeight: dims.scrollHeight }));
}

/** Smooth scroll back to top */
async function scrollToTop(page) {
	await page.evaluate(() => {
		const container = document.querySelector(".app-content") ?? document.scrollingElement ?? document.documentElement;
		container.scrollTo({ top: 0, behavior: "smooth" });
	});
	await sleep(PAUSE_SCROLL);
}

/** Scroll a specific element container (e.g. tab body content) */
async function smoothScrollContainer(page, selector) {
	const dims = await page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight };
	}, selector);
	if (!dims || dims.scrollHeight - dims.clientHeight <= 20) return;
	let maxScroll = dims.scrollHeight - dims.clientHeight;
	let scrolled = 0;
	const increment = Math.round(dims.clientHeight * 0.33);
	while (scrolled < maxScroll) {
		scrolled = Math.min(scrolled + increment, maxScroll);
		await page.evaluate(({ sel, y }) => {
			const el = document.querySelector(sel);
			if (el) el.scrollTo({ top: y, behavior: "smooth" });
		}, { sel: selector, y: scrolled });
		await sleep(PAUSE_SCROLL + 100);
	}
	// Scroll back to top
	await page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (el) el.scrollTo({ top: 0, behavior: "smooth" });
	}, selector);
	await sleep(300);
}

async function showFullPageContext(page) {
	try {
		await forceInjectCursor(page);
		await smoothScrollDown(page);
		await scrollToTop(page);
	} catch {
		// page may have closed or be navigating — skip scroll
	}
}

/** Screenshot with animation-settle delay */
async function takeShot(page, fileName, stepLabel) {
	await sleep(PAUSE_BEFORE_SCREENSHOT);
	const fullPath = path.join(screenshotDir, fileName);
	await page.screenshot({ path: fullPath, fullPage: true });
	screenshotIndex.push({ fileName, stepLabel });
}

function saveConsoleError(msgText, stepLabel) {
	if (msgText.includes("Division by zero test error") || msgText.includes("[ErrorHandler]")) {
		return;
	}
	consoleErrors.push(`[${nowIso()}] ${stepLabel}: ${msgText}`);
}

async function detectUiErrors(page, stepNumber, stepLabel, ignoreExpected = false) {
	const detected = await page.evaluate(() => {
		const snack = document.querySelector(".mat-mdc-snack-bar-container")?.textContent?.trim() ?? null;
		const alert = document.querySelector("[role='alert']")?.textContent?.trim() ?? null;
		return { snack, alert };
	});
	if (!ignoreExpected) {
		for (const [kind, text] of [["snackbar", detected.snack], ["alert", detected.alert]]) {
			if (text && text.length > 0) {
				const lower = text.toLowerCase();
				if (lower.includes("error") || lower.includes("failed") || lower.includes("unexpected")) {
					unexpectedBanners.push(`Step ${stepNumber} (${stepLabel}) ${kind}: ${text}`);
				}
			}
		}
	}
}

async function recordStep(stepNumber, stepLabel, action) {
	const entry = { stepNumber, stepLabel, status: "PASSED", notes: "" };
	console.log(`\n[Step ${stepNumber}/${TOTAL_STEPS}] ${stepLabel}...`);
	try {
		await action();
		await showFullPageContext(pageRef.current);
	} catch (error) {
		entry.status = "FAILED";
		entry.notes = error instanceof Error ? error.message : String(error);
	}
	const icon = entry.status === "PASSED" ? "\u2713" : "\u2717";
	console.log(`  ${icon} ${entry.status}${entry.notes ? ": " + entry.notes.slice(0, 120) : ""}`);
	stepResults.push(entry);
}

const pageRef = { current: null };

async function solveAltchaIfPresent(page) {
	const widget = page.locator("altcha-widget");
	if (await widget.count() === 0) {
		return;
	}

	// Wait for the checkbox to become visible (widget has loaded the challenge)
	const checkbox = widget.first().locator("input[type='checkbox']");
	try {
		await checkbox.waitFor({ state: "visible", timeout: 20000 });
	} catch {
		// Widget rendered but no visible checkbox — may not need solving
		return;
	}

	// Check if already verified
	const inner = widget.first().locator(".altcha");
	const currentState = await inner.getAttribute("data-state");
	if (currentState === "verified") {
		return;
	}

	// Click the checkbox to start proof-of-work
	console.log("    ALTCHA: clicking checkbox (current state: " + currentState + ")");
	await checkbox.click();

	// Poll for verified state (handles both light and shadow DOM)
	const startTime = Date.now();
	let lastLoggedState = "";
	while (Date.now() - startTime < 60000) {
		const state = await page.evaluate(() => {
			const el = document.querySelector("altcha-widget");
			if (!el) return null;
			const altcha = el.querySelector(".altcha");
			return altcha?.getAttribute("data-state") ?? null;
		});
		if (state !== lastLoggedState) {
			console.log("    ALTCHA state: " + state);
			lastLoggedState = state;
		}
		if (state === "verified") {
			return;
		}
		if (state === "error") {
			throw new Error("ALTCHA challenge failed with error state");
		}
		await sleep(300);
	}
	throw new Error("ALTCHA verification timed out after 60s");
}

/** Login flow using human-like typing */
async function loginAsCredentials(page, usernameOrEmail, password) {
	await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
	await page.context().clearCookies();
	if (!shouldAvoidDirectNavigation(page.url(), "/auth/login")) {
		await gotoWithCursor(page, `${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
	}
	await page.waitForTimeout(PAUSE_PAGE_LOAD);

	const emailField = page.locator("#usernameOrEmail").first();
	await emailField.waitFor({ state: "visible", timeout: 15000 });
	await humanTypeLocator(emailField, usernameOrEmail);
	await sleep(PAUSE_BETWEEN_ACTIONS);

	const passField = page.locator("#password").first();
	await humanTypeLocator(passField, password);
	await sleep(PAUSE_BETWEEN_ACTIONS);

	await solveAltchaIfPresent(page);
	await sleep(400);

	await retryAsync(async () => {
		const loginButton = page.locator("button[type='submit']").first();
		await hoverThenClick(page, loginButton);
	});
	// Wait for SPA navigation to settle after login
	try {
		await page.waitForLoadState("networkidle", { timeout: 8000 });
	} catch {
		// fallback to simple timeout if networkidle times out
		await page.waitForTimeout(2500);
	}
	await forceInjectCursor(page);
}

async function loginAsAdmin(page) {
	await loginAsCredentials(page, adminEmail, adminPassword);
}

function getLatestMfaCode() {
	const sql = "SELECT \"TemplateData\"->>'code' AS \"MfaCode\" FROM \"ElectronicNotifications\".\"EmailQueue\" WHERE \"EmailType\" = 'MfaVerification' ORDER BY \"CreateDate\" DESC LIMIT 1;";
	const output = execFileSync("docker", ["exec", "seventysix-postgres-dev", "psql", "-U", "postgres", "-d", "seventysix", "-t", "-A", "-c", sql], { encoding: "utf8" }).trim();
	const match = output.match(/\b\d{6}\b/);
	if (match == null) {
		throw new Error("Unable to retrieve valid 6-digit MFA code from PostgreSQL.");
	}
	return match[0];
}

function getWelcomeResetToken(email) {
	const sql = `SELECT "TemplateData"->>'resetToken' FROM "ElectronicNotifications"."EmailQueue" WHERE "EmailType" = 'Welcome' AND "RecipientEmail" = '${email}' ORDER BY "CreateDate" DESC LIMIT 1;`;
	const output = execFileSync("docker", ["exec", "seventysix-postgres-dev", "psql", "-U", "postgres", "-d", "seventysix", "-t", "-A", "-c", sql], { encoding: "utf8" }).trim();
	if (output.length === 0) {
		throw new Error(`No welcome reset token found in EmailQueue for ${email}`);
	}
	return output;
}

/** Human-like fill — clears then types character by character */
async function humanFillByLabel(page, candidates, text) {
	for (const candidate of candidates) {
		const locator = candidate();
		if (await locator.count() > 0) {
			await locator.first().click();
			await locator.first().clear();
			await sleep(150);
			await humanTypeLocator(locator.first(), text);
			return true;
		}
	}
	return false;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MAIN WALKTHROUGH
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function run() {
	await ensureOutputDirs();

	const browser = await chromium.launch({
		headless: false,
		slowMo: 50,
		args: ["--start-maximized"],
	});
	const context = await browser.newContext({
		ignoreHTTPSErrors: true,
		viewport: null,
	});
	const page = await context.newPage();
	pageRef.current = page;

	// Open the landing page so the window is visible for recording
	await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
	await enableDemoPointer(page);

	// Countdown \u2014 aim your recorder at the browser window
	const COUNTDOWN = 20;
	process.stdout.write(`\nBrowser is open \u2014 aim your recorder at the window!\nStarting in: `);
	for (let s = COUNTDOWN; s > 0; s--) {
		process.stdout.write(`${s}... `);
		await sleep(1000);
	}
	process.stdout.write("GO!\n");
	console.log("\n=== SeventySix Site Walkthrough ===");
	console.log(`Target: ${baseUrl}`);
	console.log(`Run token: ${runToken}\n`);

	page.on("console", (msg) => {
		if (msg.type() === "error") {
			saveConsoleError(msg.text(), "runtime");
		}
	});

	// \u2500\u2500\u2500 SECTION 1: PUBLIC PAGES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(1, "Landing page", async () => {
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-01-landing-hero.png", "Step 1");
		await smoothScrollDown(page);
		await takeShot(page, "step-01-landing-footer.png", "Step 1");
		await scrollToTop(page);
		await detectUiErrors(page, 1, "Landing page");
	});

	await recordStep(2, "Sandbox page", async () => {
		await clickSidebarLink(page, "Sandbox");
		await takeShot(page, "step-02-sandbox.png", "Step 2");
		await smoothScrollDown(page);
		await scrollToTop(page);
		await detectUiErrors(page, 2, "Sandbox page");
	});

	// \u2500\u2500\u2500 SECTION 2: AUTH PAGES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(3, "Login page view", async () => {
		const guestMenu = page.locator("[data-testid='guest-menu-button']");
		if (await guestMenu.count() > 0) {
			await hoverThenClick(page, guestMenu);
			await sleep(400);
			const loginItem = page.getByRole("menuitem", { name: /login|sign in/i });
			if (await loginItem.count() > 0) {
				await hoverThenClick(page, loginItem);
			} else {
				await gotoWithCursor(page, `${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
			}
		} else {
				await gotoWithCursor(page, `${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
		}
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-03-login.png", "Step 3");

		const emailExists = await page.locator("#usernameOrEmail").count();
		const passExists = await page.locator("#password").count();
		const submitExists = await page.locator("button[type='submit']").count();
		if (emailExists === 0 || passExists === 0 || submitExists === 0) {
			throw new Error("Missing expected login fields or sign-in button.");
		}
	});

	await recordStep(4, "Register page view", async () => {
		const registerLink = page.getByRole("link", { name: /register|sign up|create account/i });
		if (await registerLink.count() > 0) {
			await hoverThenClick(page, registerLink);
		} else {
			await gotoWithCursor(page, `${baseUrl}/auth/register`, { waitUntil: "domcontentloaded" });
		}
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-04-register.png", "Step 4");
		if (await page.locator("#email").count() === 0) {
			throw new Error("Register email input not found.");
		}
	});

	await recordStep(5, "Forgot password page view", async () => {
		await gotoWithCursor(page, `${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		const forgotLink = page.getByRole("link", { name: /forgot|reset/i });
		if (await forgotLink.count() > 0) {
			await hoverThenClick(page, forgotLink);
		} else {
			await gotoWithCursor(page, `${baseUrl}/auth/forgot-password`, { waitUntil: "domcontentloaded" });
		}
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-05-forgot-password.png", "Step 5");
		if (await page.locator("#email").count() === 0) {
			throw new Error("Forgot password email input not found.");
		}
	});

	// \u2500\u2500\u2500 SECTION 3: ADMIN LOGIN & MFA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(6, "Admin login", async () => {
		await loginAsAdmin(page);
		await takeShot(page, "step-06-login-submit.png", "Step 6");
		await detectUiErrors(page, 6, "Admin login");
	});

	await recordStep(7, "MFA verify (conditional)", async () => {
		if (!page.url().includes("/auth/mfa/verify")) {
			return;
		}
		await takeShot(page, "step-07-mfa-form.png", "Step 7");
		const mfaCode = getLatestMfaCode();
		const codeField = page.locator("#code").first();
		await humanTypeLocator(codeField, mfaCode);
		await sleep(PAUSE_BETWEEN_ACTIONS);
		await hoverThenClick(page, page.locator("button[type='submit']").first());
		await page.waitForTimeout(2000);
		await detectUiErrors(page, 7, "MFA verify");
	});

	// \u2500\u2500\u2500 SECTION 4: ADMIN DASHBOARD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(8, "Admin dashboard tabs", async () => {
		await clickSidebarLink(page, "Admin Dashboard");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-09-dashboard-overview.png", "Step 8");
		await sleep(1200);

		for (const [tabName, shotName] of [
			[/api metrics/i, "step-09-dashboard-api.png"],
			[/cache metrics/i, "step-09-dashboard-cache.png"],
			[/external systems/i, "step-09-dashboard-external.png"],
		]) {
			const tab = page.getByRole("tab", { name: tabName });
			await hoverThenClick(page, tab, 600);
			await sleep(1000);
			await takeShot(page, shotName, "Step 8");
		}
		await detectUiErrors(page, 8, "Admin dashboard tabs");
	});

	await recordStep(9, "Create log entries", async () => {
		await hoverThenClick(page, page.getByRole("tab", { name: /external systems/i }), 400);
		await sleep(600);

		await hoverThenClick(page, page.getByRole("button", { name: /^info$/i }), 500);
		await sleep(800);
		await takeShot(page, "step-09-info-log-created.png", "Step 9");

		await hoverThenClick(page, page.getByRole("button", { name: /^error$/i }), 500);
		await sleep(800);
		await takeShot(page, "step-09-error-log-created.png", "Step 9");
		await detectUiErrors(page, 9, "Create log entries", true);
	});

	// \u2500\u2500\u2500 SECTION 5: LOG MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(10, "Log table view", async () => {
		await clickSidebarLink(page, "Logs");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-10-log-list.png", "Step 10");

		// Click "Errors" quick filter to show only error-level logs
		const errorsFilter = page.getByRole("button", { name: /errors/i });
		if (await errorsFilter.count() > 0) {
			await hoverThenClick(page, errorsFilter, 500);
			await sleep(1000);
			await takeShot(page, "step-10-log-errors-filtered.png", "Step 10");
		}

		// Click "All" to reset filter
		const allFilter = page.getByRole("button", { name: /^all$/i });
		if (await allFilter.count() > 0) {
			await hoverThenClick(page, allFilter, 500);
			await sleep(800);
		}

		await detectUiErrors(page, 10, "Log table view");
	});

	await recordStep(11, "Log detail \u2014 open error log", async () => {
		const clicked = await clickFirstDataRow(page);
		if (!clicked) {
			throw new Error("No log rows to click");
		}
		await sleep(1200);

		const dialog = page.locator("[role='dialog']").last();
		await dialog.waitFor({ state: "visible", timeout: 10000 });
		await takeShot(page, "step-11-log-detail.png", "Step 11");

		// Scroll through dialog content
		const dialogContent = dialog.locator("mat-dialog-content, [mat-dialog-content]");
		if (await dialogContent.count() > 0) {
			await dialogContent.first().evaluate((el) => {
				el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
			});
			await sleep(1000);
			await takeShot(page, "step-11-log-detail-bottom.png", "Step 11");
			await dialogContent.first().evaluate((el) => {
				el.scrollTo({ top: 0, behavior: "smooth" });
			});
			await sleep(500);
		}

		await detectUiErrors(page, 11, "Log detail");
	});

	await recordStep(12, "Log detail \u2014 Jaeger trace", async () => {
		const dialog = page.locator("[role='dialog']").last();
		if (await dialog.count() === 0) {
			throw new Error("Log detail dialog not open");
		}

		// Find and click the Jaeger trace button (bug_report icon)
		const jaegerBtn = dialog.locator("button").filter({ has: page.locator("mat-icon:text('bug_report')") });
		if (await jaegerBtn.count() > 0) {
			// Jaeger opens in a new tab — listen for it before clicking
			const newPagePromise = page.context().waitForEvent("page", { timeout: 5000 }).catch(() => null);
			await hoverThenClick(page, jaegerBtn.first(), 600);
			const jaegerPage = await newPagePromise;

			if (jaegerPage) {
				// New tab opened — dwell on it briefly, screenshot, then close
				await jaegerPage.waitForLoadState("domcontentloaded").catch(() => {});
				await sleep(1500);
				await takeShot(jaegerPage, "step-12-jaeger-trace.png", "Step 12");
				await jaegerPage.close();
				await page.bringToFront();
				await sleep(500);
			} else {
				// No new tab — alert dialog may have appeared (no trace ID)
				await sleep(1000);
				await takeShot(page, "step-12-jaeger-trace.png", "Step 12");
				const alertCloseBtn = page.locator("mat-dialog-container").last().locator("button").filter({ hasText: /close|ok|dismiss/i });
				if (await alertCloseBtn.count() > 0) {
					await hoverThenClick(page, alertCloseBtn.first(), 400);
					await sleep(500);
				}
			}
		}

		await detectUiErrors(page, 12, "Jaeger trace");
	});

	await recordStep(13, "Log detail \u2014 copy to clipboard", async () => {
		const dialog = page.locator("[role='dialog']").last();
		if (await dialog.count() === 0) {
			throw new Error("Log detail dialog not open");
		}

		// Find and click the Copy button (content_copy icon)
		const copyBtn = dialog.locator("button").filter({ has: page.locator("mat-icon:text('content_copy')") });
		if (await copyBtn.count() > 0) {
			await hoverThenClick(page, copyBtn.first(), 600);
			await sleep(800);
			await takeShot(page, "step-13-copy-log.png", "Step 13");
		}

		// Close the log detail dialog
		const closeBtn = dialog.locator("button").filter({ has: page.locator("mat-icon:text('close')") });
		if (await closeBtn.count() > 0) {
			await hoverThenClick(page, closeBtn.first(), 400);
		} else {
			await page.keyboard.press("Escape");
		}
		await sleep(600);

		await detectUiErrors(page, 13, "Copy log");
	});

	// \u2500\u2500\u2500 SECTION 6: USER MANAGEMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(14, "User list", async () => {
		await clickSidebarLink(page, "Users");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-14-user-list.png", "Step 14");

		const searchInput = page.getByPlaceholder(/search/i);
		if (await searchInput.count() > 0) {
			await humanTypeLocator(searchInput.first(), "admin");
			await sleep(1000);
			await takeShot(page, "step-14-user-search.png", "Step 14");
			await searchInput.first().click();
			await searchInput.first().clear();
			await sleep(800);
		}
		await detectUiErrors(page, 14, "User list");
	});

	await recordStep(15, "Create user", async () => {
		const createBtn = page.getByRole("button", { name: /create user/i });
		if (await createBtn.count() > 0) {
			await hoverThenClick(page, createBtn, 600);
		} else {
			await gotoWithCursor(page, `${baseUrl}/admin/users/create`, { waitUntil: "domcontentloaded" });
		}
		await page.waitForTimeout(PAUSE_PAGE_LOAD);

		const usernameInput = page.locator("[data-testid='username-input']").first();
		await usernameInput.waitFor({ state: "visible", timeout: 10000 });
		await humanTypeLocator(usernameInput, walkthroughUserName);
		await sleep(PAUSE_BETWEEN_ACTIONS);

		const emailInput = page.locator("[data-testid='email-input']").first();
		await humanTypeLocator(emailInput, walkthroughUserEmail);
		await sleep(600);
		await takeShot(page, "step-15-create-user-step1.png", "Step 15");

		// Step 1 \u2192 Step 2
		await hoverThenClick(page, page.getByRole("button", { name: /^Next$/i }).first(), 600);
		await sleep(800);

		const fullNameInput = page.locator("[data-testid='full-name-input']").first();
		await fullNameInput.waitFor({ state: "visible", timeout: 10000 });
		await humanTypeLocator(fullNameInput, "Walkthrough Test User");
		await sleep(600);
		await takeShot(page, "step-15-create-user-step2.png", "Step 15");

		// Step 2 \u2192 Step 3
		await hoverThenClick(page, page.getByRole("button", { name: /^Next$/i }).first(), 600);
		await sleep(800);

		const roleChip = page.locator("mat-chip-option").first();
		if (await roleChip.count() > 0) {
			await hoverThenClick(page, roleChip, 400);
		}
		await takeShot(page, "step-15-create-user-step3.png", "Step 15");

		// Step 3 \u2192 Step 4 (Review)
		await hoverThenClick(page, page.getByRole("button", { name: /^Next$/i }).first(), 600);
		await sleep(800);

		await takeShot(page, "step-15-create-user-step4.png", "Step 15");

		const createUserBtn = page.locator("[data-testid='create-user-button']");
		await createUserBtn.waitFor({ state: "visible", timeout: 10000 });
		await hoverThenClick(page, createUserBtn, 800);
		await page.waitForTimeout(2500);
		await detectUiErrors(page, 15, "Create user");
	});

	await recordStep(16, "Edit user detail", async () => {
		await clickSidebarLink(page, "Users");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);

		const searchInput = page.locator("input[placeholder*='Search']").first();
		if (await searchInput.count() > 0) {
			await humanTypeLocator(searchInput, walkthroughUserEmail);
			await sleep(1000);
		}

		const clicked = await clickFirstDataRow(page);
		if (!clicked) {
			await takeShot(page, "step-16-user-detail.png", "Step 16");
			return;
		}
		await page.waitForTimeout(1500);
		await takeShot(page, "step-16-user-detail.png", "Step 16");

		const fullNameInput = page.locator("[data-testid='full-name-input']").first();
		if (await fullNameInput.count() > 0) {
			await fullNameInput.waitFor({ state: "visible", timeout: 10000 });
			await fullNameInput.click();
			await fullNameInput.clear();
			await sleep(200);
			await humanTypeLocator(fullNameInput, `Walkthrough Edited ${runToken}`);
			await sleep(600);
		}

		const saveBtn = page.locator("[data-testid='save-changes-button']");
		if (await saveBtn.count() > 0) {
			await hoverThenClick(page, saveBtn, 600);
		} else {
			await hoverThenClick(page, page.getByRole("button", { name: /save changes|save/i }), 600);
		}
		await sleep(1200);
		await takeShot(page, "step-16-user-detail-saved.png", "Step 16");

		await hoverThenClick(page, page.getByText(/audit info/i), 600);
		await sleep(800);
		await takeShot(page, "step-16-user-audit.png", "Step 16");
		await detectUiErrors(page, 16, "Edit user detail");
	});

	// \u2500\u2500\u2500 SECTION 7: PASSWORD CHANGE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(17, "New user password change", async () => {
		const resetToken = getWelcomeResetToken(walkthroughUserEmail);
		const setPasswordUrl = `${baseUrl}/auth/set-password?token=${encodeURIComponent(resetToken)}`;

		await gotoWithCursor(page, setPasswordUrl, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-17-set-password-form.png", "Step 17");

		const passFields = page.locator("input[type='password']");
		const passCount = await passFields.count();
		if (passCount >= 2) {
			await humanTypeLocator(passFields.nth(0), WALKTHROUGH_USER_PASSWORD);
			await sleep(PAUSE_BETWEEN_ACTIONS);
			await humanTypeLocator(passFields.nth(1), WALKTHROUGH_USER_PASSWORD);
			await sleep(PAUSE_BETWEEN_ACTIONS);
		} else if (passCount === 1) {
			await humanTypeLocator(passFields.first(), WALKTHROUGH_USER_PASSWORD);
			await sleep(PAUSE_BETWEEN_ACTIONS);
		}

		await hoverThenClick(page, page.locator("button[type='submit']").first(), 600);
		await page.waitForTimeout(2500);
		await takeShot(page, "step-17-set-password-success.png", "Step 17");
		await detectUiErrors(page, 17, "New user password change");
	});

	// \u2500\u2500\u2500 SECTION 8: PERMISSION REQUEST LIFECYCLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(18, "New user profile + request permissions", async () => {
		await loginAsCredentials(page, walkthroughUserEmail, WALKTHROUGH_USER_PASSWORD);

		// Handle MFA if triggered
		if (page.url().includes("/auth/mfa/verify")) {
			const mfaCode = getLatestMfaCode();
			const codeField = page.locator("#code").first();
			await humanTypeLocator(codeField, mfaCode);
			await sleep(PAUSE_BETWEEN_ACTIONS);
			await hoverThenClick(page, page.locator("button[type='submit']").first());
			await page.waitForTimeout(2000);
		}

		// --- Profile: navigate to account and edit display name ---
		const userMenu = page.locator("[data-testid='user-menu-button']");
		if (await userMenu.count() > 0) {
			await hoverThenClick(page, userMenu, 500);
			await sleep(400);
			const profileItem = page.getByRole("menuitem", { name: /profile|account/i });
			if (await profileItem.count() > 0) {
				await hoverThenClick(page, profileItem);
			} else {
				await gotoWithCursor(page, `${baseUrl}/account`, { waitUntil: "domcontentloaded" });
			}
		} else {
			await gotoWithCursor(page, `${baseUrl}/account`, { waitUntil: "domcontentloaded" });
		}
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-18-profile.png", "Step 18");

		const fullNameInput = page.getByLabel(/full name|display name/i).first();
		if (await fullNameInput.count() > 0) {
			await fullNameInput.click();
			await fullNameInput.clear();
			await sleep(200);
			await humanTypeLocator(fullNameInput, "Demo Walkthrough User Edited");
			await sleep(600);
		}
		const saveBtn = page.getByRole("button", { name: /save changes/i });
		if (await saveBtn.count() > 0) {
			await hoverThenClick(page, saveBtn, 600);
		}
		// Wait for the save success notification to appear
		try {
			await page.locator(".mat-mdc-snack-bar-container").waitFor({ state: "visible", timeout: 8000 });
			await sleep(1500);
		} catch {
			await sleep(2000);
		}
		await takeShot(page, "step-18-profile-saved.png", "Step 18");

		// --- Permission Request: navigate, click Admin checkbox, fill message, submit ---
		await gotoWithCursor(page, `${baseUrl}/account/permissions`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-18-request-permissions.png", "Step 18");

		// Click the Admin role checkbox — target the actual input inside the mat-checkbox
		const adminMatCheckbox = page.locator("mat-checkbox").filter({ hasText: /admin/i }).first();
		if (await adminMatCheckbox.count() > 0) {
			const checkboxInput = adminMatCheckbox.locator("input[type='checkbox']");
			await moveToLocator(page, checkboxInput);
			await checkboxInput.click();
		} else {
			// Fallback: click first checkbox input
			const firstInput = page.locator("mat-checkbox input[type='checkbox']").first();
			if (await firstInput.count() > 0) {
				await moveToLocator(page, firstInput);
				await firstInput.click();
			}
		}
		await sleep(PAUSE_AFTER_CLICK);

		// Fill in the request message
		const msgInput = page.locator("textarea[formcontrolname='requestMessage']").first();
		if (await msgInput.count() > 0) {
			await humanTypeLocator(msgInput, "Requesting Admin access for demo walkthrough");
			await sleep(600);
		}
		await takeShot(page, "step-18-request-permissions-filled.png", "Step 18");

		// Submit the request
		const submitBtn = page.locator("[data-testid='request-permissions-submit']");
		if (await submitBtn.count() > 0) {
			await hoverThenClick(page, submitBtn, 600);
		} else {
			await hoverThenClick(page, page.getByRole("button", { name: /submit/i }), 600);
		}
		await sleep(1200);
		await takeShot(page, "step-18-request-permissions-submitted.png", "Step 18");
		await detectUiErrors(page, 18, "New user profile + permissions");
	});

	await recordStep(19, "Approve permission request (as admin)", async () => {
		await loginAsAdmin(page);

		// Handle MFA if triggered on re-login
		if (page.url().includes("/auth/mfa/verify")) {
			const mfaCode = getLatestMfaCode();
			const codeField = page.locator("#code").first();
			await humanTypeLocator(codeField, mfaCode);
			await sleep(PAUSE_BETWEEN_ACTIONS);
			await hoverThenClick(page, page.locator("button[type='submit']").first());
			await page.waitForTimeout(2000);
		}

		await clickSidebarLink(page, "Permission Requests");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-19-permission-requests.png", "Step 19");

		// Row actions use a menu button when there are multiple actions (approve + reject)
		const rowActionsBtn = page.locator("button[aria-label='Row actions']").first();
		if (await rowActionsBtn.count() > 0) {
			await hoverThenClick(page, rowActionsBtn, 600);
			await sleep(500);
			// Click the first menu item (Approve)
			const approveMenuItem = page.locator("button.mat-mdc-menu-item").first();
			if (await approveMenuItem.count() > 0) {
				await hoverThenClick(page, approveMenuItem, 400);
				await sleep(1200);
				await takeShot(page, "step-19-permission-approved.png", "Step 19");
			}
		} else {
			// Fallback: direct approve button
			const approveBtn = page.getByRole("button", { name: /approve/i }).first();
			if (await approveBtn.count() > 0) {
				await hoverThenClick(page, approveBtn, 600);
				await sleep(1200);
				await takeShot(page, "step-19-permission-approved.png", "Step 19");
			}
		}

		await detectUiErrors(page, 19, "Approve permission request");
	});

	await recordStep(20, "Developer style guide", async () => {
		await clickSidebarLink(page, "Style Guide");
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-20-style-guide.png", "Step 20");

		const tabShots = [
			["Colors", "step-20-style-colors.png"],
			["Typography", "step-20-style-typography.png"],
			["Buttons", "step-20-style-buttons.png"],
			["Forms", "step-20-style-forms.png"],
			["Tables", "step-20-style-tables.png"],
			["Feedback", "step-20-style-feedback.png"],
			["Icons", "step-20-style-icons.png"],
			["Loading States", "step-20-style-loading.png"],
		];
		for (const [tabName, fileName] of tabShots) {
			const tab = page.getByRole("tab", { name: new RegExp(tabName, "i") });
			await hoverThenClick(page, tab, 500);
			await sleep(1000);
			// Scroll the active tab's content container (not the page)
			await smoothScrollContainer(page, ".mat-mdc-tab-body-active .mat-mdc-tab-body-content");
			await takeShot(page, fileName, "Step 20");
		}
		await detectUiErrors(page, 20, "Developer style guide");
	});

	// \u2500\u2500\u2500 SECTION 11: ERROR PAGES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(21, "Error pages", async () => {
		await gotoWithCursor(page, `${baseUrl}/error/401`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-21-error-401.png", "Step 21");

		await gotoWithCursor(page, `${baseUrl}/error/403`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-21-error-403.png", "Step 21");

		await gotoWithCursor(page, `${baseUrl}/this-page-does-not-exist`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(PAUSE_PAGE_LOAD);
		await takeShot(page, "step-21-error-404.png", "Step 21");
		await detectUiErrors(page, 21, "Error pages", true);
	});

	// \u2500\u2500\u2500 SECTION 12: LOGOUT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await recordStep(22, "Logout", async () => {
		const userMenu = page.locator("[data-testid='user-menu-button']");
		if (await userMenu.count() > 0) {
			await hoverThenClick(page, userMenu, 600);
			await sleep(500);
		}
		const logoutItem = page.getByRole("menuitem", { name: /logout|sign out/i });
		if (await logoutItem.count() > 0) {
			await hoverThenClick(page, logoutItem, 500);
		} else {
			const logoutBtn = page.locator("[data-testid='logout-button']");
			await hoverThenClick(page, logoutBtn, 500);
		}
		await page.waitForTimeout(2000);
		await takeShot(page, "step-22-logout.png", "Step 22");
		await detectUiErrors(page, 22, "Logout");
	});

	// \u2500\u2500\u2500 REPORT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

	await browser.close();

	const passed = stepResults.filter((s) => s.status === "PASSED").length;
	const failed = stepResults.length - passed;

	const errorBannerSection = unexpectedBanners.length > 0
		? unexpectedBanners.map((e) => `- ${e}`).join("\n")
		: "No unexpected error banners detected.";
	const consoleErrorSection = consoleErrors.length > 0
		? consoleErrors.map((e) => `- ${e}`).join("\n")
		: "No console errors detected.";
	const rows = stepResults
		.map((s) => `| ${s.stepNumber} | ${s.stepLabel} | ${s.status} | ${s.notes.replace(/\\/g, "\\\\").replace(/\|/g, "\\|") || ""} |`)
		.join("\n");
	const shotRows = screenshotIndex
		.map((s) => `| ${s.fileName} | ${s.stepLabel} |`)
		.join("\n");

	const report = `# SeventySix Site Walkthrough Report\n\n**Generated**: ${nowIso()}\n**Target**: ${baseUrl}\n\n---\n\n## Error Banners Detected\n\n${errorBannerSection}\n\n## Console Errors Detected\n\n${consoleErrorSection}\n\n---\n\n## Step Results\n\n| # | Step | Status | Notes |\n|---|------|--------|-------|\n${rows}\n\n---\n\n## Summary\n\n- **Total Steps**: ${stepResults.length}\n- **Passed**: ${passed}\n- **Failed**: ${failed}\n- **Screenshots**: \\.dev-tools-output/screenshots/\n\n---\n\n## Screenshots Index\n\n| Screenshot | Step |\n|------------|------|\n${shotRows}\n`;

	await fs.writeFile(reportPath, report, "utf8");
	console.log(`\n=== Walkthrough Complete ===`);
	console.log(`Passed: ${passed}/${stepResults.length}`);
	if (failed > 0) {
		console.log(`Failed: ${failed}`);
		stepResults.filter((s) => s.status === "FAILED").forEach((s) => {
			console.log(`  \u2717 Step ${s.stepNumber}: ${s.stepLabel} \u2014 ${s.notes.slice(0, 200)}`);
		});
	}
	console.log(`Report: ${reportPath}`);
	console.log(`Screenshots: ${screenshotDir}`);
}

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
