/**
 * Architecture contract tests for cross-app consistency.
 *
 * These tests enforce that shared library primitives are used consistently
 * across both commerce apps and that neither app re-implements shared logic.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/** Shared function names from the analytics module (all consumed by both apps as re-exports). */
const SHARED_ANALYTICS_FUNCTIONS: readonly string[] =
	[
		"initAnalytics",
		"isAnalyticsActive",
		"resetAnalytics",
		"trackPageView",
		"getConsentState",
		"revokeConsent",
		"setConsentState",
		"trackAddToCart",
		"trackBeginCheckout",
		"trackPurchase",
		"trackRemoveFromCart",
		"trackSearch",
		"trackSelectItem",
		"trackViewItem",
		"trackViewItemList"
	];

/** Shared function names from the webhook module (reserved for future delegation tests). */
const _SHARED_WEBHOOK_FUNCTIONS: readonly string[] =
	[
		"processStripeWebhook",
		"handleCheckoutCompleted",
		"isOrderProcessed"
	];

/** Shared function names from the cart module. */
const SHARED_CART_FUNCTIONS: readonly string[] =
	[
		"ensureCartSession",
		"getCartItems",
		"addToCart",
		"removeCartItem",
		"updateCartItemQuantity"
	];

/**
 * Collects all TypeScript source files under a directory recursively.
 * @param dir - Root directory to scan.
 * @param extensions - File extensions to include.
 * @returns Array of absolute file paths.
 */
function collectFiles(
	dir: string,
	extensions: string[] = [".ts", ".tsx", ".svelte"]): string[]
{
	const results: string[] = [];

	for (const entry of readdirSync(dir))
	{
		const fullPath: string =
			join(dir, entry);
		const stat =
			statSync(fullPath);

		if (stat.isDirectory() && entry !== "node_modules" && entry !== ".svelte-kit" && !entry.startsWith("."))
		{
			results.push(...collectFiles(fullPath, extensions));
		}
		else if (stat.isFile() && extensions.some((ext) => entry.endsWith(ext)))
		{
			results.push(fullPath);
		}
	}

	return results;
}

/**
 * Checks if a file contains an original function definition (not a re-export or framework adapter).
 * Re-exports like `export { fn } from "..."` or thin wrappers that import the same name
 * from shared are excluded.
 * @param content - File content to analyze.
 * @param functionName - The function name to search for.
 * @returns True if the file appears to define (not re-export/wrap) the function.
 */
function isOriginalDefinition(content: string, functionName: string): boolean
{
	const exportFunctionPattern: RegExp =
		new RegExp(`export\\s+(async\\s+)?function\\s+${functionName}\\b`);
	const exportConstPattern: RegExp =
		new RegExp(`export\\s+const\\s+${functionName}\\s*=\\s*(async\\s+)?\\(`);
	const exportArrowPattern: RegExp =
		new RegExp(
			`export\\s+const\\s+${functionName}\\s*:\\s*\\w.*=\\s*(async\\s+)?\\(`);

	const hasDefinition: boolean =
		exportFunctionPattern.test(content)
			|| exportConstPattern.test(content)
			|| exportArrowPattern.test(content);

	if (!hasDefinition)
	{
		return false;
	}

	// If the file also imports the same function from shared (adapter pattern), it is allowed.
	// Check without newlines to handle multi-line imports.
	const contentOneLine: string =
		content.replace(/\r?\n/g, " ");
	const importFromSharedPattern: RegExp =
		new RegExp(
			`import[^;]*${functionName}[^;]*from[^;]*@seventysixcommerce/shared`);

	if (importFromSharedPattern.test(contentOneLine))
	{
		return false;
	}

	return true;
}

const REPO_ROOT: string =
	join(__dirname, "../../../..");
const SVELTEKIT_SRC: string =
	join(REPO_ROOT, "ECommerce/seventysixcommerce-sveltekit/src");
const TANSTACK_SRC: string =
	join(REPO_ROOT, "ECommerce/seventysixcommerce-tanstack/src");

