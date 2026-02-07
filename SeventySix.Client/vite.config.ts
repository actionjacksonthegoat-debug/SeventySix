/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

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
		angular({ tsconfig: tsconfigPath }),
	],
	resolve: {
		alias: [
			{
				find: /^@environments\/environment$/,
				replacement: path.join(srcRoot, envFile),
			},
			{
				find: /^@shared(\/.*)?$/,
				replacement: `${srcRoot}/app/shared$1`,
			},
			{
				find: /^@testing(\/.*)?$/,
				replacement: `${srcRoot}/app/shared/testing$1`,
			},
			{
				find: /^@admin(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/admin$1`,
			},
			{
				find: /^@sandbox(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/sandbox$1`,
			},
			{
				find: /^@auth(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/auth$1`,
			},
			{
				find: /^@account(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/account$1`,
			},
			{
				find: /^@home(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/home$1`,
			},
			{
				find: /^@developer(\/.*)?$/,
				replacement: `${srcRoot}/app/domains/developer$1`,
			},
			{
				find: /^@integration(\/.*)?$/,
				replacement: `${srcRoot}/app/integrations$1`,
			},
			{
				find: /^@environments(\/.*)?$/,
				replacement: `${srcRoot}/environments$1`,
			},
			{
				find: /^@assets(\/.*)?$/,
				replacement: `${srcRoot}/app/assets$1`,
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
