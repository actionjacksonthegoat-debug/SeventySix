import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";
import assignmentNewline from "../SeventySix.Client/eslint-rules/assignment-newline.js";
import arrowBodyNewline from "../SeventySix.Client/eslint-rules/arrow-body-newline.js";
import closingAngleSameLine from "../SeventySix.Client/eslint-rules/closing-angle-same-line.js";
import closingParenSameLine from "../SeventySix.Client/eslint-rules/closing-paren-same-line.js";
import operatorContinuationIndent from "../SeventySix.Client/eslint-rules/operator-continuation-indent.js";
import callArgumentObjectNewline from "../SeventySix.Client/eslint-rules/call-argument-object-newline.js";

/** Shared formatting and quality rules for all TypeScript files. */
const sharedRules = {
	"@typescript-eslint/no-explicit-any": "warn",
	"@typescript-eslint/no-unused-vars": [
		"warn",
		{
			argsIgnorePattern: "^_",
			varsIgnorePattern: "^_"
		}
	],
	"@typescript-eslint/explicit-function-return-type": [
		"error",
		{
			allowExpressions: true,
			allowTypedFunctionExpressions: true,
			allowHigherOrderFunctions: true,
			allowDirectConstAssertionInArrowFunctions: true,
			allowConciseArrowFunctionExpressionsStartingWithVoid: false
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
	"@stylistic/function-call-argument-newline": "off",
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
	"local/call-argument-object-newline": "error",
	"@stylistic/brace-style": ["error", "allman", { "allowSingleLine": false }],
	"@stylistic/indent": ["error", "tab", { "SwitchCase": 1, "MemberExpression": 1 }],
	"@stylistic/quotes": "off",
	"@stylistic/semi": "off",
	"@stylistic/comma-dangle": "off",
	"@stylistic/eol-last": ["error", "never"]
};

/** Local plugin wrapping the shared custom ESLint rules from SeventySix.Client. */
const sharedPlugins = {
	"@typescript-eslint": tseslint,
	"@stylistic": stylistic,
	local: {
		rules: {
			"assignment-newline": assignmentNewline,
			"arrow-body-newline": arrowBodyNewline,
			"closing-angle-same-line": closingAngleSameLine,
			"closing-paren-same-line": closingParenSameLine,
			"operator-continuation-indent": operatorContinuationIndent,
			"call-argument-object-newline": callArgumentObjectNewline
		}
	}
};

export default [
	{
		files: ["src/**/*.ts"],
		ignores: ["src/**/*.test.ts", "src/lib/utils/date.ts"],
		languageOptions: {
			parser: parser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: sharedPlugins,
		rules: {
			...sharedRules,
			"no-restricted-syntax": [
				"error",
				{
					selector: "NewExpression[callee.name='Date']",
					message: "Use date-fns functions via $lib/utils/date instead of new Date()."
				},
				{
					selector: "MemberExpression[object.name='Date'][property.name='now']",
					message: "Use date-fns functions via $lib/utils/date instead of Date.now()."
				},
				{
					selector: "MemberExpression[object.name='Date'][property.name='parse']",
					message: "Use date-fns parse() via $lib/utils/date instead of Date.parse()."
				}
			]
		}
	},
	{
		files: ["src/**/*.test.ts"],
		languageOptions: {
			parser: parser,
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: sharedPlugins,
		rules: {
			...sharedRules,
			"@typescript-eslint/typedef": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-explicit-any": "off"
		}
	},
	{
		files: ["src/**/schema.ts", "src/**/seed.ts"],
		rules: {
			"@typescript-eslint/typedef": "off",
			"no-console": "off"
		}
	},
	{
		files: ["src/routes/**/*.ts", "src/hooks.server.ts"],
		ignores: ["src/**/*.test.ts"],
		rules: {
			"@typescript-eslint/typedef": [
				"error",
				{
					variableDeclaration: false,
					propertyDeclaration: true,
					memberVariableDeclaration: true
				}
			]
		}
	},
	{
		ignores: [
			"node_modules/**",
			".svelte-kit/**",
			"build/**",
			"coverage/**",
			"*.config.*",
			"scripts/**"
		]
	}
];