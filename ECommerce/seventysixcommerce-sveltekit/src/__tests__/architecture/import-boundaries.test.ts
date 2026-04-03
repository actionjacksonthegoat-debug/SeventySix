import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractImports, getFileInfo, scanSourceFiles } from "./helpers/file-scanner";

const SRC_DIR: string =
	join(process.cwd(), "src");

describe("Import Boundaries",
	() =>
	{
		describe("Server/client boundary",
			() =>
			{
				it("client-side Svelte files do not import from $lib/server/",
					() =>
					{
						const svelteFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".svelte"]);
						const violations: string[] = [];

						for (const file of svelteFiles)
						{
							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const imports: string[] =
								extractImports(content);
							const serverImports: string[] =
								imports.filter((imp: string) =>
									imp.startsWith("$lib/server"));

							if (serverImports.length > 0)
							{
								violations.push(
									`${file} imports: ${serverImports.join(", ")}`);
							}
						}

						expect(
							violations,
							`Client files importing server code:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});

		describe("No cross-route imports",
			() =>
			{
				it("route files do not import from other route directories",
					() =>
					{
						const routeFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".ts", ".svelte"])
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
							const routeDir: string =
								file.substring(0, file.lastIndexOf("/"));

							const crossRouteImports: string[] =
								imports.filter(
									(imp: string) =>
									{
										if (!imp.startsWith("../") && !imp.startsWith("./"))
										{
											return false;
										}
										const resolved: string =
											join(routeDir, imp)
												.replace(/\\/g, "/");
										return resolved.startsWith("routes/")
											&& !resolved.startsWith(routeDir);
									});

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

		describe("No direct DB imports in Svelte components",
			() =>
			{
				it("Svelte files do not directly import from $lib/server/db/",
					() =>
					{
						const svelteFiles: string[] =
							scanSourceFiles(SRC_DIR,
								[".svelte"]);
						const violations: string[] = [];

						for (const file of svelteFiles)
						{
							const { content } =
								getFileInfo(join(SRC_DIR, file));
							const imports: string[] =
								extractImports(content);
							const dbImports: string[] =
								imports.filter((imp: string) =>
									imp.startsWith("$lib/server/db"));

							if (dbImports.length > 0)
							{
								violations.push(
									`${file} imports: ${dbImports.join(", ")}`);
							}
						}

						expect(
							violations,
							`Svelte files importing DB directly:\n${violations.join("\n")}`)
							.toEqual([]);
					});
			});
	});