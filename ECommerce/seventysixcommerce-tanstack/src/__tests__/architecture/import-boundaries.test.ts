import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractImports, getFileInfo, scanSourceFiles } from "./helpers/file-scanner";

const SRC_DIR: string =
	join(process.cwd(), "src");

describe("Import Boundaries",
	() =>
	{
		describe("No cross-route imports",
			() =>
			{
				it("route files do not import from other route files",
					() =>
					{
						const routeFiles: string[] =
							scanSourceFiles(
								SRC_DIR,
								[".tsx"])
								.filter((file: string) =>
									file.startsWith("routes/")
										&& !file.includes("__tests__"));
						const violations: string[] = [];

						for (const file of routeFiles)
						{
							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const imports: string[] =
								extractImports(content);

							const crossRouteImports: string[] =
								imports.filter((imp: string) =>
									imp.startsWith("~/routes/")
										|| imp.match(/^\.\.?\/.*\.(tsx)$/));

							if (crossRouteImports.length > 0)
							{
								violations.push(
									`${file} imports: ${crossRouteImports.join(", ")}`);
							}
						}

						expect(
							violations,
							`Cross-route imports found:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("No direct DB imports in route components",
			() =>
			{
				it("route components do not import from ~/server/db/",
					() =>
					{
						const routeFiles: string[] =
							scanSourceFiles(
								SRC_DIR,
								[".tsx"])
								.filter((file: string) =>
									file.startsWith("routes/"));
						const violations: string[] = [];

						for (const file of routeFiles)
						{
							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const imports: string[] =
								extractImports(content);
							const dbImports: string[] =
								imports.filter((imp: string) =>
									imp.startsWith("~/server/db"));

							if (dbImports.length > 0)
							{
								violations.push(
									`${file} imports: ${dbImports.join(", ")}`);
							}
						}

						expect(
							violations,
							`Route components importing DB directly:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});
	});