describe("Commerce Architecture Contract Tests",
	() =>
	{
		describe("Analytics Module: Both apps use shared re-exports only",
			() =>
			{
				it("SvelteKit should not define shared analytics functions — only re-export them",
					() =>
					{
						const files: string[] =
							collectFiles(SVELTEKIT_SRC);
						const violations: string[] = [];

						for (const file of files)
						{
							const content: string =
								readFileSync(file, "utf-8");

							for (const fn of SHARED_ANALYTICS_FUNCTIONS)
							{
								if (isOriginalDefinition(content, fn))
								{
									violations.push(
										`${relative(SVELTEKIT_SRC, file)}: defines '${fn}' (should re-export from shared)`);
								}
							}
						}

						expect(violations)
							.toEqual([]);
					});

				it("TanStack should not define shared analytics functions — only re-export them",
					() =>
					{
						const files: string[] =
							collectFiles(TANSTACK_SRC);
						const violations: string[] = [];

						for (const file of files)
						{
							const content: string =
								readFileSync(file, "utf-8");

							for (const fn of SHARED_ANALYTICS_FUNCTIONS)
							{
								if (isOriginalDefinition(content, fn))
								{
									violations.push(
										`${relative(TANSTACK_SRC, file)}: defines '${fn}' (should re-export from shared)`);
								}
							}
						}

						expect(violations)
							.toEqual([]);
					});
			});

		describe("Webhook Module: Both apps use shared processStripeWebhook orchestrator",
			() =>
			{
				it("SvelteKit should import processStripeWebhook from shared",
					() =>
					{
						const files: string[] =
							collectFiles(SVELTEKIT_SRC);
						const webhookFiles: string[] =
							files.filter((f) =>
								f.includes("webhook") && (f.endsWith(".ts") || f.endsWith(".svelte")));

						const usesSharedOrchestrator: boolean =
							webhookFiles.some(
								(file) =>
								{
									const content: string =
										readFileSync(file, "utf-8");
									return content.includes("processStripeWebhook")
										&& content.includes("@seventysixcommerce/shared");
								});

						expect(usesSharedOrchestrator)
							.toBe(true);
					});

				it("TanStack should import processStripeWebhook from shared",
					() =>
					{
						const files: string[] =
							collectFiles(TANSTACK_SRC);
						const tsFiles: string[] =
							files.filter((f) =>
								f.endsWith(".ts") || f.endsWith(".tsx"));

						const usesSharedOrchestrator: boolean =
							tsFiles.some(
								(file) =>
								{
									const content: string =
										readFileSync(file, "utf-8");
									return content.includes("processStripeWebhook")
										&& content.includes("@seventysixcommerce/shared");
								});

						expect(usesSharedOrchestrator)
							.toBe(true);
					});

				it("Neither app should define its own processStripeWebhook implementation",
					() =>
					{
						const sveltekitFiles: string[] =
							collectFiles(SVELTEKIT_SRC);
						const tanstackFiles: string[] =
							collectFiles(TANSTACK_SRC);
						const allFiles: string[] =
							[...sveltekitFiles, ...tanstackFiles];
						const violations: string[] = [];

						for (const file of allFiles)
						{
							const content: string =
								readFileSync(file, "utf-8");
							if (isOriginalDefinition(content, "processStripeWebhook"))
							{
								violations.push(relative(REPO_ROOT, file));
							}
						}

						expect(violations)
							.toEqual([]);
					});
			});

		describe("Cart Module: Both apps delegate to shared cart functions",
			() =>
			{
				it("Neither app should define its own cart mutation functions",
					() =>
					{
						const sveltekitFiles: string[] =
							collectFiles(SVELTEKIT_SRC);
						const tanstackFiles: string[] =
							collectFiles(TANSTACK_SRC);
						const allFiles: string[] =
							[...sveltekitFiles, ...tanstackFiles];
						const violations: string[] = [];

						for (const file of allFiles)
						{
							const content: string =
								readFileSync(file, "utf-8");

							for (const fn of SHARED_CART_FUNCTIONS)
							{
								if (isOriginalDefinition(content, fn))
								{
									violations.push(`${relative(REPO_ROOT, file)}: defines '${fn}' (should delegate to shared)`);
								}
							}
						}

						expect(violations)
							.toEqual([]);
					});
			});

		describe("Type Unity: No duplicate interface definitions",
			() =>
			{
				const CORE_SHARED_TYPES: readonly string[] =
					[
						"CartItem",
						"CartResponse",
						"ProductDetail",
						"ProductListItem",
						"ProductVariant",
						"CheckoutSessionData",
						"ValidatedCartRow"
					];

				it("SvelteKit should not locally redefine core shared types",
					() =>
					{
						const files: string[] =
							collectFiles(SVELTEKIT_SRC);
						const violations: string[] = [];

						for (const file of files)
						{
							const content: string =
								readFileSync(file, "utf-8");

							for (const typeName of CORE_SHARED_TYPES)
							{
								const interfacePattern: RegExp =
									new RegExp(`export\\s+interface\\s+${typeName}\\b`);
								const typeAliasPattern: RegExp =
									new RegExp(
										`export\\s+type\\s+${typeName}\\s*=(?!.*@seventysixcommerce)`);

								if (interfacePattern.test(content))
								{
									violations.push(`${relative(SVELTEKIT_SRC, file)}: defines interface '${typeName}'`);
								}
								else if (typeAliasPattern.test(content) && !content.includes("@seventysixcommerce"))
								{
									violations.push(`${relative(SVELTEKIT_SRC, file)}: defines type alias '${typeName}'`);
								}
							}
						}

						expect(violations)
							.toEqual([]);
					});

				it("TanStack should not locally redefine core shared types",
					() =>
					{
						const files: string[] =
							collectFiles(TANSTACK_SRC);
						const violations: string[] = [];

						for (const file of files)
						{
							const content: string =
								readFileSync(file, "utf-8");

							for (const typeName of CORE_SHARED_TYPES)
							{
								const interfacePattern: RegExp =
									new RegExp(`export\\s+interface\\s+${typeName}\\b`);

								if (interfacePattern.test(content))
								{
									violations.push(`${relative(TANSTACK_SRC, file)}: defines interface '${typeName}'`);
								}
							}
						}

						expect(violations)
							.toEqual([]);
					});
			});
	});