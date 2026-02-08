/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import tsconfigPaths from "vite-tsconfig-paths";

const srcRoot: string =
	path.resolve(__dirname, "src");

export default defineConfig(({ mode }) => {
	console.log("Vite mode:", mode);
	const envFile: string =
		mode === "test" ? "environments/environment.test.ts" : "environments/environment.ts";
	console.log("Environment file:", path.join(srcRoot, envFile));

	// Resolve tsconfig explicitly for the Angular plugin to avoid resolver warnings
	const tsconfigPath: string =
		mode === "test"
			? path.resolve(__dirname, "tsconfig.spec.json")
			: path.resolve(__dirname, "tsconfig.json");

	return {
	plugins: [
		tsconfigPaths({ root: __dirname }),
		angular({ tsconfig: tsconfigPath }),
	],
	resolve: {
		alias: [
			{
				// Dynamic environment file swap (mode-dependent — cannot be in tsconfig)
				find: /^@environments\/environment$/,
				replacement: path.join(srcRoot, envFile),
			},
		],
	},
	test: {
		globals: true,
		setupFiles: ["src/test-setup.ts"],
		environment: "happy-dom",
		environmentOptions:
		{
			happyDOM:
			{
				// Disable Happy-DOM navigation/fetch for iframes to prevent network errors
				settings:
				{
					navigation:
					{
						disableMainFrameNavigation: true,
						disableChildFrameNavigation: true,
						disableFallbackToSetURL: true,
					},
					fetch:
					{
						disableSameOriginPolicy: true,
					},
				},
			},
		},
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: [
			"e2e/**/*",
			"node_modules/**/*",
			// Exclude the environment config file from being treated as a test file
			"src/environments/environment.test.ts",
		],
		reporters: ["default"],
		onConsoleLog(log: string): boolean | void
		{
			// Suppress IFrame Navigation Errors.
			const suppressPatterns: string[] =
				[
					"localhost:3000",
					"localhost:16686"
				];

			if (suppressPatterns.some(
				(pattern: string) => log.includes(pattern)))
			{
				return false;
			}
		},
		coverage: {
			provider: "v8",
			reporter: [
				"text",
				"html",
				"lcov",
			],
			include: ["src/app/**/*.ts"],
			exclude: [
				"src/**/*.spec.ts",
				"src/app/shared/testing/**",
				"src/**/*.mock.ts",
				"src/**/index.ts",
			],
			thresholds:
			{
				statements: 60,
				branches: 60,
				functions: 60,
				lines: 60,
			},
		},
	},
};
});
