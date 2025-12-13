/**
 * Custom ESLint rule: Enforce newline after `=` in variable declarations and assignments,
 * with recursive nested object/array indentation support.
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
 *   const data =
 *       {
 *       timestamp: now(),  // Missing indent
 *       error: {
 *       name: error.name   // Nested object not indented
 *       }
 *   };
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
			description: "Enforce newline after assignment operator (=) with nested object support",
			category: "Stylistic Issues"
		},
		fixable: "whitespace",
		schema: []
	},
	create(context) {
		const sourceCode = context.sourceCode || context.getSourceCode();

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

		/**
		 * Recursively check and fix indentation for all nested objects/arrays
		 */
		function checkNestedObjectIndentation(objectNode, baseIndent, depthFromAssignment = 1) {
			if (!objectNode) return;
			if (objectNode.type !== "ObjectExpression" && objectNode.type !== "ArrayExpression") return;

			const items = objectNode.type === "ObjectExpression" ? objectNode.properties : objectNode.elements;
			if (!items || items.length === 0) return;

			const openBrace = sourceCode.getFirstToken(objectNode);
			const closeBrace = sourceCode.getLastToken(objectNode);
			if (!openBrace || !closeBrace) return;

			// Check if this object spans multiple lines
			if (openBrace.loc.start.line === closeBrace.loc.end.line) return; // Single line, skip

			// Calculate expected indentation for content inside this object
			// baseIndent + (depthFromAssignment tabs for the nesting)
			const contentIndent = baseIndent + "\t".repeat(depthFromAssignment + 1);
			const braceIndent = baseIndent + "\t".repeat(depthFromAssignment);

			// Check each property/element
			for (const item of items) {
				if (!item) continue; // Skip sparse array elements

				const itemFirstToken = sourceCode.getFirstToken(item);
				if (!itemFirstToken) continue;

				// Check if item is on its own line
				const prevToken = sourceCode.getTokenBefore(itemFirstToken);
				if (prevToken && itemFirstToken.loc.start.line !== prevToken.loc.end.line) {
					const line = sourceCode.lines[itemFirstToken.loc.start.line - 1];
					const currentIndent = line.match(/^\s*/)[0];

					if (currentIndent !== contentIndent) {
						context.report({
							node: item,
							loc: itemFirstToken.loc,
							message: `Content should be indented ${depthFromAssignment + 1} level(s) from assignment`,
							fix(fixer) {
								const lineStart = sourceCode.getIndexFromLoc({
									line: itemFirstToken.loc.start.line,
									column: 0
								});
								return fixer.replaceTextRange(
									[lineStart, lineStart + currentIndent.length],
									contentIndent
								);
							}
						});
					}
				}

				// For object properties, check if value is a nested object/array
				if (item.type === "Property" && item.value) {
					if (item.value.type === "ObjectExpression" || item.value.type === "ArrayExpression") {
						// Check if the nested object's opening brace is on a new line
						const colonToken = sourceCode.getTokenAfter(item.key, t => t.value === ":");
						const valueFirstToken = sourceCode.getFirstToken(item.value);

						if (colonToken && valueFirstToken) {
							const textAfterColon = sourceCode.getText().slice(colonToken.range[1], valueFirstToken.range[0]);

							// If there's a newline after colon, recursively check the nested object
							if (textAfterColon.includes("\n")) {
								checkNestedObjectIndentation(item.value, baseIndent, depthFromAssignment + 1);
							} else if (item.value.properties?.length > 0 || item.value.elements?.length > 0) {
								// Nested object is on same line as colon but has content
								// Check if it spans multiple lines
								const nestedOpen = sourceCode.getFirstToken(item.value);
								const nestedClose = sourceCode.getLastToken(item.value);
								if (nestedOpen && nestedClose && nestedOpen.loc.start.line !== nestedClose.loc.end.line) {
									// Multi-line nested object starting on same line - check its contents
									checkNestedObjectIndentation(item.value, baseIndent, depthFromAssignment + 1);
								}
							}
						}
					}
				}

				// For array elements that are objects/arrays
				if (item.type === "ObjectExpression" || item.type === "ArrayExpression") {
					checkNestedObjectIndentation(item, baseIndent, depthFromAssignment + 1);
				}
			}

			// Check closing brace indentation
			const prevTokenBeforeClose = sourceCode.getTokenBefore(closeBrace);
			if (prevTokenBeforeClose && closeBrace.loc.start.line !== prevTokenBeforeClose.loc.end.line) {
				const line = sourceCode.lines[closeBrace.loc.start.line - 1];
				const currentIndent = line.match(/^\s*/)[0];

				if (currentIndent !== braceIndent) {
					context.report({
						loc: closeBrace.loc,
						message: "Closing brace should align with opening brace",
						fix(fixer) {
							const lineStart = sourceCode.getIndexFromLoc({
								line: closeBrace.loc.start.line,
								column: 0
							});
							return fixer.replaceTextRange(
								[lineStart, lineStart + currentIndent.length],
								braceIndent
							);
						}
					});
				}
			}
		}

		/**
		 * Main check for object/array indentation after assignment
		 */
		function checkObjectIndentation(node, rightNode, operatorToken) {
			if (!rightNode || !operatorToken) return;
			if (rightNode.type !== "ObjectExpression" && rightNode.type !== "ArrayExpression") return;

			const items = rightNode.type === "ObjectExpression" ? rightNode.properties : rightNode.elements;
			if (!items || items.length === 0) return;

			// Get the indentation of the declaration line
			const declLine = sourceCode.lines[operatorToken.loc.start.line - 1];
			const baseIndent = declLine.match(/^\s*/)[0];

			// Get opening brace
			const openBrace = sourceCode.getFirstToken(rightNode);
			if (!openBrace) return;

			// Check if the opening brace is on its own line (newline after =)
			const textBefore = sourceCode.getText().slice(operatorToken.range[1], openBrace.range[0]);
			if (!textBefore.includes("\n")) return; // No newline after =, skip

			// Recursively check all nested objects starting from depth 1
			checkNestedObjectIndentation(rightNode, baseIndent, 1);
		}

		return {
			VariableDeclarator(node) {
				if (!node.init) return;

				const equalsToken = sourceCode.getTokenBefore(
					node.init,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.init, equalsToken);
				checkObjectIndentation(node, node.init, equalsToken);
			},

			AssignmentExpression(node) {
				// Only check simple assignment, not +=, -=, etc.
				if (node.operator !== "=") return;

				const operatorToken = sourceCode.getTokenBefore(
					node.right,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.right, operatorToken);
				checkObjectIndentation(node, node.right, operatorToken);
			},

			// Class property definitions: readonly x = signal<T>(value);
			PropertyDefinition(node) {
				if (!node.value) return;

				const equalsToken = sourceCode.getTokenBefore(
					node.value,
					(token) => token.type === "Punctuator" && token.value === "="
				);

				checkAssignment(node, node.value, equalsToken);
				checkObjectIndentation(node, node.value, equalsToken);
			}
		};
	}
};
