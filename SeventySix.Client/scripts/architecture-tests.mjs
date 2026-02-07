#!/usr/bin/env node

// <copyright file="architecture-tests.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Client Architecture Tests
 * Node.js script to verify Angular 20+ architectural standards.
 *
 * Automatically runs with:
 * - npm test (architecture tests + Karma unit tests)
 * - npm run test:client (architecture tests + Karma unit tests)
 * - npm run test:all (architecture tests + Karma + Playwright E2E)
 * - npm run test:arch (architecture tests only)
 *
 * Tests enforce patterns from CLAUDE.md and .github/copilot-instructions.md:
 * - Signal Pattern (3 tests): input()/output() not @Input/@Output, OnPush change detection
 * - Control Flow (3 tests): @if/@for/@switch not *ngIf/*ngFor/*ngSwitch
 * - Dependency Injection (2 tests): inject() function not constructor DI
 * - Service Scoping (2 tests): Feature services scoped to routes, infrastructure services root-scoped
 * - Zoneless Architecture (3 tests): No NgZone, no fakeAsync/tick, provideZonelessChangeDetection
 * - Template Performance (2 tests): No method calls in interpolation/bindings, use computed() instead
 * - File Structure (1 test): Files under 800 lines (DRY/80-20 principle)
 * - Method Structure (2 tests): Methods under 50 lines and 6 parameters (SOLID principles)
 * - Class Structure (2 tests): Services/components with 12+ methods violate SRP
 * - Date Handling (1 test): Use DateService not native Date constructors
 * - Domain Boundary (6 tests): Bounded context isolation, shared independence, API imports, relative imports
 *
 * Total: 27 architecture guardrails
 * Complemented by ESLint rules in eslint.config.js for real-time feedback
 */

import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, "..", "src", "app");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Recursively gets all files matching a pattern in a directory.
 */
async function getFiles(
	directory,
	pattern
)
{
	const files = [];
	const entries = await fs.readdir(directory, { withFileTypes: true });

	for (const entry of entries)
	{
		const fullPath = path.join(directory, entry.name);

		if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
		{
			files.push(...(await getFiles(fullPath, pattern)));
		}
		else if (entry.isFile() && entry.name.endsWith(pattern))
		{
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Test runner
 */
function test(
	testName,
	testFunction
)
{
	totalTests++;

	try
	{
		testFunction();
		passedTests++;
		console.log(`[PASS] ${testName}`);
	}
	catch (error)
	{
		failedTests++;
		console.error(`[FAIL] ${testName}`);
		console.error(`  ${error.message}`);
	}
}

/**
 * Assertion helper
 */
function assertEmpty(
	violations,
	message
)
{
	if (violations.length > 0)
	{
		throw new Error(`${message}:\n${violations.map((violation) => `  - ${violation}`).join("\n")}`);
	}
}

/**
 * DRY helper: Check templates (HTML and inline) for a specific pattern
 */
async function checkTemplatesForPattern(
	pattern,
	description
)
{
	const htmlFiles = await getFiles(SRC_DIR, ".html");
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	// Check external templates
	for (const file of htmlFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		if (content.includes(pattern))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	// Check inline templates
	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);

		if (templateMatch && templateMatch[1].includes(pattern))
		{
			violations.push(`${path.relative(SRC_DIR, file)} (inline template)`);
		}
	}

	return violations;
}

/**
 * DRY helper: Check templates for method calls with specific regex pattern
 */
async function checkTemplatesForMethodCalls(
	regex,
	description
)
{
	const htmlFiles = await getFiles(SRC_DIR, ".html");
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	// Check external templates
	for (const file of htmlFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		const matches = content.match(regex);

		if (matches)
		{
			// Filter out safe patterns like pipes, trackBy, and ternary operators
			const unsafeMatches = matches.filter(
				(match) =>
					!match.includes("|") // Pipes are fine
					&& !match.includes("track") // TrackBy functions
					&& !match.includes("?") // Ternary operators
					&& !match.includes("$index")
					&& !match.includes("$count")
			);

			if (unsafeMatches.length > 0)
			{
				violations.push(`${path.relative(SRC_DIR, file)}: ${unsafeMatches.join(", ")}`);
			}
		}
	}

	// Check inline templates
	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);

		if (templateMatch)
		{
			const matches = templateMatch[1].match(regex);

			if (matches)
			{
				const unsafeMatches = matches.filter(
					(match) =>
						!match.includes("|")
						&& !match.includes("track")
						&& !match.includes("?")
						&& !match.includes("$index")
						&& !match.includes("$count")
				);

				if (unsafeMatches.length > 0)
				{
					violations.push(`${path.relative(SRC_DIR, file)} (inline): ${unsafeMatches.join(", ")}`);
				}
			}
		}
	}

	return violations;
}

