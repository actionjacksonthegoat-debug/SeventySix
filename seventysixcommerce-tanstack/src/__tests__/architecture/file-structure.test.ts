import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFileInfo, scanSourceFiles } from "./helpers/file-scanner";

const SRC_DIR: string =
	join(process.cwd(), "src");

/** Files excluded from the god-file check with justification. */
const GOD_FILE_ALLOWLIST: string[] = [];

/** Allowed entry-point files directly in src/. */
const ALLOWED_ROOT_FILES: string[] =
	[
		"start.ts",
		"server.ts",
		"router.tsx",
		"client.tsx",
		"vite-env.d.ts",
		"routeTree.gen.ts"
	];

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
									!file.includes("__tests__")
										&& !file.endsWith(".gen.ts"));
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

		describe("Server structure",
			() =>
			{
				it("server-side code is under src/server/",
					() =>
					{
						const serverFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".ts"])
								.filter((file: string) =>
									file.startsWith("server/")
										&& !file.includes("__tests__"));

						expect(serverFiles.length)
							.toBeGreaterThan(0);
					});
			});

		describe("No orphan files",
			() =>
			{
				it("no unexpected .ts/.tsx files directly in src/",
					() =>
					{
						const rootFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".ts", ".tsx"])
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