/**
 * Custom ESLint rule: Enforce newline after `=` in variable declarations and assignments.
 *
 * NOTE: Internal object/array indentation is delegated to @stylistic/indent to avoid conflicts.
 *
 * CORRECT:
 *   const user =
 *       await repo.GetByIdAsync(id);
 *
 *   const data: Record<string, unknown> =
 *       {
 *           timestamp: now(),
 *           error:
 *               {
 *                   name: error.name,
 *                   message: error.message
 *               }
 *       };
 *
 * WRONG:
 *   const user = await repo.GetByIdAsync(id);
 *
 * This rule skips:
 *   - Simple literals (strings, numbers, booleans)
 *   - Short identifiers (< 20 chars)
 *   - Empty arrays/objects literals
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description: "Enforce newline after assignment operator (=)",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: []
	},
	create(context) {
		const sourceCode = context.sourceCode;

		/**
		 * Check if the right-hand side is a simple value that should be kept on same line
		 */
		function isSimpleValue(node) {
			if (!node) return true;

			// Simple literals (strings, numbers, booleans, null)
			if (node.type === "Literal") {
				return typeof node.value !== "object" || node.value === null;
			}

			// Short identifiers
			if (node.type === "Identifier") {
				return node.name.length < 20;
			}

			// Empty arrays []
			if (node.type === "ArrayExpression") {
				return node.elements.length === 0;
			}

			// Empty objects {}
			if (node.type === "ObjectExpression") {
				return node.properties.length === 0;
			}

			// Template literals without expressions
			if (node.type === "TemplateLiteral") {
				return node.expressions.length === 0 && node.quasis.length === 1;
			}

			// Unary expressions like !value, -1
			if (node.type === "UnaryExpression") {
				return isSimpleValue(node.argument);
			}

			return false;
		}

		/**
		 * Check assignment and report if newline is missing after =
		 */
		function checkAssignment(node, rightNode, operatorToken) {
			if (!rightNode || !operatorToken) return;

			// Skip simple values
			if (isSimpleValue(rightNode)) return;

			// Get the token after the = sign
			const tokenAfterOperator = sourceCode.getTokenAfter(operatorToken);
			if (!tokenAfterOperator) return;

			// Check if there's a newline between = and the next token
			const textBetween = sourceCode.getText().slice(operatorToken.range[1], tokenAfterOperator.range[0]);

			if (!textBetween.includes("\n")) {
				context.report({
					node: rightNode,
					message: "Expected newline after '='",
					fix(fixer) {
						// Get the indentation of the current line
						const line = sourceCode.lines[operatorToken.loc.start.line - 1];
						const currentIndent = line.match(/^\s*/)[0];
						const newIndent = currentIndent + "\t"; // Add one tab for continuation

						return fixer.replaceTextRange(
							[operatorToken.range[1], tokenAfterOperator.range[0]],
							"\n" + newIndent
						);
					}
				});
			}
		}

		// NOTE: Object/array internal indentation is handled by @stylistic/indent
		// This rule only ensures newline after =

		return {
			VariableDeclarator(node) {
				if (!node.init) return;

				const equalsToken = sourceCode.getTokenBefore(
					node.init,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.init, equalsToken);
			},

			AssignmentExpression(node) {
				// Only check simple assignment, not +=, -=, etc.
				if (node.operator !== "=") return;

				const operatorToken = sourceCode.getTokenBefore(
					node.right,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.right, operatorToken);
			},

			// Class property definitions: readonly x = signal<T>(value);
			PropertyDefinition(node) {
				if (!node.value) return;

				const equalsToken = sourceCode.getTokenBefore(
					node.value,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.value, equalsToken);
			}
		};
	}
};
