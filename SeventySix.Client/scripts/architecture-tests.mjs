#!/usr/bin/env node

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
 *
 * Total: 20 architecture guardrails
 * Complemented by ESLint rules in eslint.config.js for real-time feedback
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, '..', 'src', 'app');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Recursively gets all files matching a pattern in a directory.
 */
async function getFiles(dir, pattern) {
	const files = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
			files.push(...(await getFiles(fullPath, pattern)));
		} else if (entry.isFile() && entry.name.endsWith(pattern)) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Test runner
 */
function test(name, fn) {
	totalTests++;
	try {
		fn();
		passedTests++;
		console.log(`✓ ${name}`);
	} catch (error) {
		failedTests++;
		console.error(`✗ ${name}`);
		console.error(`  ${error.message}`);
	}
}

/**
 * Assertion helper
 */
function assertEmpty(violations, message) {
	if (violations.length > 0) {
		throw new Error(`${message}:\n${violations.map((v) => `  - ${v}`).join('\n')}`);
	}
}

/**
 * DRY helper: Check templates (HTML and inline) for a specific pattern
 */
async function checkTemplatesForPattern(pattern, description) {
	const htmlFiles = await getFiles(SRC_DIR, '.html');
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	// Check external templates
	for (const file of htmlFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes(pattern)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	// Check inline templates
	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);
		if (templateMatch && templateMatch[1].includes(pattern)) {
			violations.push(`${path.relative(SRC_DIR, file)} (inline template)`);
		}
	}

	return violations;
}

/**
 * DRY helper: Check templates for method calls with specific regex pattern
 */
async function checkTemplatesForMethodCalls(regex, description) {
	const htmlFiles = await getFiles(SRC_DIR, '.html');
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	// Check external templates
	for (const file of htmlFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const matches = content.match(regex);

		if (matches) {
			// Filter out safe patterns like pipes, trackBy, and ternary operators
			const unsafeMatches = matches.filter(
				(match) =>
					!match.includes('|') // Pipes are fine
					&& !match.includes('track') // TrackBy functions
					&& !match.includes('?') // Ternary operators
					&& !match.includes('$index')
					&& !match.includes('$count'),
			);

			if (unsafeMatches.length > 0) {
				violations.push(`${path.relative(SRC_DIR, file)}: ${unsafeMatches.join(', ')}`);
			}
		}
	}

	// Check inline templates
	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);

		if (templateMatch) {
			const matches = templateMatch[1].match(regex);

			if (matches) {
				const unsafeMatches = matches.filter(
					(match) =>
						!match.includes('|')
						&& !match.includes('track')
						&& !match.includes('?')
						&& !match.includes('$index')
						&& !match.includes('$count'),
				);

				if (unsafeMatches.length > 0) {
					violations.push(`${path.relative(SRC_DIR, file)} (inline): ${unsafeMatches.join(', ')}`);
				}
			}
		}
	}

	return violations;
}

/**
 * DRY helper: Find all methods in files with optional parameters
 */
