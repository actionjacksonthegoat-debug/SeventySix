import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: parser,
			parserOptions: {
				project: "./tsconfig.app.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_"
				}
			],
			"@typescript-eslint/typedef": [
				"error",
				{
					variableDeclaration: true,
					propertyDeclaration: true,
					memberVariableDeclaration: true
				}
			],
			"no-console": [
				"warn",
				{
					allow: ["warn", "error"]
				}
			]
		}
	},
	{
		files: ["src/**/*.component.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: [
								"**/repositories",
								"**/repositories/*",
								"@*/repositories",
								"@*/repositories/*"
							],
							message:
								"Components must not import repositories directly. Use services instead (Service Façade pattern)."
						}
					]
				}
			]
		}
	},
	{
		ignores: ["dist/**", "node_modules/**", "coverage/**", "**/*.spec.ts"]
	}
];
