/**
 * ESLint rule: operator-continuation-indent
 *
 * Ensures that when a binary/logical operator appears at the start of a continuation line,
 * it is indented one level deeper than the first line of the expression chain.
 *
 * For chained operators (a || b || c), all operators align at the same level.
 *
 * WRONG:
 * const value = foo
 * || bar
 * || baz;
 *
 * RIGHT:
 * const value = foo
 *     || bar
 *     || baz;
 */
export default {
	meta: {
		type: "layout",
		docs: {
			description:
				"Enforce indentation for continuation lines starting with operators",
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
		 * Calculate indent length in tab units
		 */
		function getIndentDepth(indent)
		{
			const normalized = normalizeIndent(indent);
			return normalized.split("\t").length - 1;
		}

		/**
		 * Find the root of a chained binary/logical expression
		 * For: a || b || c, when at 'c', find 'a'
		 */
		function findChainRoot(node)
		{
			let current = node;

			// Walk up the tree while parent is same type of expression
			while (
				current.parent
				&& (current.parent.type === "BinaryExpression"
					|| current.parent.type === "LogicalExpression")
				&& current.parent.operator === node.operator
				&& current.parent.left === current)
			{
				current = current.parent;
			}

			return current;
		}

		/**
		 * Find the leftmost non-binary node in a chain
		 */
		function findLeftmostOperand(node)
		{
			let current = node.left;

			while (
				(current.type === "BinaryExpression"
					|| current.type === "LogicalExpression")
				&& current.operator === node.operator)
			{
				current = current.left;
			}

			return current;
		}

		/**
		 * Fix indentation for a token on a continuation line
		 */
		function checkContinuationIndent(referenceNode, token, operatorSymbol)
		{
			const refLine = referenceNode.loc.start.line;
			const tokenLine = token.loc.start.line;

			// Only check if token is on a new line
			if (tokenLine <= refLine)
			{
				return;
			}

			// Get the indentation of the reference line
			const refIndent = getLineIndent(refLine);
			const refDepth = getIndentDepth(refIndent);

			// Get the actual indentation of the token line
			const tokenLineIndent = getLineIndent(tokenLine);
			const tokenDepth = getIndentDepth(tokenLineIndent);

			// The continuation line should be indented one level deeper
			const expectedDepth = refDepth + 1;

			if (tokenDepth !== expectedDepth)
			{
				const expectedIndent = "\t".repeat(expectedDepth);
				const line = sourceCode.lines[tokenLine - 1];
				const currentIndent = line.match(/^(\s*)/)[1];

				context.report({
					node: token,
					message:
						`Continuation line with '${operatorSymbol}' should be indented ${expectedDepth} levels (found ${tokenDepth})`,
					fix(fixer)
					{
						const lineStart = sourceCode.getIndexFromLoc({
							line: tokenLine,
							column: 0
						});
						const indentEnd = lineStart + currentIndent.length;

						return fixer.replaceTextRange(
							[lineStart, indentEnd],
							expectedIndent);
					}
				});
			}
		}

		/**
		 * Check binary/logical expressions
		 */
		function checkBinaryExpression(node)
		{
			const operator = node.operator;

			// Find the operator token
			const operatorToken = sourceCode.getTokenAfter(
				node.left,
				token => token.value === operator);

			if (!operatorToken)
			{
				return;
			}

			// Check if operator is on new line
			if (operatorToken.loc.start.line <= node.left.loc.end.line)
			{
				return;
			}

			// Find the root of this chain and its leftmost operand
			const chainRoot = findChainRoot(node);
			const leftmostOperand = findLeftmostOperand(chainRoot);

			// Use leftmost operand as reference for all operators in chain
			checkContinuationIndent(leftmostOperand, operatorToken, operator);
		}

		/**
		 * Check ternary/conditional expressions
		 */
		function checkConditionalExpression(node)
		{
			// For ternary, find the actual test expression (not a chain)
			let testRef = node.test;

			while (
				testRef.type === "BinaryExpression"
				|| testRef.type === "LogicalExpression")
			{
				testRef = testRef.left;
			}

			// Check the ? operator
			const questionToken = sourceCode.getTokenAfter(
				node.test,
				token => token.value === "?");

			if (
				questionToken
				&& questionToken.loc.start.line > node.test.loc.end.line)
			{
				checkContinuationIndent(testRef, questionToken, "?");
			}

			// Check the : operator - should align with ?
			const colonToken = sourceCode.getTokenAfter(
				node.consequent,
				token => token.value === ":");

			if (
				colonToken
				&& colonToken.loc.start.line > node.test.loc.end.line)
			{
				checkContinuationIndent(testRef, colonToken, ":");
			}
		}

		return {
			BinaryExpression: checkBinaryExpression,
			LogicalExpression: checkBinaryExpression,
			ConditionalExpression: checkConditionalExpression
		};
	}
};
