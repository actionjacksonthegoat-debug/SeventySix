import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const EXCLUDED_DIRS: ReadonlyArray<string> =
	["node_modules", ".output", ".vinxi", "build", "coverage"];

/**
 * Recursively scans a directory for source files matching the given extensions.
 * Returns paths relative to the root directory.
 */
export function scanSourceFiles(
	rootDir: string,
	extensions: string[] = [".ts", ".tsx"],
	excludeDirs: ReadonlyArray<string> = EXCLUDED_DIRS): string[]
{
	const results: string[] = [];

	function walk(dir: string): void
	{
		for (const entry of readdirSync(dir,
			{ withFileTypes: true }))
		{
			const fullPath: string =
				join(dir, entry.name);

			if (entry.isDirectory())
			{
				if (!excludeDirs.includes(entry.name))
				{
					walk(fullPath);
				}
				continue;
			}

			if (extensions.some((ext: string) =>
				entry.name.endsWith(ext)))
			{
				results.push(
					relative(rootDir, fullPath)
						.replace(/\\/g, "/"));
			}
		}
	}

	walk(rootDir);
	return results.sort();
}

/**
 * Reads a file and returns its content and line count.
 */
export function getFileInfo(filePath: string): { content: string; lineCount: number; }
{
	const content: string =
		readFileSync(filePath, "utf-8");
	const lineCount: number =
		content.split("\n").length;
	return { content, lineCount };
}

/**
 * Counts exported functions and named constants (excluding types/interfaces) in a file.
 */
export function countExports(content: string): number
{
	const exportPattern: RegExp =
		/^export\s+(?:function|const|class|enum)\s+/gm;
	const matches: RegExpMatchArray | null =
		content.match(exportPattern);
	return matches?.length ?? 0;
}

/**
 * Extracts exported function declarations and measures their line lengths using brace counting.
 */
export function extractFunctionLengths(content: string): Array<{ name: string; lineCount: number; }>
{
	const results: Array<{ name: string; lineCount: number; }> = [];
	const lines: string[] =
		content.split("\n");

	for (let idx: number = 0; idx < lines.length; idx++)
	{
		const line: string =
			lines[idx];
		const funcMatch: RegExpMatchArray | null =
			line.match(
				/^export\s+(?:async\s+)?function\s+(\w+)/);
		const arrowMatch: RegExpMatchArray | null =
			!funcMatch
				? line.match(/^export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/)
				: null;

		const name: string | undefined =
			funcMatch?.[1] ?? arrowMatch?.[1];
		if (!name)
		{
			continue;
		}

		let braceCount: number = 0;
		let started: boolean = false;
		let endLine: number = idx;

		for (let jdx: number = idx; jdx < lines.length; jdx++)
		{
			for (const char of lines[jdx])
			{
				if (char === "{")
				{
					braceCount++;
					started = true;
				}
				else if (char === "}")
				{
					braceCount--;
				}
			}

			if (started && braceCount === 0)
			{
				endLine = jdx;
				break;
			}
		}

		const lineCount: number =
			endLine - idx + 1;
		results.push(
			{ name, lineCount });
	}

	return results;
}

/**
 * Extracts all import source paths from a TypeScript file.
 * Returns the string values from import declarations (e.g., "~/server/db").
 */
export function extractImports(content: string): string[]
{
	const importPattern: RegExp =
		/import\s+.*?\s+from\s+["']([^"']+)["']/g;
	const results: string[] = [];
	let match: RegExpExecArray | null;

	while ((match =
		importPattern.exec(content)) !== null)
	{
		results.push(match[1]);
	}

	return results;
}