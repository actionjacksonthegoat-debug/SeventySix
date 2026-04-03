import { defineConfig } from "vitest/config";

/** Vitest configuration for SeventySixCommerce shared package. */
export default defineConfig(
	{
		test:
		{
			environment: "jsdom",
			include: ["src/**/*.test.ts"],
			globals: true,
			coverage:
			{
				provider: "v8",
				reportsDirectory: "./coverage",
				reporter: ["text", "lcov"]
			}
		}
	});
