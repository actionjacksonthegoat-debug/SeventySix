/**
 * ESLint rule: arrow-body-newline
 *
 * Ensures that arrow function bodies with expressions (not blocks) that exceed
 * a certain length are placed on a new line.
 *
 * NOTE: Indentation is delegated to @stylistic/indent to avoid conflicts.
 *
 * WRONG:
 * switchMap((username: string) => from(this.userService.checkUsernameAvailability(username)))
 *
 * RIGHT:
 * switchMap((username: string) =>
 *     from(this.userService.checkUsernameAvailability(username)))
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description:
				"Enforce newline after arrow for expression bodies exceeding threshold",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: [
			{
				type: "object",
				properties: {
					maxLength: {
						type: "number",
						default: 40
					}
				},
				additionalProperties: false
			}
		]
	},

	create(context)
	{
		const sourceCode = context.sourceCode;
		const options = context.options[0] || {};
		const maxLength = options.maxLength || 40;

		/**
		 * Get the indentation string of a line (leading whitespace)
		 */
		function getLineIndent(lineNumber)
		{
			const line = sourceCode.lines[lineNumber - 1];
			const match = line.match(/^(\s*)/);
			return match ? match[1] : "";
		}

		/**
		 * Convert spaces to tabs for consistency (4 spaces = 1 tab)
		 */
		function normalizeIndent(indent)
		{
			return indent.replace(/    /g, "\t");
		}

		/**
		 * Calculate indent depth in tab units
		 */
		function getIndentDepth(indent)
		{
			const normalized = normalizeIndent(indent);
			return normalized.split("\t").length - 1;
		}

		return {
			ArrowFunctionExpression(node)
			{
				// Only check expression bodies (not block statements)
				if (node.body.type === "BlockStatement")
				{
					return;
				}

				// Skip parenthesized object literals - they need special handling
				// e.g., () => ({ foo: bar }) should stay on same line
				if (node.body.type === "ObjectExpression")
				{
					return;
				}

				// Get the arrow token
				const arrowToken = sourceCode.getTokenBefore(
					node.body,
					(token) =>
						token.type === "Punctuator" && token.value === "=>");

				if (!arrowToken)
				{
					return;
				}

				const arrowLine = arrowToken.loc.end.line;
				const bodyStartLine = node.body.loc.start.line;

				// If body is already on new line, let @stylistic/indent handle indentation
				if (bodyStartLine > arrowLine)
				{
					return;
				}

				// Body is on same line as arrow - check if it's too long
				// Use the ENTIRE arrow function expression length, not just body
				const arrowFunctionText = sourceCode.getText(node);
				const bodyText = sourceCode.getText(node.body);
				const effectiveLength = Math.max(arrowFunctionText.length, bodyText.length);

				if (effectiveLength <= maxLength)
				{
					return;
				}

				// Body is too long, should be on new line
				const arrowIndent = getLineIndent(arrowLine);
				const arrowDepth = getIndentDepth(arrowIndent);
				const expectedIndent = "\t".repeat(arrowDepth + 1);

				context.report({
					node: node.body,
					message:
						`Arrow function body exceeds ${maxLength} chars, should be on new line`,
					fix(fixer)
					{
						// Find the position right after the arrow token
						const afterArrow = arrowToken.range[1];

						// Find where the body starts (skip any whitespace)
						const bodyStart = node.body.range[0];

						return fixer.replaceTextRange(
							[afterArrow, bodyStart],
							"\n" + expectedIndent);
					}
				});
			}
		};
	}
};
