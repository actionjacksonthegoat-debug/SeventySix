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
 *
 * Total: 13 architecture guardrails
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

// ============================================================================
// Signal Pattern Tests
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

// ============================================================================
// Control Flow Tests
// ============================================================================

console.log('\n🔍 Control Flow Syntax Tests');

test('templates should not use *ngIf', async () => {
	const htmlFiles = await getFiles(SRC_DIR, '.html');
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	// Check external templates
	for (const file of htmlFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes('*ngIf')) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	// Check inline templates
	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);
		if (templateMatch && templateMatch[1].includes('*ngIf')) {
			violations.push(`${path.relative(SRC_DIR, file)} (inline template)`);
		}
	}

	assertEmpty(violations, 'Templates using *ngIf (use @if instead)');
});

test('templates should not use *ngFor', async () => {
	const htmlFiles = await getFiles(SRC_DIR, '.html');
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	// Check external templates
	for (const file of htmlFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes('*ngFor')) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	// Check inline templates
	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);
		if (templateMatch && templateMatch[1].includes('*ngFor')) {
			violations.push(`${path.relative(SRC_DIR, file)} (inline template)`);
		}
	}

	assertEmpty(violations, 'Templates using *ngFor (use @for instead)');
});

test('templates should not use *ngSwitch', async () => {
	const htmlFiles = await getFiles(SRC_DIR, '.html');
	const componentFiles = await getFiles(SRC_DIR, '.component.ts');
	const violations = [];

	// Check external templates
	for (const file of htmlFiles) {
		const content = await fs.readFile(file, 'utf-8');
		if (content.includes('*ngSwitch')) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	// Check inline templates
	for (const file of componentFiles) {
		const content = await fs.readFile(file, 'utf-8');
		const templateMatch = content.match(/template:\s*[`']([^`']*)[`']/s);
		if (templateMatch && templateMatch[1].includes('*ngSwitch')) {
			violations.push(`${path.relative(SRC_DIR, file)} (inline template)`);
		}
	}

	assertEmpty(violations, 'Templates using *ngSwitch (use @switch instead)');
});

// ============================================================================
// Dependency Injection Tests
// ============================================================================

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
		// Positive match: constructor(private foo: Foo)
		// Negative match: constructor() or constructor (in comment)
		if (
			content.includes('@Injectable')
			&& content.match(/constructor\s*\([^)]*:\s*[A-Z]/) // Has type annotation
		) {
			violations.push(path.relative(SRC_DIR, file));
		}
	}

	assertEmpty(violations, 'Services using constructor injection (use inject() instead)');
});

// ============================================================================
// Service Scoping Tests
// ============================================================================

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

// ============================================================================
// Zoneless Tests
// ============================================================================

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

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed, ${totalTests} total\n`);

if (failedTests > 0) {
	process.exit(1);
}
