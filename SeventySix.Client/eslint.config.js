import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";
import assignmentNewline from "./eslint-rules/assignment-newline.js";
import arrowBodyNewline from "./eslint-rules/arrow-body-newline.js";
import closingAngleSameLine from "./eslint-rules/closing-angle-same-line.js";
import closingParenSameLine from "./eslint-rules/closing-paren-same-line.js";
import operatorContinuationIndent from "./eslint-rules/operator-continuation-indent.js";

// Shared rules for all TypeScript files
const sharedRules = {
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
	],
	"@stylistic/operator-linebreak": [
		"error",
		"before",
		{
			overrides: {
				"=": "after",
				"+=": "after",
				"-=": "after"
			}
		}
	],
	"@stylistic/function-call-argument-newline": ["error", "consistent"],
	"@stylistic/newline-per-chained-call": [
		"error",
		{
			ignoreChainWithDepth: 1
		}
	],
	"local/assignment-newline": "error",
	"local/arrow-body-newline": ["error", { "maxLength": 40 }],
	"local/closing-angle-same-line": "error",
	"local/closing-paren-same-line": "error",
	"local/operator-continuation-indent": "error",
	"@stylistic/brace-style": ["error", "allman", { "allowSingleLine": false }],
	"@stylistic/indent": "off",
	"@stylistic/quotes": "off",
	"@stylistic/semi": "off",
	"@stylistic/comma-dangle": "off"
};

// Shared plugins
const sharedPlugins = {
	"@typescript-eslint": tseslint,
	"@stylistic": stylistic,
	local: {
		rules: {
			"assignment-newline": assignmentNewline,
			"arrow-body-newline": arrowBodyNewline,
			"closing-angle-same-line": closingAngleSameLine,
			"closing-paren-same-line": closingParenSameLine,
			"operator-continuation-indent": operatorContinuationIndent
		}
	}
};

export default [
	// Main application files (non-spec)
	{
		files: ["src/**/*.ts"],
		ignores: ["src/**/*.spec.ts"],
		languageOptions: {
			parser: parser,
			parserOptions: {
				project: "./tsconfig.app.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: sharedPlugins,
		rules: sharedRules
	},
	// Spec/test files
	{
		files: ["src/**/*.spec.ts"],
		languageOptions: {
			parser: parser,
			parserOptions: {
				project: "./tsconfig.spec.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: sharedPlugins,
		rules: sharedRules
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
		files: ["src/app/features/**/*.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["../../**/features/**/*"],
							message:
								"Features must not import from other features using relative paths. Use @infrastructure/ or @shared/ for cross-feature code (Feature Isolation pattern)."
						}
					]
				}
			]
		}
	},
	{
		files: ["src/app/infrastructure/**/*.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["@admin/*", "@game/*", "@features/*", "../features/*", "../../features/*"],
							message:
								"Infrastructure must not import from feature modules. Keep infrastructure independent (Dependency Inversion pattern)."
						}
					]
				}
			]
		}
	},
	{
		ignores: ["dist/**", "node_modules/**", "coverage/**", ".angular/**"]
	}
];
