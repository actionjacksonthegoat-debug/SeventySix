/**
 * Architecture tests for SeventySix.Client domain boundary enforcement.
 *
 * These tests scan the source tree at test time and fail if structural rules are violated.
 * They act as a living architecture contract — no Angular TestBed required.
 *
 * Rules enforced:
 * 1. Cross-domain import isolation: a file in `domains/X` must not import from `@Y`
 *    where Y is a different domain name.
 * 2. Auth domain storage hygiene: no auth-domain source file may reference
 *    `localStorage` or `sessionStorage` (auth tokens must live in cookies only).
 * 3. HttpClient encapsulation: page component files under domains/{name}/pages/ must not
 *    inject HttpClient directly — all HTTP calls belong in domain services.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Resolve paths relative to this spec file's location
// ---------------------------------------------------------------------------

const currentDir: string =
	dirname(fileURLToPath(import.meta.url));

const appRoot: string =
	resolve(currentDir, "..");

const domainsRoot: string =
	join(appRoot, "domains");

// ---------------------------------------------------------------------------
// Domain names that are subject to isolation rules
// ---------------------------------------------------------------------------

const DOMAIN_NAMES: readonly string[] =
	[
		"admin",
		"auth",
		"account",
		"home",
		"developer",
		"sandbox"
	];

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Recursively collects all `.ts` source files under a directory.
 * Excludes `.spec.ts` files — test files may legitimately reference other domains
 * for mock/stub setup.
 * @param {string} dir
 * Root directory to scan.
 * @returns {string[]}
 * Absolute paths to all matched `.ts` source files.
 */
function collectSourceFiles(dir: string): string[]
{
	const results: string[] = [];

	for (const entry of readdirSync(dir))
	{
		const fullPath: string =
			join(dir, entry);
		const stat: ReturnType<typeof statSync> =
			statSync(fullPath);

		if (stat.isDirectory())
		{
			results.push(...collectSourceFiles(fullPath));
		}
		else if (
			extname(entry) === ".ts"
				&& !entry.endsWith(".spec.ts")
				&& !entry.endsWith(".d.ts"))
		{
			results.push(fullPath);
		}
	}

	return results;
}

/**
 * Determines which domain owns a file by matching path segments.
 * @param {string} filePath
 * Absolute path to the source file.
 * @returns {string | null}
 * Domain name owning the file, or `null` if the file is not inside a domain.
 */
function owningDomain(filePath: string): string | null
{
	const rel: string =
		relative(domainsRoot, filePath);

	// rel will be something like "auth\pages\login\login.ts" on Windows
	// or "auth/pages/login/login.ts" on Linux
	const firstSegment: string =
		rel.split(sep)[0];

	return DOMAIN_NAMES.includes(firstSegment)
		? firstSegment
		: null;
}

/**
 * Extracts all import path strings from a TypeScript source file.
 * Handles both single and double-quoted static imports.
 * @param {string} content
 * Raw file content.
 * @returns {string[]}
 * Array of import path literals.
 */
function extractImportPaths(content: string): string[]
{
	const importPattern: RegExp =
		/from\s+['"]([^'"]+)['"]/g;
	const paths: string[] = [];
	let match: RegExpExecArray | null;

	while ((match =
		importPattern.exec(content)) !== null)
	{
		paths.push(match[1]);
	}

	return paths;
}

// ---------------------------------------------------------------------------
// Rule 1 — Cross-domain import isolation
// ---------------------------------------------------------------------------

describe("Domain Boundary Isolation",
	() =>
	{
		it("should not import from another domain's scope",
			() =>
			{
				const violations: string[] = [];

				const allFiles: string[] =
					collectSourceFiles(domainsRoot);

				for (const filePath of allFiles)
				{
					const domain: string | null =
						owningDomain(filePath);
					if (domain === null)
					{
						continue;
					}

					const content: string =
						readFileSync(filePath, "utf-8");
					const importPaths: string[] =
						extractImportPaths(content);

					for (const importPath of importPaths)
					{
						for (const otherDomain of DOMAIN_NAMES)
						{
							if (otherDomain === domain)
							{
								continue;
							}

							// Match "@admin", "@admin/...", but NOT "@shared/..."
							const matchesForeignDomain: boolean =
								importPath === `@${otherDomain}`
									|| importPath.startsWith(`@${otherDomain}/`);

							if (matchesForeignDomain)
							{
								const relPath: string =
									relative(appRoot, filePath);
								violations.push(
									`${relPath}: imports from "@${otherDomain}" (cross-domain violation)`);
							}
						}
					}
				}

				expect(
					violations,
					[
						"Cross-domain import violations detected.",
						"Each domain must only import from @shared/* or its own alias.",
						"",
						...violations
					]
						.join("\n"))
					.toHaveLength(0);
			});
	});

// ---------------------------------------------------------------------------
// Rule 2 — Auth domain storage hygiene
// ---------------------------------------------------------------------------

describe("Auth Domain Storage Hygiene",
	() =>
	{
		it("should not reference localStorage or sessionStorage in auth source files",
			() =>
			{
				const authRoot: string =
					join(domainsRoot, "auth");

				const violations: string[] = [];

				const authFiles: string[] =
					collectSourceFiles(authRoot);

				for (const filePath of authFiles)
				{
					const content: string =
						readFileSync(filePath, "utf-8");

					const hasLocalStorage: boolean =
						content.includes("localStorage");
					const hasSessionStorage: boolean =
						content.includes("sessionStorage");

					if (hasLocalStorage || hasSessionStorage)
					{
						const relPath: string =
							relative(appRoot, filePath);
						const found: string[] = [];
						if (hasLocalStorage)
						{
							found.push("localStorage");
						}
						if (hasSessionStorage)
						{
							found.push("sessionStorage");
						}
						violations.push(
							`${relPath}: references ${found.join(", ")} (auth tokens must live in cookies)`);
					}
				}

				expect(
					violations,
					[
						"Auth domain storage violations detected.",
						"Auth tokens must live in HttpOnly cookies — never in Web Storage.",
						"",
						...violations
					]
						.join("\n"))
					.toHaveLength(0);
			});
	});

// ---------------------------------------------------------------------------
// Rule 3 — HttpClient encapsulation: no direct injection in page components
// ---------------------------------------------------------------------------

describe("HttpClient Encapsulation",
	() =>
	{
		it("should not inject HttpClient directly in page component files",
			() =>
			{
				const violations: string[] = [];

				const allFiles: string[] =
					collectSourceFiles(domainsRoot);

				for (const filePath of allFiles)
				{
					// Only check files under `pages/` subdirectories
					const rel: string =
						relative(domainsRoot, filePath);
					const segments: string[] =
						rel.split(sep);

					const isPageFile: boolean =
						segments.includes("pages");
					if (!isPageFile)
					{
						continue;
					}

					const content: string =
						readFileSync(filePath, "utf-8");

					// Look for HttpClient injection in the file
					const hasHttpClientImport: boolean =
						/from ['"]@angular\/common\/http['"]/.test(content)
							&& /inject\(HttpClient\)/.test(content);

					if (hasHttpClientImport)
					{
						const relPath: string =
							relative(appRoot, filePath);
						violations.push(
							`${relPath}: injects HttpClient directly — move HTTP logic to a domain service`);
					}
				}

				expect(
					violations,
					[
						"HttpClient injection found in page component files.",
						"Page components must be thin controllers. Move HTTP calls into domain services.",
						"",
						...violations
					]
						.join("\n"))
					.toHaveLength(0);
			});
	});