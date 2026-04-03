import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFileInfo, scanSourceFiles } from "./helpers/file-scanner";

const SRC_DIR: string =
	join(process.cwd(), "src");

/** Files excluded from the god-file check with justification. */
const GOD_FILE_ALLOWLIST: string[] = [];

describe("File Structure",
	() =>
	{
		describe("God file check",
			() =>
			{
				it("no source file exceeds 799 lines",
					() =>
					{
						const files: string[] =
							scanSourceFiles(SRC_DIR)
								.filter((file: string) =>
									!file.includes("__tests__"));
						const violations: string[] = [];

						for (const file of files)
						{
							if (GOD_FILE_ALLOWLIST.includes(file))
							{
								continue;
							}

							const { lineCount } =
								getFileInfo(join(SRC_DIR, file));

							if (lineCount > 799)
							{
								violations.push(`${file} (${lineCount} lines)`);
							}
						}

						expect(
							violations,
							`God files found:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("Route structure",
			() =>
			{
				it("all route files follow SvelteKit conventions",
					() =>
					{
						const routeFiles: string[] =
							scanSourceFiles(SRC_DIR)
								.filter((file: string) =>
									file.startsWith("routes/"));

						const validPatterns: RegExp =
							/\+(?:page|layout|server|error|page\.server|layout\.server)\.(?:ts|svelte)$/;
						const violations: string[] =
							routeFiles.filter((file: string) =>
								!validPatterns.test(file)
									&& !file.includes("__tests__"));

						expect(
							violations,
							`Non-standard route files:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("Lib structure",
			() =>
			{
				it("shared library code is under src/lib/",
					() =>
					{
						const libFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".ts"])
								.filter((file: string) =>
									file.startsWith("lib/"));

						expect(libFiles.length)
							.toBeGreaterThan(0);
					});
			});

		describe("No orphan files",
			() =>
			{
				/** Allowed files directly in src/ (SvelteKit conventions). */
				const ALLOWED_ROOT_FILES: string[] =
					["app.d.ts", "app.css", "app.html", "hooks.server.ts", "hooks.client.ts"];

				it("no unexpected .ts/.svelte files directly in src/",
					() =>
					{
						const rootFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".ts", ".svelte"])
								.filter((file: string) => !file.includes("/"));
						const violations: string[] =
							rootFiles.filter((file: string) =>
								!ALLOWED_ROOT_FILES.includes(file));

						expect(
							violations,
							`Orphan files in src/:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});
	});