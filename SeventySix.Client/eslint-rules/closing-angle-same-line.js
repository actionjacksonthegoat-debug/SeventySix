/**
 * ESLint rule: closing-angle-same-line
 *
 * Ensures that closing angle brackets (>) for type parameters are on the same line
 * as the last type argument, never on their own line.
 *
 * WRONG:
 * Signal<
 *     MatTableDataSource<User>
 * >
 *
 * RIGHT:
 * Signal<
 *     MatTableDataSource<User>>
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description:
				"Enforce closing angle bracket on same line as last type parameter",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: []
	},

	create(context)
	{
		const sourceCode = context.sourceCode;

		/**
		 * Check if there's unwanted whitespace/newline before closing angle bracket
		 */
		function checkClosingAngle(node)
		{
			// Get all tokens in the node
			const tokens = sourceCode.getTokens(node);

			// Find all closing angle brackets
			for (let i = 0; i < tokens.length; i++)
			{
				const token = tokens[i];

				if (token.type === "Punctuator" && token.value === ">")
				{
					const prevToken = tokens[i - 1];

					if (!prevToken)
					{
						continue;
					}

					// Check if there's a newline between previous token and >
					const prevLine = prevToken.loc.end.line;
					const closeLine = token.loc.start.line;

					if (closeLine > prevLine)
					{
						// The > is on a new line - should be on same line as previous token
						context.report({
							node: token,
							message:
								"Closing angle bracket should be on same line as last type parameter",
							fix(fixer)
							{
								// Get the position after the previous token
								const start = prevToken.range[1];
								const end = token.range[0];

								// Replace all whitespace between with nothing
								return fixer.replaceTextRange([start, end], "");
							}
						});
					}
				}
			}
		}

		return {
			// Check type annotations, type parameters, generic calls, etc.
			TSTypeReference: checkClosingAngle,
			TSTypeParameterInstantiation: checkClosingAngle,
			TSTypeParameterDeclaration: checkClosingAngle
		};
	}
};
