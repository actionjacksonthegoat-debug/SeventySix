import path from "node:path";
import {
	buildNaturalMousePath,
	buildTypingDelays,
	computeStepCount,
	pickTargetPoint,
} from "./human-interaction.mjs";
import { resolveDwellDuration } from "./flow.mjs";
import { resolveFirstVisibleCandidate } from "./reliability.mjs";

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Creates page action functions bound to shared walkthrough state.
 *
 * @param {object} config
 * @param {{ position: { x: number, y: number } }} config.mouseState - mutable cursor position
 * @param {Function} config.randomFn - seeded random function
 * @param {string} config.screenshotDir - absolute path for screenshot output
 * @param {Array} config.screenshotIndex - mutable array tracking screenshot metadata
 * @param {object} config.timings - timing constants
 */
export function createPageActions({ mouseState, randomFn, screenshotDir, screenshotIndex, timings }) {
	const {
		PAUSE_PAGE_LOAD,
		PAUSE_BETWEEN_ACTIONS,
		PAUSE_BEFORE_SCREENSHOT,
		PAUSE_AFTER_CLICK,
		PAUSE_SCROLL,
		TYPE_MIN_DELAY,
		TYPE_MAX_DELAY,
	} = timings;

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

	async function clickFirstDataRow(page) {
		for (const sel of ["tr.mat-mdc-row", "tbody tr", "[role='row']", "[data-testid='data-row']"]) {
			const rows = page.locator(sel);
			if (await rows.count() > 0) {
					await moveToLocator(page, rows.first());
					await rows.first().hover();
				await sleep(400);
				await rows.first().click({ timeout: 5000 });
				return true;
			}
		}
		return false;
	}

	return {
		sleep,
		enableDemoPointer,
		forceInjectCursor,
		moveMouseHumanLike,
		moveToLocator,
		humanTypeLocator,
		hoverThenClick,
		gotoWithCursor,
		clickSidebarLink,
		smoothScrollDown,
		scrollToTop,
		smoothScrollContainer,
		showFullPageContext,
		takeShot,
		clickFirstDataRow,
	};
}