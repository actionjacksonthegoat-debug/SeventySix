import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { countExports, extractFunctionLengths, getFileInfo, scanSourceFiles } from "./helpers/file-scanner";

/** Server mock infrastructure — complex mock setup exceeds 79-line threshold by design. */
const GOD_FUNCTION_ALLOWLIST: ReadonlyArray<string> =
	["server/lib/mock-stripe.ts"];

/** Constants files naturally have many named exports. */
const GOD_MODULE_ALLOWLIST: ReadonlyArray<string> =
	["lib/constants.ts"];

/** Seed scripts need console output for progress reporting. */
const CONSOLE_LOG_ALLOWLIST: ReadonlyArray<string> =
	["server/db/seed.ts"];

const SRC_DIR: string =
	join(process.cwd(), "src");

describe("Code Quality",
	() =>
	{
		const sourceFiles: string[] =
			scanSourceFiles(
				SRC_DIR,
				[".ts", ".tsx"])
				.filter((file: string) =>
					!file.includes("__tests__")
						&& !file.endsWith(".d.ts")
						&& !file.endsWith(".test.ts")
						&& !file.endsWith(".test.tsx")
						&& !file.endsWith(".gen.ts"));

		describe("God function check",
			() =>
			{
				it("no exported function exceeds 79 lines",
					() =>
					{
						const violations: string[] = [];

						for (const file of sourceFiles)
						{
							if (GOD_FUNCTION_ALLOWLIST.some((allowed: string) =>
								file.endsWith(allowed)))
							{
								continue;
							}

							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const functions =
								extractFunctionLengths(content);

							for (const func of functions)
							{
								if (func.lineCount > 79)
								{
									violations.push(
										`${file}::${func.name} (${func.lineCount} lines)`);
								}
							}
						}

						expect(
							violations,
							`God functions found:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("God module check",
			() =>
			{
				it("no module exports more than 11 functions/constants",
					() =>
					{
						const violations: string[] = [];

						for (const file of sourceFiles)
						{
							if (GOD_MODULE_ALLOWLIST.some((allowed: string) =>
								file.endsWith(allowed)))
							{
								continue;
							}

							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const exportCount: number =
								countExports(content);

							if (exportCount > 11)
							{
								violations.push(
									`${file} (${exportCount} exports)`);
							}
						}

						expect(
							violations,
							`God modules found:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("No console.log",
			() =>
			{
				it("source files must not contain console.log",
					() =>
					{
						const violations: string[] = [];

						for (const file of sourceFiles)
						{
							if (CONSOLE_LOG_ALLOWLIST.some((allowed: string) =>
								file.endsWith(allowed)))
							{
								continue;
							}

							const { content } =
								getFileInfo(join(SRC_DIR, file));

							if (/\bconsole\.log\b/.test(content))
							{
								violations.push(file);
							}
						}

						expect(
							violations,
							`Files with console.log:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("Variable naming",
			() =>
			{
				it("no single-character variable declarations outside loops",
					() =>
					{
						const violations: string[] = [];
						const singleCharPattern: RegExp =
							/\b(?:const|let)\s+([a-z])\s*[=:]/g;
						const allowedVars: ReadonlyArray<string> =
							["i", "j", "k", "_"];

						for (const file of sourceFiles)
						{
							const { content } =
								getFileInfo(join(SRC_DIR, file));
							let match: RegExpExecArray | null;

							while ((match =
								singleCharPattern.exec(content)) !== null)
							{
								if (!allowedVars.includes(match[1]))
								{
									violations.push(
										`${file}: variable "${match[1]}"`);
								}
							}
						}

						expect(
							violations,
							`Single-char variables:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});
	});