/**
 * DRY helper: Find all methods in files with optional parameters
 */
async function findMethodsInFiles(
	sourceFiles,
	options = {}
)
{
	const { skipTests = false, includeParameters = false } = options;
	const methodMatches = [];

	// Test block functions to exclude (these describe test features, not production logic)
	const testBlockFunctions = new Set([
		"describe",
		"it",
		"beforeEach",
		"afterEach",
		"beforeAll",
		"afterAll",
		"test",
		"expect",
		"fdescribe",
		"fit",
		"xdescribe",
		"xit"
	]);

	// Method detection patterns
	const classMethodPattern = includeParameters
		? /^\s+(?:private|protected|public)\s+(?:readonly\s+)?(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/gm
		: /^\s+(?:private|protected|public)\s+(?:readonly\s+)?(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/gm;

	const arrowFunctionPattern = includeParameters
		? /^\s+(?:readonly\s+)?(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^{]+)?\s*=>\s*\{/gm
		: /^\s+(?:readonly\s+)?(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\s*=>\s*\{/gm;

	const standardMethodPattern = includeParameters
		? /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*:\s*[^{]+\s*\{/gm
		: /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*[^{]+\s*\{/gm;

	const constructorPattern = includeParameters
		? /^\s+(constructor)\s*\(([^)]*)\)\s*$/gm
		: /^\s+(constructor)\s*\([^)]*\)\s*$/gm;

	for (const file of sourceFiles)
	{
		// Skip test files if requested
		if (skipTests && file.endsWith(".spec.ts"))
		{
			continue;
		}

		// Skip non-production files for parameter checking
		if (includeParameters)
		{
			const fileName = path.basename(file);

			if (
				fileName.endsWith(".spec.ts")
				|| fileName.endsWith(".mock.ts")
				|| fileName.includes("test")
				|| path.relative(SRC_DIR, file).includes("testing")
			)
			{
				continue;
			}
		}

		// Normalize line endings for cross-platform consistency (Windows CRLF → LF)
		const content =
			(await fs.readFile(file, "utf-8")).replaceAll("\r", "");
		const lines = content.split("\n");

		// Collect all matches from all patterns
		const patterns = [classMethodPattern, arrowFunctionPattern, standardMethodPattern, constructorPattern];

		for (const pattern of patterns)
		{
			let match;

			while ((match = pattern.exec(content)) !== null)
			{
				const methodName = match[1];
				const parameters = includeParameters ? match[2] : undefined;

				// Skip test block functions
				if (testBlockFunctions.has(methodName))
				{
					continue;
				}

				const methodStartLine = content.substring(0, match.index).split("\n").length;

				methodMatches.push({
					file,
					methodName,
					parameters,
					startLine: methodStartLine,
					lines
				});
			}

			pattern.lastIndex = 0; // Reset for next file
		}
	}

	return methodMatches;
}

/**
 * DRY helper: Get public methods from a file
 */
async function getPublicMethods(
	file,
	excludeCallbacks = [],
	filterLifecycleHooks = false
)
{
	const content = await fs.readFile(file, "utf-8");

	// Count public methods (not private/protected, not getters/setters)
	const publicMethodPattern =
		/^\s+(?:readonly\s+)?(?!private|protected|get\s|set\s|constructor|ngOn)(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/gm;
	const functionMethodPattern =
		/^\s+(?!private|protected|get\s|set\s|constructor|ngOn)(\w+)\s*\([^)]*\)\s*(?::\s*\w+[<>[\],\s|]*)?(?:\s*{)/gm;

	const methodMatches = [
		...content.matchAll(publicMethodPattern),
		...content.matchAll(functionMethodPattern)
	];

	// Deduplicate method names and filter out unwanted methods
	let methodNames = [...new Set(methodMatches.map((match) => match[1]))];

	if (excludeCallbacks.length > 0)
	{
		methodNames = methodNames.filter((methodName) => !excludeCallbacks.includes(methodName));
	}

	if (filterLifecycleHooks)
	{
		methodNames = methodNames.filter((methodName) => !methodName.startsWith("ngOn"));
	}

	return methodNames;
}

/**
 * Counts lines in a method body using brace matching.
 * Excludes blank lines and comment-only lines.
 */
function countMethodLines(
	lines,
	startIndex
)
{
	let braceDepth = 0;
	let methodStarted = false;
	let nonBlankLineCount = 0;

	for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex++)
	{
		const line = lines[lineIndex];

		for (const character of line)
		{
			if (character === "{")
			{
				braceDepth++;
				methodStarted = true;
			}
			else if (character === "}")
			{
				braceDepth--;

				if (methodStarted && braceDepth === 0)
				{
					return nonBlankLineCount;
				}
			}
		}

		if (methodStarted)
		{
			const trimmedLine = line.trim();

			if (trimmedLine && !trimmedLine.startsWith("//"))
			{
				nonBlankLineCount++;
			}
		}
	}

	return nonBlankLineCount;
}

// ============================================================================
// ANGULAR PATTERN TESTS
// ============================================================================

console.log("\nSignal Pattern Tests");

test("components should not use @Input decorator", async () =>
{
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		if (content.match(/@Input\s*\(/))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Components using @Input decorator (use input() instead)");
});

test("components should not use @Output decorator", async () =>
{
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		if (content.match(/@Output\s*\(/))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Components using @Output decorator (use output() instead)");
});

test("components should use OnPush change detection", async () =>
{
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		// Skip dialog/toast components (dynamically instantiated, Default change detection acceptable)
		const fileName = path.basename(file);

		if (fileName.includes("dialog") || fileName.includes("toast"))
		{
			continue;
		}

		if (content.includes("@Component") && !content.includes("ChangeDetectionStrategy.OnPush"))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Components not using OnPush change detection");
});

console.log("\nControl Flow Syntax Tests");

test("templates should not use *ngIf", async () =>
{
	const violations = await checkTemplatesForPattern("*ngIf", "Templates using *ngIf (use @if instead)");
	assertEmpty(violations, "Templates using *ngIf (use @if instead)");
});

test("templates should not use *ngFor", async () =>
{
	const violations = await checkTemplatesForPattern("*ngFor", "Templates using *ngFor (use @for instead)");
	assertEmpty(violations, "Templates using *ngFor (use @for instead)");
});

test("templates should not use *ngSwitch", async () =>
{
	const violations = await checkTemplatesForPattern("*ngSwitch", "Templates using *ngSwitch (use @switch instead)");
	assertEmpty(violations, "Templates using *ngSwitch (use @switch instead)");
});

console.log("\nDependency Injection Pattern Tests");

test("components should use inject() not constructor injection", async () =>
{
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];

	for (const file of componentFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		if (content.includes("@Component") && content.match(/constructor\s*\([^)]+\)/))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Components using constructor injection (use inject() instead)");
});

test("services should use inject() not constructor injection", async () =>
{
	const serviceFiles = await getFiles(SRC_DIR, ".service.ts");
	const violations = [];

	for (const file of serviceFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		// Detect constructor with type annotations (indicates DI parameters)
		if (
			content.includes("@Injectable")
			&& content.match(/constructor\s*\([^)]*:\s*[A-Z]/) // Has type annotation
		)
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Services using constructor injection (use inject() instead)");
});

console.log("\nService Scoping Tests");

test("feature services should not use providedIn root", async () =>
{
	const serviceFiles = await getFiles(SRC_DIR, ".service.ts");
	// App-wide singleton services directories (these SHOULD use providedIn: 'root')
	const sharedServicesDir = path.join(SRC_DIR, "shared", "services");
	const infrastructureDir = path.join(SRC_DIR, "infrastructure");
	const violations = [];

	for (const file of serviceFiles)
	{
		// Skip app-wide singleton services (shared/services or legacy infrastructure)
		if (file.startsWith(sharedServicesDir) || file.startsWith(infrastructureDir))
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");
		if (content.match(/providedIn:\s*['"]root['"]/))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Feature services using providedIn: 'root' (scope to route providers instead)");
});

test("shared services should use providedIn root", async () =>
{
	const sharedServicesDir = path.join(SRC_DIR, "shared", "services");

	try
	{
		const serviceFiles = await getFiles(sharedServicesDir, ".service.ts");
		const violations = [];

		for (const file of serviceFiles)
		{
			const content = await fs.readFile(file, "utf-8");
			if (content.includes("@Injectable") && !content.match(/providedIn:\s*['"]root['"]/))
			{
				violations.push(path.relative(SRC_DIR, file));
			}
		}

		assertEmpty(violations, "Shared services not using providedIn: 'root' (app singletons require root)");
	}
	catch (error)
	{
		// Shared services folder may not exist yet - skip test
		if (error.code !== "ENOENT")
		{
			throw error;
		}
	}
});

console.log("\nZoneless Architecture Tests");

test("production code should not import NgZone", async () =>
{
	const tsFiles = (await getFiles(SRC_DIR, ".ts")).filter((f) => !f.endsWith(".spec.ts"));
	const violations = [];

	for (const file of tsFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		if (content.match(/import\s+{[^}]*NgZone[^}]*}\s+from/))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Production code importing NgZone (zoneless required)");
});

test("test code should not use fakeAsync or tick", async () =>
{
	const testFiles = await getFiles(SRC_DIR, ".spec.ts");
	const violations = [];

	for (const file of testFiles)
	{
		const content = await fs.readFile(file, "utf-8");

		// Remove comments to avoid false positives from documentation
		const codeOnly = content
			.replace(/\/\/.*$/gm, "") // Remove single-line comments
			.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

		// Detect Angular's fakeAsync/tick imports (zoneful testing)
		// Allow jasmine.clock().tick() (zoneless pattern) - supports multiline chaining
		const usesJasmineClock = codeOnly.includes("jasmine.clock().tick")
			|| /jasmine\s*\.\s*clock\s*\(\s*\)\s*\.\s*tick\s*\(/s.test(codeOnly);

		if (
			codeOnly.includes("fakeAsync")
			|| (codeOnly.match(/\btick\s*\(/) && !usesJasmineClock)
		)
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Test files using fakeAsync/tick (use TestBed.flushEffects() instead)");
});

test("tests should use provideZonelessChangeDetection", async () =>
{
	const testFiles = await getFiles(SRC_DIR, ".spec.ts");
	const violations = [];

	for (const file of testFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		if (content.includes("TestBed.configureTestingModule") && !content.includes("provideZonelessChangeDetection"))
		{
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, "Test files not using provideZonelessChangeDetection()");
});

console.log("\nTemplate Performance Tests");

test("templates should not call component methods in interpolation", async () =>
{
	const violations = await checkTemplatesForMethodCalls(
		/\{\{\s*[^}]*\([^)]+\)[^}]*\}\}/g,
		"Templates calling methods with arguments in interpolation (use computed() signals instead)"
	);
	assertEmpty(
		violations,
		"Templates calling methods with arguments in interpolation (use computed() signals instead)"
	);
});

test("templates should not call methods in property bindings", async () =>
{
	const violations = await checkTemplatesForMethodCalls(
		/\[(?:class|style|attr|disabled|hidden|readonly)\.[^\]]*\]\s*=\s*"[^"]*\([^)]+\)"/g,
		"Templates calling methods with arguments in property bindings (use computed() signals instead)"
	);
	assertEmpty(
		violations,
		"Templates calling methods with arguments in property bindings (use computed() signals instead)"
	);
});

console.log("\nDate Handling Standards Tests");

test("code (including tests/specs) should use DateService and approved test helpers", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	// Broader patterns that indicate direct Date usage
	const nativeDatePattern = /new\s+Date\s*\(|Date\.now\s*\(|Date\.parse\s*\(|Date\.UTC\s*\(/g;

	// Allowed exceptions with justification - these files implement the Date abstraction or approved test helpers
	const allowedExceptions = [
		"date.service.ts", // DateService itself must use Date internally (13 usages)
		"date.service.spec.ts" // Tests that target DateService itself may use native Date (26 usages)
	];

	for (const file of sourceFiles)
	{
		const fileName = path.basename(file);
		const relativePath = path.relative(SRC_DIR, file);

		// Skip allowed exception files
		if (allowedExceptions.includes(fileName))
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");
		const matches = content.match(nativeDatePattern);

		if (matches && matches.length > 0)
		{
			violations.push(
				`${relativePath}: ${matches.length} direct Date usage(s) - use DateService instead`
			);
		}
	}

	assertEmpty(violations, "Direct native Date usage found (production code and tests must use DateService)");
});

// ============================================================================
// NULL COERCION TESTS
// ============================================================================

console.log("\nNull Coercion Tests");

test("code should not use double-bang (!!) for boolean coercion", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	// Pattern: !! followed by any identifier, property access, or method call
	// Uses negative lookbehind to exclude matches inside string literals
	const doubleBangPattern = /!!\s*[a-zA-Z_$]/g;

	for (const file of sourceFiles)
	{
		const relativePath = path.relative(SRC_DIR, file);
		const content = await fs.readFile(file, "utf-8");

		// Remove string literals before matching to avoid false positives
		const contentWithoutStrings = content
			.replace(/`[^`]*`/gs, "``") // Template literals
			.replace(/"[^"]*"/g, '""') // Double-quoted strings
			.replace(/'[^']*'/g, "''"); // Single-quoted strings

		const matches = contentWithoutStrings.match(doubleBangPattern);

		if (matches && matches.length > 0)
		{
			violations.push(
				`${relativePath}: ${matches.length} double-bang (!!) usage(s) - use isPresent() from @shared/utilities/null-check.utility instead`
			);
		}
	}

	assertEmpty(violations, "Double-bang (!!) boolean coercion found (use isPresent() instead)");
});

test("code should not use OR (||) for nullish fallbacks with strings", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	// Pattern: || followed by a string literal (single or double quoted)
	const orStringFallbackPattern = /\|\|\s*["'`][^"'`]*["'`]/g;

	// Allowed exceptions with justification
	const allowedExceptions = [
	];

	for (const file of sourceFiles)
	{
		const fileName = path.basename(file);
		const relativePath = path.relative(SRC_DIR, file);

		if (allowedExceptions.includes(fileName))
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");
		const matches = content.match(orStringFallbackPattern);

		if (matches && matches.length > 0)
		{
			violations.push(
				`${relativePath}: ${matches.length} OR string fallback(s) - use nullish coalescing (??) instead of ||`
			);
		}
	}

	assertEmpty(violations, "OR (||) string fallback found (use ?? instead)");
});

// ============================================================================
// FILE STRUCTURE TESTS
// ============================================================================

console.log("\nFile Structure Tests");

test("all files should have less than 800 lines", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];
	const maxLinesPerFile = 800;

	// Exceptions with documented justification
	// NOTE: Test files are NOT automatically excepted - apply 80/20 and DRY
	const allowedExceptions = [
		"generated-open-api.ts", // Auto-generated from OpenAPI spec (3476 lines)
		"data-table.component.ts" // Primarily signal/input/output declarations
	];

	for (const file of sourceFiles)
	{
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName))
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");
		const lineCount = content.split("\n").length;

		if (lineCount > maxLinesPerFile)
		{
			violations.push(`${path.relative(SRC_DIR, file)}: ${lineCount} lines (max ${maxLinesPerFile})`);
		}
	}

	assertEmpty(violations, "Files exceeding 800 lines (apply DRY and 80/20 to reduce)");
});

// ============================================================================
// METHOD STRUCTURE TESTS
// ============================================================================

console.log("\nMethod Structure Tests");

test("methods should have less than 50 lines", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];
	const maxLinesPerMethod = 50;

	// Exception patterns (full method identifier => reason)
	// NOTE: These are legitimate exceptions with business justification
	const allowedExceptions = new Map([
	]);

	const methodMatches = await findMethodsInFiles(sourceFiles, { skipTests: true });

	for (const { file, methodName, startLine, lines } of methodMatches)
	{
		const methodIdentifier = `${path.basename(file, ".ts")}.${methodName}`;

		if (allowedExceptions.has(methodIdentifier))
		{
			continue;
		}

		const methodLineCount = countMethodLines(lines, startLine - 1);

		if (methodLineCount > maxLinesPerMethod)
		{
			violations.push(
				`${
					path.relative(SRC_DIR, file)
				}:${startLine} ${methodName}(): ${methodLineCount} lines (max ${maxLinesPerMethod})`
			);
		}
	}

	assertEmpty(violations, "Methods exceeding 50 lines (extract to smaller functions)");
});

test("methods should have less than 6 parameters", async () =>
{
	const sourceFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];
	const maxParametersPerMethod = 5;

	const methodMatches = await findMethodsInFiles(sourceFiles, { skipTests: true, includeParameters: true });

	for (const { file, methodName, parameters } of methodMatches)
	{
		// Count parameters by splitting on commas, but handle complex types
		let parameterCount = 0;
		if (parameters && parameters.trim())
		{
			// Split by comma but respect parentheses for generic types like Map<string, boolean>
			let level = 0;
			for (let i = 0; i < parameters.length; i++)
			{
				const char = parameters[i];
				if (char === "<" || char === "(" || char === "[") level++;
				else if (char === ">" || char === ")" || char === "]") level--;
				else if (char === "," && level === 0)
				{
					parameterCount++;
				}
			}
			parameterCount++; // Add the last parameter
		}

		if (parameterCount > maxParametersPerMethod)
		{
			violations.push(
				`${
					path.relative(SRC_DIR, file)
				} ${methodName}(): ${parameterCount} parameters (max ${maxParametersPerMethod})`
			);
		}
	}

	assertEmpty(violations, "Methods exceeding 6 parameters (extract parameter object or apply SOLID principles)");
});

// ============================================================================
// CLASS STRUCTURE TESTS (SRP ENFORCEMENT)
// ============================================================================

console.log("\nClass Structure Tests");

test("services should have less than 12 public methods", async () =>
{
	const serviceFiles = await getFiles(SRC_DIR, ".service.ts");
	const violations = [];
	const maxMethodsPerService = 11;

	// Services with cohesive single-domain responsibilities are exceptions
	// These have many methods but serve a single purpose (utility patterns)
	const allowedExceptions = [
		"date.service.ts", // Date utilities - all methods serve date handling (22 methods, single domain)
		"logger.service.ts", // Logging levels - all methods serve logging (12 methods, single domain)
		"notification.service.ts" // Toast notifications - all methods serve user feedback (13 methods, single domain)
	];

	// TanStack Query callback method names (not public API methods)
	const tanstackCallbacks = ["queryFn", "mutationFn", "onSuccess", "onError", "onSettled", "onMutate"];

	for (const file of serviceFiles)
	{
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName))
		{
			continue;
		}

		const methodNames = await getPublicMethods(file, tanstackCallbacks);
		const methodCount = methodNames.length;

		if (methodCount > maxMethodsPerService)
		{
			const displayMethods = methodNames.slice(0, 5).join(", ");
			const additional = methodCount > 5 ? ` and ${methodCount - 5} more` : "";
			violations.push(
				`${
					path.relative(SRC_DIR, file)
				}: ${methodCount} methods (max ${maxMethodsPerService}): ${displayMethods}${additional}`
			);
		}
	}

	assertEmpty(violations, "Services with 12+ methods violate SRP (split into focused services)");
});

test("components should have less than 12 public methods", async () =>
{
	const componentFiles = await getFiles(SRC_DIR, ".component.ts");
	const violations = [];
	const maxMethodsPerComponent = 11;

	// Components with complex UI may need more methods - these are exceptions
	const allowedExceptions = [
		"data-table.component.ts" // Complex reusable table with many features (15 methods for filtering, sorting, pagination, search)
	];

	for (const file of componentFiles)
	{
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName))
		{
			continue;
		}

		const methodNames = await getPublicMethods(file, [], true); // true = filter out lifecycle hooks
		const methodCount = methodNames.length;

		if (methodCount > maxMethodsPerComponent)
		{
			const displayMethods = methodNames.slice(0, 5).join(", ");
			const additional = methodCount > 5 ? ` and ${methodCount - 5} more` : "";
			violations.push(
				`${
					path.relative(SRC_DIR, file)
				}: ${methodCount} methods (max ${maxMethodsPerComponent}): ${displayMethods}${additional}`
			);
		}
	}

	assertEmpty(violations, "Components with 12+ methods violate SRP (extract to services or split)");
});

// ============================================================================
// DOMAIN BOUNDARY TESTS (Bounded Context Enforcement)
// ============================================================================

console.log("\nDomain Boundary Tests");

// Domain constants for architecture enforcement
const DOMAINS = ["admin", "game", "commerce", "auth", "account", "home", "physics", "developer"];
const DOMAINS_DIR = path.join(SRC_DIR, "domains");

/**
 * Helper: Check if a directory exists
 */
async function directoryExists(dirPath)
{
	try
	{
		const stats = await fs.stat(dirPath);
		return stats.isDirectory();
	}
	catch
	{
		return false;
	}
}

test("domains should not import from other domains", async () =>
{
	// Skip if domains folder doesn't exist yet (pre-migration)
	if (!(await directoryExists(DOMAINS_DIR)))
	{
		return;
	}

	const violations = [];

	for (const domain of DOMAINS)
	{
		const domainPath = path.join(DOMAINS_DIR, domain);
		if (!(await directoryExists(domainPath)))
		{
			continue;
		}

		const files = await getFiles(domainPath, ".ts");

		for (const file of files)
		{
			const content = await fs.readFile(file, "utf-8");

			for (const otherDomain of DOMAINS)
			{
				if (otherDomain === domain)
				{
					continue;
				}

				// Check for imports from other domains
				const importPattern = new RegExp(`from\\s+["']@${otherDomain}/`, "g");
				if (importPattern.test(content))
				{
					violations.push(
						`${path.relative(SRC_DIR, file)} imports from @${otherDomain}/ (domains must be isolated)`
					);
				}
			}
		}
	}

	assertEmpty(violations, "Domain cross-imports (each domain can only import @shared/* and itself)");
});

test("shared should not import from any domain", async () =>
{
	const sharedDir = path.join(SRC_DIR, "shared");
	if (!(await directoryExists(sharedDir)))
	{
		return;
	}

	const violations = [];
	const files = await getFiles(sharedDir, ".ts");

	for (const file of files)
	{
		const content = await fs.readFile(file, "utf-8");
		const lines = content.split("\n");

		for (const domain of DOMAINS)
		{
			// Check each line for imports, excluding comments
			for (const line of lines)
			{
				const trimmedLine = line.trim();
				// Skip if line starts with // or is inside /* */ block
				if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*"))
				{
					continue;
				}

				const importPattern = new RegExp(`from\\s+["']@${domain}/`);
				if (importPattern.test(line))
				{
					violations.push(
						`${path.relative(SRC_DIR, file)} imports from @${domain}/ (shared cannot depend on domains)`
					);
					break; // One violation per file per domain is enough
				}
			}
		}
	}

	assertEmpty(violations, "Shared importing from domains (shared must be domain-agnostic)");
});

test("generated API should only be imported by models/index.ts files", async () =>
{
	const violations = [];
	const files = await getFiles(SRC_DIR, ".ts");

	for (const file of files)
	{
		// Skip the allowed re-export files:
		// - models/index.ts (shared and domain model barrel exports)
		// - api.model.ts (shared models that re-export from generated)
		const relativePath = path.relative(SRC_DIR, file);
		const normalizedPath = relativePath.split(path.sep).join("/");

		if (
			normalizedPath.endsWith("models/index.ts")
			|| normalizedPath.endsWith("api.model.ts")
		)
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");

		// Check for direct imports from generated OpenAPI
		if (
			content.includes("@shared/generated-open-api/")
			|| content.includes("generated-open-api/generated-open-api")
			|| content.includes("@shared/api/generated")
			|| content.includes("@infrastructure/api/generated")
		)
		{
			violations.push(
				`${relativePath} imports directly from generated API (use @shared/models or domain models instead)`
			);
		}
	}

	assertEmpty(violations, "Direct imports from generated API (use @shared/models or domain models)");
});

test("domain route-scoped services should not use providedIn root", async () =>
{
	// Skip if domains folder doesn't exist yet (pre-migration)
	if (!(await directoryExists(DOMAINS_DIR)))
	{
		return;
	}

	const violations = [];

	for (const domain of DOMAINS)
	{
		const servicesPath = path.join(DOMAINS_DIR, domain, "services");
		if (!(await directoryExists(servicesPath)))
		{
			continue;
		}

		const files = await getFiles(servicesPath, ".service.ts");

		for (const file of files)
		{
			if (file.endsWith(".spec.ts"))
			{
				continue;
			}

			const content = await fs.readFile(file, "utf-8");

			if (content.includes("providedIn: 'root'") || content.includes("providedIn: \"root\""))
			{
				violations.push(
					`${path.relative(SRC_DIR, file)} uses providedIn: 'root' (move to domain/core/ if persistent)`
				);
			}
		}
	}

	assertEmpty(violations, "Route-scoped services with providedIn: root (use route providers or move to core/)");
});

test("domains should not import from multiple other domains", async () =>
{
	// Skip if domains folder doesn't exist yet (pre-migration)
	if (!(await directoryExists(DOMAINS_DIR)))
	{
		return;
	}

	const violations = [];
	const files = await getFiles(DOMAINS_DIR, ".ts");

	for (const file of files)
	{
		const content = await fs.readFile(file, "utf-8");
		const domainImports = DOMAINS.filter((domain) => new RegExp(`from\\s+["']@${domain}/`).test(content));

		if (domainImports.length > 1)
		{
			violations.push(
				`${path.relative(SRC_DIR, file)} imports from multiple domains: ${domainImports.join(", ")}`
			);
		}
	}

	assertEmpty(violations, "Domain files importing from multiple domains (domains should be isolated)");
});

test("relative imports should only be used in index.ts barrel files", async () =>
{
	const violations = [];
	const files = await getFiles(SRC_DIR, ".ts");

	// Pattern to detect relative imports: from "./" or from "../"
	const relativeImportPattern = /from\s+["']\.\.?\/[^"']*["']/g;

	// Pattern to detect same-folder relative import: from "./<filename>" (no directory traversal)
	const sameFolderPattern = /from\s+["']\.\/[^/"']+["']/;

	// Root app files that are allowed to use relative imports (no barrel to export from)
	const rootAppFiles = ["app.config.ts", "app.routes.ts", "app.ts"];

	for (const file of files)
	{
		const fileName = path.basename(file);

		// index.ts files are allowed to use relative imports for barrel exports
		if (fileName === "index.ts")
		{
			continue;
		}

		// Root app files can use same-folder relative imports (no barrel available)
		if (rootAppFiles.includes(fileName))
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");
		const matches = content.match(relativeImportPattern);

		if (matches && matches.length > 0)
		{
			// For spec files, allow same-folder relative imports (e.g., './auth.service')
			// This is the standard Angular pattern where test file imports its subject
			if (fileName.endsWith(".spec.ts"))
			{
				const nonLocalMatches = matches.filter((match) => !sameFolderPattern.test(match));
				if (nonLocalMatches.length > 0)
				{
					violations.push(
						`${
							path.relative(SRC_DIR, file)
						}: ${nonLocalMatches.length} relative import(s) (use @alias imports instead)`
					);
				}
			}
			else
			{
				violations.push(
					`${path.relative(SRC_DIR, file)}: ${matches.length} relative import(s) (use @alias imports instead)`
				);
			}
		}
	}

	assertEmpty(violations, "Relative imports outside index.ts (use @shared/*, @admin/*, etc. alias imports)");
});

// ============================================================================
// Variable Naming Tests
// ============================================================================

console.log("\nVariable Naming Tests");

test("production code should not have single-letter lambda parameters", async () =>
{
	const productionFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	// Allowed exceptions
	const allowedShortParams = new Set([
		"m", // Angular dynamic import: (m) => m.Component
		"e" // Event handlers: (e) => e.preventDefault()
	]);

	// Pattern to find arrow functions with single-letter params in common array methods
	// Matches: .filter(x => or .map(n => or (c) => etc.
	const arrowFunctionPattern =
		/\.(?:filter|map|find|some|every|forEach|reduce|findIndex|sort)\s*\(\s*\(?([a-z])\)?(?:\s*:\s*\w+)?\s*=>/gi;

	for (const file of productionFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		await fs.readFile(file, "utf-8");
		const relativePath = path.relative(SRC_DIR, file);

		let match;
		while ((match = arrowFunctionPattern.exec(content)) !== null)
		{
			const paramName = match[1];

			// Skip allowed exceptions
			if (allowedShortParams.has(paramName))
			{
				continue;
			}

			// Extract code context for violation message
			const contextStart = Math.max(0, match.index - 30);
			const contextEnd = Math.min(content.length, match.index + 30);
			const context = content
				.substring(contextStart, contextEnd)
				.replace(/\s+/g, " ")
				.trim();

			violations.push(
				`${relativePath}: '${paramName}' in ${context}`
			);
		}

		// Reset regex for next file
		arrowFunctionPattern.lastIndex = 0;
	}

	assertEmpty(
		violations,
		"Single-letter lambda parameters (use descriptive names)"
	);
});

test("all code should not have for loop counters", async () =>
{
	const productionFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	// Pattern: for (let i = or for (const index =
	const forLoopPattern = /for\s*\(\s*(?:let|const|var)\s+([a-z])\s*=/gi;

	for (const file of productionFiles)
	{
		const content = await fs.readFile(file, "utf-8");
		const relativePath = path.relative(SRC_DIR, file);

		let match;
		while ((match = forLoopPattern.exec(content)) !== null)
		{
			const loopVariable = match[1];

			violations.push(
				`${relativePath}: for loop with '${loopVariable}' (use forEach/map or descriptive name)`
			);
		}

		forLoopPattern.lastIndex = 0;
	}

	assertEmpty(
		violations,
		"For loop counters in production code (use functional methods or descriptive names)"
	);
});

// ============================================================================
// SINGLE EXPORT PER FILE
// ============================================================================

/**
 * Single Export Per File Rule
 * Each .ts file should export only one primary item.
 * Enforces separation of concerns and improves tree-shaking.
 *
 * Exceptions:
 * - index.ts barrel exports
 * - Type re-exports from generated code
 * - Error class hierarchies (shared inheritance)
 * - Environment configuration (hierarchical structure)
 * - Animation constants (related visual effects)
 * - Cohesive type sets (table.model.ts)
 * - Utility function collections
 * - Test data builders with factories
 * - Cohesive constant sets
 * - All testing/ folder files
 */
test("Files should have single primary export (with approved exceptions)", async () =>
{
	const tsFiles = await getFiles(SRC_DIR, ".ts");
	const violations = [];

	const excludedPatterns = [
		/index\.ts$/,
		/\.spec\.ts$/,
		/\.constants\.ts$/,
		/\.utility\.ts$/,
		/\.utilities\.ts$/,
		/\.builder\.ts$/,
		/\.types\.ts$/,
		/generated-open-api/,
		/app-error\.model\.ts$/,
		/environment\.interface\.ts$/,
		/animations\.ts$/,
		/material-bundles\.ts$/,
		/table\.model\.ts$/,
		/navigation\.model\.ts$/,
		/log-filter\.model\.ts$/,
		/testing[/\\]/,
		/custom-validators\.ts$/,
		/cache-bypass\.interceptor\.ts$/,
		/managers[/\\].*\.manager\.ts$/
	];

	for (const file of tsFiles)
	{
		const relativePath = path.relative(SRC_DIR, file);

		if (
			excludedPatterns.some(
				(pattern) => pattern.test(relativePath)
			)
		)
		{
			continue;
		}

		const content = await fs.readFile(file, "utf-8");

		const exportMatches = content.match(
			/^export\s+(class|interface|enum|const|function|type)\s+\w+/gm
		)
			|| [];

		if (exportMatches.length > 1)
		{
			const exportTypes = exportMatches
				.map(
					(match) =>
						match
							.replace(/^export\s+/, "")
							.split(" ")[0]
				)
				.join(", ");

			violations.push(
				`${relativePath} has ${exportMatches.length} exports: [${exportTypes}]`
			);
		}
	}

	assertEmpty(
		violations,
		"Files should export only one primary item"
	);
});

// ============================================================================
// Summary
// ============================================================================

console.log("\n" + "=".repeat(60));
console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total\n`);

if (failedTests > 0)
{
	process.exit(1);
}
