/**
 * Custom ESLint rule: Ensure closing parenthesis is on the same line as the last content.
 *
 * CORRECT:
 *   inject(
 *       MatDialogRef<LogDetailDialogComponent>);
 *
 *   return (
 *       error.message || "default");
 *
 * WRONG:
 *   inject(
 *       MatDialogRef<LogDetailDialogComponent>
 *   );
 *
 *   return (
 *       error.message || "default"
 *   );
 *
 * This rule ensures ) never appears alone on a line.
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description: "Ensure closing parenthesis is on same line as last content",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: []
	},
	create(context) {
		const sourceCode = context.sourceCode;

		return {
			"Program:exit"() {
				// Get all tokens and find closing parens that are alone on their line
				const tokens = sourceCode.getTokens(sourceCode.ast);

				for (const token of tokens) {
					if (token.value !== ")") continue;

					// Get the token before this closing paren
					const tokenBefore = sourceCode.getTokenBefore(token);
					if (!tokenBefore) continue;

					// Check if the ) is on a different line than the token before it
					if (token.loc.start.line !== tokenBefore.loc.end.line) {
						// Check if the closing paren is alone on its line (only whitespace before it)
						const line = sourceCode.lines[token.loc.start.line - 1];
						const beforeParen = line.substring(0, token.loc.start.column);

						// If only whitespace before the ), it's alone on the line
						if (/^\s*$/.test(beforeParen)) {
							context.report({
								loc: token.loc,
								message: "Closing parenthesis should be on same line as last content",
								fix(fixer) {
									// Remove the newline and whitespace between last token and closing paren
									return fixer.replaceTextRange(
										[tokenBefore.range[1], token.range[0]],
										""
									);
								}
							});
						}
					}
				}
			}
		};
	}
};
