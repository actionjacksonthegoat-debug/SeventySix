// <copyright file="AssignmentContinuationIndentAnalyzer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace SeventySix.Analyzers;

/// <summary>
/// Analyzer that ensures continuation lines after assignment operators have proper indentation.
/// When a value starts on a new line after '=', it must be indented one level deeper than the statement.
/// </summary>
[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class AssignmentContinuationIndentAnalyzer : DiagnosticAnalyzer
{
	/// <summary>
	/// Diagnostic ID for this analyzer.
	/// </summary>
	public const string DiagnosticId = "SS003";

	private static readonly DiagnosticDescriptor Rule = new(
		DiagnosticId,
		"Assignment continuation indent incorrect",
		"Continuation line after '=' should be indented one level deeper",
		"Formatting",
		DiagnosticSeverity.Warning,
		isEnabledByDefault: true,
		description: "When a value starts on a new line after '=', it should be indented one tab deeper than the containing statement."
	);

	/// <inheritdoc/>
	public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get; } =
		ImmutableArray.Create(Rule);

	/// <inheritdoc/>
	public override void Initialize(AnalysisContext context)
	{
		context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
		context.EnableConcurrentExecution();

		context.RegisterSyntaxNodeAction(
			AnalyzeVariableDeclaration,
			SyntaxKind.VariableDeclaration
		);

		context.RegisterSyntaxNodeAction(
			AnalyzeAssignmentExpression,
			SyntaxKind.SimpleAssignmentExpression
		);

		// Dictionary initializer entries: { key, value }
		context.RegisterSyntaxNodeAction(
			AnalyzeComplexElementInitializer,
			SyntaxKind.ComplexElementInitializerExpression
		);
	}

	private static void AnalyzeVariableDeclaration(
		SyntaxNodeAnalysisContext context
	)
	{
		VariableDeclarationSyntax declaration = (VariableDeclarationSyntax)
			context.Node;

		foreach (VariableDeclaratorSyntax declarator in declaration.Variables)
		{
			EqualsValueClauseSyntax? initializer = declarator.Initializer;

			if (initializer is null)
			{
				continue;
			}

			CheckContinuationIndent(
				context,
				initializer.EqualsToken,
				initializer.Value
			);
		}
	}

	private static void AnalyzeAssignmentExpression(
		SyntaxNodeAnalysisContext context
	)
	{
		AssignmentExpressionSyntax assignment = (AssignmentExpressionSyntax)
			context.Node;

		// Only check property assignments inside object initializers
		if (assignment.Parent is not InitializerExpressionSyntax)
		{
			return;
		}

		CheckContinuationIndent(
			context,
			assignment.OperatorToken,
			assignment.Right
		);
	}

	private static void AnalyzeComplexElementInitializer(
		SyntaxNodeAnalysisContext context
	)
	{
		InitializerExpressionSyntax initializer = (InitializerExpressionSyntax)
			context.Node;

		// Dictionary entries have format: { key, value }
		// We need at least 2 elements (key and value)
		SeparatedSyntaxList<ExpressionSyntax> expressions =
			initializer.Expressions;

		if (expressions.Count < 2)
		{
			return;
		}

		// Get the value expression (second element in dictionary entry)
		ExpressionSyntax valueExpression = expressions[1];

		// Find the comma token between key and value
		SyntaxToken commaToken = expressions.GetSeparator(0);

		// Check if value starts on a new line after comma
		if (!HasNewlineAfterToken(commaToken))
		{
			return; // Value is on same line as key, no indent check needed
		}

		// Get the indentation of the value expression
		string valueIndent = GetLeadingWhitespace(valueExpression);

		// Get the expected indentation (same as the key for dictionary entries)
		ExpressionSyntax keyExpression = expressions[0];
		string keyIndent = GetLeadingWhitespace(keyExpression);
		string expectedIndent = keyIndent;

		// Check if indentation is correct
		if (valueIndent != expectedIndent)
		{
			context.ReportDiagnostic(
				Diagnostic.Create(
					Rule,
					valueExpression.GetLocation(),
					ImmutableDictionary<string, string?>.Empty.Add(
						"ExpectedIndent",
						expectedIndent
					)
				)
			);
		}
	}

	private static void CheckContinuationIndent(
		SyntaxNodeAnalysisContext context,
		SyntaxToken equalsToken,
		ExpressionSyntax valueExpression
	)
	{
		// Check if there's a newline after the equals token
		if (!HasNewlineAfterToken(equalsToken))
		{
			return; // SS001 handles this case
		}

		// Get the indentation of the value expression
		string valueIndent = GetLeadingWhitespace(valueExpression);

		// Get the expected indentation (statement indent + one tab)
		string statementIndent = GetStatementIndentation(equalsToken);
		string expectedIndent = statementIndent + "\t";

		// Check if indentation is correct
		if (valueIndent != expectedIndent)
		{
			context.ReportDiagnostic(
				Diagnostic.Create(
					Rule,
					valueExpression.GetLocation(),
					ImmutableDictionary<string, string?>.Empty.Add(
						"ExpectedIndent",
						expectedIndent
					)
				)
			);
		}
	}

	private static bool HasNewlineAfterToken(SyntaxToken token)
	{
		foreach (SyntaxTrivia trivia in token.TrailingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.EndOfLineTrivia)
			{
				return true;
			}
		}

		return false;
	}

	private static string GetLeadingWhitespace(SyntaxNode node)
	{
		SyntaxToken firstToken = node.GetFirstToken();

		foreach (SyntaxTrivia trivia in firstToken.LeadingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
			{
				return trivia.ToString();
			}
		}

		return string.Empty;
	}

	private static string GetStatementIndentation(SyntaxToken token)
	{
		SyntaxNode? node = token.Parent;

		// For property assignments in object initializers, use the property's indent
		if (
			node is AssignmentExpressionSyntax assignment
			&& assignment.Parent is InitializerExpressionSyntax
		)
		{
			// Get the indentation of the property name (left side of assignment)
			string propertyIndent = GetLeadingWhitespaceFromToken(
				assignment.Left.GetFirstToken()
			);

			if (!string.IsNullOrEmpty(propertyIndent))
			{
				return propertyIndent;
			}
		}

		// For variable declarations, walk up to find containing statement
		while (node is not null)
		{
			if (node is StatementSyntax or MemberDeclarationSyntax)
			{
				break;
			}

			node = node.Parent;
		}

		if (node is not null)
		{
			foreach (SyntaxTrivia trivia in node.GetLeadingTrivia().Reverse())
			{
				if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
				{
					return trivia.ToString();
				}
			}
		}

		return "\t\t";
	}

	private static string GetLeadingWhitespaceFromToken(SyntaxToken token)
	{
		foreach (SyntaxTrivia trivia in token.LeadingTrivia)
		{
			if (trivia.RawKind == (int)SyntaxKind.WhitespaceTrivia)
			{
				return trivia.ToString();
			}
		}

		return string.Empty;
	}
}