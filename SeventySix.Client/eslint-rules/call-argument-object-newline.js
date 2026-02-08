/**
 * ESLint rule: call-argument-object-newline
 *
 * Enforces that object literals, array literals, and function expressions passed as arguments
 * to function/method calls are placed on a new line.
 *
 * NOTE: Indentation is delegated to @stylistic/indent to avoid conflicts.
 *
 * CORRECT:
 *   TestBed.configureTestingModule(
 *       {
 *           providers: [
 *               provideHttpClient(),
 *               provideHttpClientTesting()
 *           ]
 *       });
 *
 *   setTimeout(
 *       (): void =>
 *       {
 *           doSomething();
 *       },
 *       1000);
 *
 * WRONG:
 *   TestBed.configureTestingModule({
 *       providers: []
 *   });
 *
 *   setTimeout((): void =>
 *   {
 *       doSomething();
 *   }, 1000);
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description: "Enforce object/array/function arguments on new lines",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: []
	},

	create(context)
	{
		const sourceCode = context.sourceCode;

		/**
		 * Get the indentation string of a line (leading whitespace)
		 */
		function getLineIndent(lineNumber)
		{
			const line = sourceCode.lines[lineNumber - 1];
			if (!line) return "";
			const match = line.match(/^(\s*)/);
			return match ? match[1] : "";
		}

		/**
		 * Check if an argument is a complex type that should be on its own line
		 */
		function isComplexArgument(node)
		{
			if (!node) return false;

			// Objects with properties
			if (node.type === "ObjectExpression")
			{
				return node.properties.length > 0;
			}

			// Arrays with elements
			if (node.type === "ArrayExpression")
			{
				return node.elements.length > 0;
			}

			// Arrow functions with BLOCK bodies only (not expression bodies)
			if (node.type === "ArrowFunctionExpression")
			{
				return node.body.type === "BlockStatement";
			}

			// Regular function expressions always
			if (node.type === "FunctionExpression")
			{
				return true;
			}

			return false;
		}

		/**
		 * Check a CallExpression or NewExpression for proper argument formatting
		 */
		function checkCallExpression(node)
		{
			const args = node.arguments;
			if (!args || args.length === 0) return;

			// Get the opening paren
			const callee = node.callee;
			const openParen = sourceCode.getTokenAfter(
				callee,
				token => token.value === "(");

			if (!openParen) return;

			const parenLine = openParen.loc.start.line;
			const parenIndent = getLineIndent(parenLine);
			const expectedArgIndent = parenIndent + "\t";

			// Check each argument
			for (let i = 0; i < args.length; i++)
			{
				const arg = args[i];
				if (!arg) continue;

				const argFirstToken = sourceCode.getFirstToken(arg);
				const prevToken = sourceCode.getTokenBefore(argFirstToken);

				if (!prevToken) continue;

				const argLine = argFirstToken.loc.start.line;
				const prevLine = prevToken.loc.end.line;

				// Only check complex arguments for newline requirement
				const isComplex = isComplexArgument(arg);

				if (isComplex && argLine === prevLine)
				{
					// Complex argument on same line - needs newline
					context.report({
						node: arg,
						message: "Object/array/function argument should be on a new line",
						fix(fixer)
						{
							return fixer.replaceTextRange(
								[prevToken.range[1], argFirstToken.range[0]],
								"\n" + expectedArgIndent);
						}
					});
				}
				// NOTE: Indentation checking delegated to @stylistic/indent
			}
		}

		return {
			CallExpression(node)
			{
				checkCallExpression(node);
			},
			NewExpression(node)
			{
				checkCallExpression(node);
			}
		};
	}
};
