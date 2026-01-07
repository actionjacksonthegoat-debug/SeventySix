// <copyright file="ClosingParenSameLineAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that enforces closing parentheses to be on the same line as the last content.
/// Handles consecutive )) patterns - all closing parens should be on same line as last argument.
/// Example violation:
///   if (
///       string.Equals(
///           environment,
///           "Test",
///           StringComparison.OrdinalIgnoreCase)  &lt;-- inner ) is OK
///   )  &lt;-- THIS ) should be on previous line: OrdinalIgnoreCase))
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class ClosingParenSameLineAnalyzer : DiagnosticAnalyzer
{
	/// <summary>
	/// Diagnostic ID for this analyzer.
	/// </summary>
	public const string DiagnosticId = "SS002";

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Closing parenthesis should not be alone on line",
		"Closing ')' should be on the same line as the last content",
		"Formatting",
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "Closing parentheses should not be alone on their own line. Multiple consecutive ) should all be on the same line as the last argument."
	);

	/// <inheritdoc/>
	public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
		ImmutableArray.Create(Rule);

	/// <inheritdoc/>
	public override void Initialize(AnalysisContext context)
	{
		context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
		context.EnableConcurrentExecution();

		// Register for argument lists (method calls, object creation)
		context.RegisterSyntaxNodeAction(
			AnalyzeArgumentList,
			SyntaxKind.ArgumentList
		);

		// Register for parameter lists (method/constructor declarations)
		context.RegisterSyntaxNodeAction(
			AnalyzeParameterList,
			SyntaxKind.ParameterList
		);

		// Register for parenthesized expressions: if (...), while (...), etc.
		context.RegisterSyntaxNodeAction(
			AnalyzeParenthesizedExpression,
			SyntaxKind.ParenthesizedExpression
		);

		// Register for if/while/for/foreach condition parentheses
		context.RegisterSyntaxNodeAction(
			AnalyzeIfStatement,
			SyntaxKind.IfStatement
		);
		context.RegisterSyntaxNodeAction(
			AnalyzeWhileStatement,
			SyntaxKind.WhileStatement
		);
		context.RegisterSyntaxNodeAction(
			AnalyzeForStatement,
			SyntaxKind.ForStatement
		);
		context.RegisterSyntaxNodeAction(
			AnalyzeForEachStatement,
			SyntaxKind.ForEachStatement
		);
	}

	private static void AnalyzeArgumentList(SyntaxNodeAnalysisContext context)
	{
		ArgumentListSyntax argumentList = (ArgumentListSyntax)context.Node;

		// Skip empty argument lists
		if (argumentList.Arguments.Count == 0)
		{
			return;
		}

		CheckCloseParenAloneOnLine(context, argumentList.CloseParenToken);
	}

	private static void AnalyzeParameterList(SyntaxNodeAnalysisContext context)
	{
		ParameterListSyntax parameterList = (ParameterListSyntax)context.Node;

		// Skip empty parameter lists
		if (parameterList.Parameters.Count == 0)
		{
			return;
		}

		CheckCloseParenAloneOnLine(context, parameterList.CloseParenToken);
	}

	private static void AnalyzeParenthesizedExpression(
		SyntaxNodeAnalysisContext context
	)
	{
		ParenthesizedExpressionSyntax parenExpr =
			(ParenthesizedExpressionSyntax)context.Node;

		CheckCloseParenAloneOnLine(context, parenExpr.CloseParenToken);
	}

	private static void AnalyzeIfStatement(SyntaxNodeAnalysisContext context)
	{
		IfStatementSyntax ifStatement = (IfStatementSyntax)context.Node;

		CheckCloseParenAloneOnLine(context, ifStatement.CloseParenToken);
	}

	private static void AnalyzeWhileStatement(SyntaxNodeAnalysisContext context)
	{
		WhileStatementSyntax whileStatement = (WhileStatementSyntax)
			context.Node;

		CheckCloseParenAloneOnLine(context, whileStatement.CloseParenToken);
	}

	private static void AnalyzeForStatement(SyntaxNodeAnalysisContext context)
	{
		ForStatementSyntax forStatement = (ForStatementSyntax)context.Node;

		CheckCloseParenAloneOnLine(context, forStatement.CloseParenToken);
	}

	private static void AnalyzeForEachStatement(
		SyntaxNodeAnalysisContext context
	)
	{
		ForEachStatementSyntax forEachStatement = (ForEachStatementSyntax)
			context.Node;

		CheckCloseParenAloneOnLine(context, forEachStatement.CloseParenToken);
	}

	/// <summary>
	/// Checks if a close paren token is alone on its line (only whitespace before it).
	/// Uses line position comparison for efficiency.
	/// </summary>
	private static void CheckCloseParenAloneOnLine(
		SyntaxNodeAnalysisContext context,
		SyntaxToken closeParenToken
	)
	{
		// Get the previous token (could be ), an argument, parameter, etc.)
		SyntaxToken previousToken = closeParenToken.GetPreviousToken();

		if (previousToken.IsMissing)
		{
			return;
		}

		// Get line positions
		int closeParenLine = closeParenToken
			.GetLocation()
			.GetLineSpan()
			.StartLinePosition.Line;
		int previousTokenEndLine = previousToken
			.GetLocation()
			.GetLineSpan()
			.EndLinePosition.Line;

		// If they're on the same line, no issue
		if (closeParenLine == previousTokenEndLine)
		{
			return;
		}

		// Close paren is on a different line - check if it's truly alone
		// (only whitespace/newline in its leading trivia)
		if (IsTokenAloneOnLine(closeParenToken))
		{
			context.ReportDiagnostic(
				Diagnostic.Create(Rule, closeParenToken.GetLocation())
			);
		}
	}

	/// <summary>
	/// Checks if a token is alone on its line (only whitespace before it on that line).
	/// Uses column position: if token starts at column 0-N with only tabs/spaces before,
	/// and the previous token ended on a different line, it's alone.
	/// </summary>
	private static bool IsTokenAloneOnLine(SyntaxToken token)
	{
		SyntaxTriviaList leadingTrivia = token.LeadingTrivia;

		// If there's leading trivia, check what kind
		if (leadingTrivia.Count > 0)
		{
			bool hasNewline = false;
			bool hasOnlyWhitespace = true;

			foreach (SyntaxTrivia trivia in leadingTrivia)
			{
				int kind = trivia.RawKind;

				if (kind == (int)SyntaxKind.EndOfLineTrivia)
				{
					hasNewline = true;
				}
				else if (kind != (int)SyntaxKind.WhitespaceTrivia)
				{
					// Has something other than whitespace/newline
					hasOnlyWhitespace = false;
				}
			}

			if (hasNewline && hasOnlyWhitespace)
			{
				return true;
			}
		}

		// Also check if the previous token's trailing trivia has the newline
		// This handles cases where the newline is attached to the previous token
		SyntaxToken previousToken = token.GetPreviousToken();

		if (!previousToken.IsMissing)
		{
			foreach (SyntaxTrivia trivia in previousToken.TrailingTrivia)
			{
				if (trivia.RawKind == (int)SyntaxKind.EndOfLineTrivia)
				{
					// Previous token has trailing newline, check if our leading
					// trivia is only whitespace (indentation)
					if (leadingTrivia.Count == 0)
					{
						return true;
					}

					bool onlyWhitespace = true;

					foreach (SyntaxTrivia lt in leadingTrivia)
					{
						if (lt.RawKind != (int)SyntaxKind.WhitespaceTrivia)
						{
							onlyWhitespace = false;

							break;
						}
					}

					if (onlyWhitespace)
					{
						return true;
					}
				}
			}
		}

		return false;
	}
}