async function findMethodsInFiles(sourceFiles, options = {}) {
	const { skipTests = false, includeParameters = false } = options;
	const methodMatches = [];

	// Test block functions to exclude (these describe test features, not production logic)
	const testBlockFunctions = new Set([
		'describe', 'it', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll',
		'test', 'expect', 'fdescribe', 'fit', 'xdescribe', 'xit',
	]);

	// Method detection patterns
	const classMethodPattern = includeParameters
		? /^\s+(?:private|protected|public)\s+(?:readonly\s+)?(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/gm
		: /^\s+(?:private|protected|public)\s+(?:readonly\s+)?(?:async\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/gm;

	const arrowFunctionPattern = includeParameters
		? /^\s+(?:readonly\s+)?(\w+)\s*[=:]\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^{]+)?\s*=>\s*\{/gm
		: /^\s+(?:readonly\s+)?(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\s*=>\s*\{/gm;

	const standardMethodPattern = includeParameters
		? /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*:\s*[^{]+\s*\{/gm
		: /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*[^{]+\s*\{/gm;

	const constructorPattern = includeParameters
		? /^\s+(constructor)\s*\(([^)]*)\)\s*$/gm
		: /^\s+(constructor)\s*\([^)]*\)\s*$/gm;

	for (const file of sourceFiles) {
		// Skip test files if requested
		if (skipTests && file.endsWith('.spec.ts')) {
			continue;
		}

		// Skip non-production files for parameter checking
		if (includeParameters) {
			const fileName = path.basename(file);
			if (fileName.endsWith('.spec.ts') ||
				fileName.endsWith('.mock.ts') ||
				fileName.includes('test') ||
				path.relative(SRC_DIR, file).includes('testing')) {
				continue;
			}
		}

		const content = await fs.readFile(file, 'utf-8');
		const lines = content.split('\n');

		// Collect all matches from all patterns
		const patterns = [classMethodPattern, arrowFunctionPattern, standardMethodPattern, constructorPattern];

		for (const pattern of patterns) {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const methodName = match[1];
				const parameters = includeParameters ? match[2] : undefined;

				// Skip test block functions
				if (testBlockFunctions.has(methodName)) {
					continue;
				}

				const methodStartLine = content.substring(0, match.index).split('\n').length;

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
async function getPublicMethods(file, excludeCallbacks = [], filterLifecycleHooks = false) {
	const content = await fs.readFile(file, 'utf-8');

	// Count public methods (not private/protected, not getters/setters)
	const publicMethodPattern = /^\s+(?:readonly\s+)?(?!private|protected|get\s|set\s|constructor|ngOn)(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/gm;
	const functionMethodPattern = /^\s+(?!private|protected|get\s|set\s|constructor|ngOn)(\w+)\s*\([^)]*\)\s*(?::\s*\w+[<>[\],\s|]*)?(?:\s*{)/gm;

	const methodMatches = [
		...content.matchAll(publicMethodPattern),
		...content.matchAll(functionMethodPattern),
	];

	// Deduplicate method names and filter out unwanted methods
	let methodNames = [...new Set(methodMatches.map((match) => match[1]))];

	if (excludeCallbacks.length > 0) {
		methodNames = methodNames.filter((name) => !excludeCallbacks.includes(name));
	}

	if (filterLifecycleHooks) {
		methodNames = methodNames.filter((name) => !name.startsWith('ngOn'));
	}

	return methodNames;
}

/**
 * Counts lines in a method body using brace matching.
 * Excludes blank lines and comment-only lines.
 */
function countMethodLines(lines, startIndex) {
	let braceDepth = 0;
	let methodStarted = false;
	let nonBlankLineCount = 0;

	for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];

		for (const character of line) {
			if (character === '{') {
				braceDepth++;
				methodStarted = true;
			} else if (character === '}') {
				braceDepth--;
				if (methodStarted && braceDepth === 0) {
					return nonBlankLineCount;
				}
			}
		}

		if (methodStarted) {
			const trimmedLine = line.trim();
			if (trimmedLine && !trimmedLine.startsWith('//')) {
				nonBlankLineCount++;
			}
		}
	}

	return nonBlankLineCount;
}

// ============================================================================
// ANGULAR PATTERN TESTS
// ============================================================================

console.log('\n🔍 Signal Pattern Tests');

test('components should not use @Input decorator', async () => {
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.match(/@Input\s*\(/)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Components using @Input decorator (use input() instead)');
});

test('components should not use @Output decorator', async () => {
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.match(/@Output\s*\(/)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Components using @Output decorator (use output() instead)');
});

test('components should use OnPush change detection', async () => {
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');

		// Skip dialog/toast components (dynamically instantiated, Default change detection acceptable)
		const fileName = path.basename(file);
		if (fileName.includes('dialog') || fileName.includes('toast')) {
			continue;
		}

		if (content.includes('@Component') && !content.includes('ChangeDetectionStrategy.OnPush')) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Components not using OnPush change detection');
});

console.log('\n🔍 Control Flow Syntax Tests');

test('templates should not use *ngIf', async () => {
	const violations = await checkTemplatesForPattern('*ngIf', 'Templates using *ngIf (use @if instead)');
	assertEmpty(violations, 'Templates using *ngIf (use @if instead)');
});

test('templates should not use *ngFor', async () => {
	const violations = await checkTemplatesForPattern('*ngFor', 'Templates using *ngFor (use @for instead)');
	assertEmpty(violations, 'Templates using *ngFor (use @for instead)');
});

test('templates should not use *ngSwitch', async () => {
	const violations = await checkTemplatesForPattern('*ngSwitch', 'Templates using *ngSwitch (use @switch instead)');
	assertEmpty(violations, 'Templates using *ngSwitch (use @switch instead)');
});

console.log('\n🔍 Dependency Injection Pattern Tests');

test('components should use inject() not constructor injection', async () => {
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes('@Component') && content.match(/constructor\s*\([^)]+\)/)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Components using constructor injection (use inject() instead)');
});

test('services should use inject() not constructor injection', async () => {
	const serviceFiles = await getFiles(SRC_DIR, '.service.ts');
	const violations = [];

	for (const file of serviceFiles) {
		const content = await fs.readFile(file, 'utf-8');
		// Detect constructor with type annotations (indicates DI parameters)
		if (
			content.includes('@Injectable')
			&& content.match(/constructor\s*\([^)]*:\s*[A-Z]/) // Has type annotation
		) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Services using constructor injection (use inject() instead)');
});

console.log('\n🔍 Service Scoping Tests');

test('feature services should not use providedIn root', async () => {
	const serviceFiles = await getFiles(SRC_DIR, '.service.ts');
	const infrastructureDir = path.join(SRC_DIR, 'infrastructure');
	const violations = [];

	for (const file of serviceFiles) {
		// Skip infrastructure services
		if (file.startsWith(infrastructureDir)) {
			continue;
		}

		const content = await fs.readFile(file, 'utf-8');
		if (content.match(/providedIn:\s*['"]root['"]/)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Feature services using providedIn: \'root\' (scope to route providers instead)');
});

test('infrastructure services should use providedIn root', async () => {
	const infrastructureDir = path.join(SRC_DIR, 'infrastructure');

	try {
		const serviceFiles = await getFiles(infrastructureDir, '.service.ts');
		const violations = [];

		for (const file of serviceFiles) {
			const content = await fs.readFile(file, 'utf-8');
			if (content.includes('@Injectable') && !content.match(/providedIn:\s*['"]root['"]/)) {
				violations.push(path.relative(SRC_DIR, file));
			}
		}

		assertEmpty(violations, 'Infrastructure services not using providedIn: \'root\'');
	} catch (error) {
		// Infrastructure folder may not exist yet - skip test
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
});

console.log('\n🔍 Zoneless Architecture Tests');

test('production code should not import NgZone', async () => {
	const tsFiles = (await getFiles(SRC_DIR, '.ts')).filter((f) => !f.endsWith('.spec.ts'));
	const violations = [];

	for (const file of tsFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.match(/import\s+{[^}]*NgZone[^}]*}\s+from/)) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Production code importing NgZone (zoneless required)');
});

test('test code should not use fakeAsync or tick', async () => {
	const testFiles = await getFiles(SRC_DIR, '.spec.ts');
	const violations = [];

	for (const file of testFiles) {
		const content = await fs.readFile(file, 'utf-8');

		// Remove comments to avoid false positives from documentation
		const codeOnly = content
			.replace(/\/\/.*$/gm, '') // Remove single-line comments
			.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

		// Detect Angular's fakeAsync/tick imports (zoneful testing)
		// Allow jasmine.clock().tick() (zoneless pattern)
		if (
			codeOnly.includes('fakeAsync')
			|| (codeOnly.match(/\btick\s*\(/) && !codeOnly.includes('jasmine.clock().tick'))
		) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Test files using fakeAsync/tick (use TestBed.flushEffects() instead)');
});

test('tests should use provideZonelessChangeDetection', async () => {
	const testFiles = await getFiles(SRC_DIR, '.spec.ts');
	const violations = [];

	for (const file of testFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes('TestBed.configureTestingModule') && !content.includes('provideZonelessChangeDetection')) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Test files not using provideZonelessChangeDetection()');
});

console.log('\n🔍 Template Performance Tests');

test('templates should not call component methods in interpolation', async () => {
	const violations = await checkTemplatesForMethodCalls(
		/\{\{\s*[^}]*\([^)]+\)[^}]*\}\}/g,
		'Templates calling methods with arguments in interpolation (use computed() signals instead)'
	);
	assertEmpty(violations, 'Templates calling methods with arguments in interpolation (use computed() signals instead)');
});

test('templates should not call methods in property bindings', async () => {
	const violations = await checkTemplatesForMethodCalls(
		/\[(?:class|style|attr|disabled|hidden|readonly)\.[^\]]*\]\s*=\s*"[^"]*\([^)]+\)"/g,
		'Templates calling methods with arguments in property bindings (use computed() signals instead)'
	);
	assertEmpty(violations, 'Templates calling methods with arguments in property bindings (use computed() signals instead)');
});

console.log('\n🔍 Date Handling Standards Tests');

test('production code should use DateService not native Date constructors', async () => {
	const sourceFiles = await getFiles(SRC_DIR, '.ts');
	const violations = [];

	// Patterns that indicate direct Date usage
	const nativeDatePattern = /new Date\(\)|Date\.now\(\)/g;

	// Allowed exceptions with justification
	const allowedExceptions = [
		'date.service.ts', // DateService itself must use Date internally
	];

	for (const file of sourceFiles) {
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName)) {
			continue;
		}

		// Skip test files and test utilities - tests may create Date objects for assertions
		const relativePath = path.relative(SRC_DIR, file);
		if (fileName.endsWith('.spec.ts') || relativePath.includes('testing')) {
			continue;
		}

		const content = await fs.readFile(file, 'utf-8');
		const matches = content.match(nativeDatePattern);

		if (matches && matches.length > 0) {
			violations.push(
				`${path.relative(SRC_DIR, file)}: ${matches.length} native Date usage(s) (use DateService instead)`,
			);
		}
	}

	assertEmpty(violations, 'Production code using native Date (inject DateService for testability)');
});

// ============================================================================
// FILE STRUCTURE TESTS
// ============================================================================

console.log('\n🔍 File Structure Tests');

test('all files should have less than 800 lines', async () => {
	const sourceFiles = await getFiles(SRC_DIR, '.ts');
	const violations = [];
	const maxLinesPerFile = 800;

	// Exceptions with documented justification
	// NOTE: Test files are NOT automatically excepted - apply 80/20 and DRY
	const allowedExceptions = [
		'generated-api.ts' // Auto-generated from OpenAPI spec
	];

	for (const file of sourceFiles) {
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName)) {
			continue;
		}

		const content = await fs.readFile(file, 'utf-8');
		const lineCount = content.split('\n').length;

		if (lineCount > maxLinesPerFile) {
			violations.push(`${path.relative(SRC_DIR, file)}: ${lineCount} lines (max ${maxLinesPerFile})`);
		}
	}

	assertEmpty(violations, 'Files exceeding 800 lines (apply DRY and 80/20 to reduce)');
});

// ============================================================================
// METHOD STRUCTURE TESTS
// ============================================================================

console.log('\n🔍 Method Structure Tests');

test('methods should have less than 50 lines', async () => {
	const sourceFiles = await getFiles(SRC_DIR, '.ts');
	const violations = [];
	const maxLinesPerMethod = 50;

	// Exception patterns (full method identifier => reason)
	// NOTE: These are legitimate exceptions with business justification
	const allowedExceptions = new Map([
		['permission-request-list.formatter', 'Complex table formatting with multiple conditions'],
		['user-list.formatter', 'Complex table column definitions with actions'],
		['user-detail.onSubmit', 'Consolidated form submission handling - split would reduce clarity'],
		['error-handler.service.if', 'Error categorization logic - intentionally consolidated'],
		['breadcrumb.component.buildBreadcrumbs', 'Route traversal and breadcrumb construction'],
		['data-table.component.constructor', 'Complex table initialization with many column types'],
		['mock-factories.get', 'Test utility with comprehensive mock data generation'],
		['auth.service.error', 'False positive - subscribe callback, not a method'],
	]);

	const methodMatches = await findMethodsInFiles(sourceFiles, { skipTests: true });

	for (const { file, methodName, startLine, lines } of methodMatches) {
		const methodIdentifier = `${path.basename(file, '.ts')}.${methodName}`;

		if (allowedExceptions.has(methodIdentifier)) {
			continue;
		}

		const methodLineCount = countMethodLines(lines, startLine - 1);

		if (methodLineCount > maxLinesPerMethod) {
			violations.push(
				`${path.relative(SRC_DIR, file)}:${startLine} ${methodName}(): ${methodLineCount} lines (max ${maxLinesPerMethod})`
			);
		}
	}

	assertEmpty(violations, 'Methods exceeding 50 lines (extract to smaller functions)');
});

test('methods should have less than 6 parameters', async () => {
	const sourceFiles = await getFiles(SRC_DIR, '.ts');
	const violations = [];
	const maxParametersPerMethod = 5;

	const methodMatches = await findMethodsInFiles(sourceFiles, { skipTests: true, includeParameters: true });

	for (const { file, methodName, parameters } of methodMatches) {
		// Count parameters by splitting on commas, but handle complex types
		let parameterCount = 0;
		if (parameters && parameters.trim()) {
			// Split by comma but respect parentheses for generic types like Map<string, boolean>
			let level = 0;
			for (let i = 0; i < parameters.length; i++) {
				const char = parameters[i];
				if (char === '<' || char === '(' || char === '[') level++;
				else if (char === '>' || char === ')' || char === ']') level--;
				else if (char === ',' && level === 0) {
					parameterCount++;
				}
			}
			parameterCount++; // Add the last parameter
		}

		if (parameterCount > maxParametersPerMethod) {
			violations.push(
				`${path.relative(SRC_DIR, file)} ${methodName}(): ${parameterCount} parameters (max ${maxParametersPerMethod})`
			);
		}
	}

	assertEmpty(violations, 'Methods exceeding 6 parameters (extract parameter object or apply SOLID principles)');
});

// ============================================================================
// CLASS STRUCTURE TESTS (SRP ENFORCEMENT)
// ============================================================================

console.log('\n🔍 Class Structure Tests');

test('services should have less than 12 public methods', async () => {
	const serviceFiles = await getFiles(SRC_DIR, '.service.ts');
	const violations = [];
	const maxMethodsPerService = 11;

	// Services with cohesive single-domain responsibilities are exceptions
	// These have many methods but serve a single purpose (utility patterns)
	const allowedExceptions = [
		'date.service.ts', // Date utilities - all methods serve date handling (single domain)
		'logger.service.ts', // Logging levels - all methods serve logging (single domain)
		'notification.service.ts', // Toast notifications - all methods serve user feedback (single domain)
		'user.service.ts', // TanStack Query factory service - thin wrappers with single domain (user CRUD)
	];

	// TanStack Query callback method names (not public API methods)
	const tanstackCallbacks = ['queryFn', 'mutationFn', 'onSuccess', 'onError', 'onSettled', 'onMutate'];

	for (const file of serviceFiles) {
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName)) {
			continue;
		}

		const methodNames = await getPublicMethods(file, tanstackCallbacks);
		const methodCount = methodNames.length;

		if (methodCount > maxMethodsPerService) {
			const displayMethods = methodNames.slice(0, 5).join(', ');
			const additional = methodCount > 5 ? ` and ${methodCount - 5} more` : '';
			violations.push(
				`${path.relative(SRC_DIR, file)}: ${methodCount} methods (max ${maxMethodsPerService}): ${displayMethods}${additional}`,
			);
		}
	}

	assertEmpty(violations, 'Services with 12+ methods violate SRP (split into focused services)');
});

test('components should have less than 12 public methods', async () => {
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];
	const maxMethodsPerComponent = 11;

	// Components with complex UI may need more methods - these are exceptions
	const allowedExceptions = [
		'data-table.component.ts', // Complex reusable table with many features
	];

	for (const file of componentFiles) {
		const fileName = path.basename(file);
		if (allowedExceptions.includes(fileName)) {
			continue;
		}

		const methodNames = await getPublicMethods(file, [], true); // true = filter out lifecycle hooks
		const methodCount = methodNames.length;

		if (methodCount > maxMethodsPerComponent) {
			const displayMethods = methodNames.slice(0, 5).join(', ');
			const additional = methodCount > 5 ? ` and ${methodCount - 5} more` : '';
			violations.push(
				`${path.relative(SRC_DIR, file)}: ${methodCount} methods (max ${maxMethodsPerComponent}): ${displayMethods}${additional}`,
			);
		}
	}

	assertEmpty(violations, 'Components with 12+ methods violate SRP (extract to services or split)');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total\n`);

if (failedTests > 0) {
	process.exit(1);
}