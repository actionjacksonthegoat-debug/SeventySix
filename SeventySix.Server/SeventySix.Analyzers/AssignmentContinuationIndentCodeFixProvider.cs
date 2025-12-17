// <copyright file="AssignmentContinuationIndentCodeFixProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Immutable;
using System.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace SeventySix.Analyzers;

/// <summary>
/// Code fix provider that corrects indentation on continuation lines after '='.
/// Calculates expected indent independently for reliable batch fixing.
/// </summary>
[ExportCodeFixProvider(
	LanguageNames.CSharp,
	Name = nameof(AssignmentContinuationIndentCodeFixProvider)
)]
[Shared]
public sealed class AssignmentContinuationIndentCodeFixProvider
	: CodeFixProvider
{
	/// <inheritdoc/>
	public sealed override ImmutableArray<string> FixableDiagnosticIds { get; } =
		ImmutableArray.Create(
			AssignmentContinuationIndentAnalyzer.DiagnosticId
		);

	/// <inheritdoc/>
	public sealed override FixAllProvider GetFixAllProvider() =>
		WellKnownFixAllProviders.BatchFixer;

	/// <inheritdoc/>
	public sealed override async Task RegisterCodeFixesAsync(
		CodeFixContext context
	)
	{
		SyntaxNode? root = await context
			.Document.GetSyntaxRootAsync(context.CancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return;
		}

		Diagnostic diagnostic = context.Diagnostics[0];
		TextSpan diagnosticSpan = diagnostic.Location.SourceSpan;
		SyntaxToken valueToken = root.FindToken(diagnosticSpan.Start);

		context.RegisterCodeFix(
			CodeAction.Create(
				title: "Fix continuation indent",
				createChangedDocument: ct =>
					FixContinuationIndentAsync(
						context.Document,
						valueToken,
						ct
					),
				equivalenceKey: nameof(
					AssignmentContinuationIndentCodeFixProvider
				)
			),
			diagnostic
		);
	}

	private static async Task<Document> FixContinuationIndentAsync(
		Document document,
		SyntaxToken valueToken,
		CancellationToken cancellationToken
	)
	{
		SyntaxNode? root = await document
			.GetSyntaxRootAsync(cancellationToken)
			.ConfigureAwait(false);

		if (root is null)
		{
			return document;
		}

		// Calculate expected indent from the syntax tree
		string expectedIndent = CalculateExpectedIndent(valueToken);

		// Build new leading trivia with correct indentation
		List<SyntaxTrivia> newLeadingTrivia = [];

		// Keep non-whitespace trivia (like comments)
		foreach (SyntaxTrivia trivia in valueToken.LeadingTrivia)
		{
			if (
				trivia.RawKind
				is not ((int)SyntaxKind.WhitespaceTrivia)
					and not ((int)SyntaxKind.EndOfLineTrivia)
			)
			{
				newLeadingTrivia.Add(trivia);
			}
		}

		// Add correct whitespace
		newLeadingTrivia.Add(SyntaxFactory.Whitespace(expectedIndent));

		SyntaxToken newValueToken = valueToken.WithLeadingTrivia(
			SyntaxFactory.TriviaList(newLeadingTrivia)
		);

		SyntaxNode newRoot = root.ReplaceToken(valueToken, newValueToken);

		return document.WithSyntaxRoot(newRoot);
	}

	/// <summary>
	/// Calculates expected indent by finding the base indent and adding one tab.
	/// </summary>
	private static string CalculateExpectedIndent(SyntaxToken valueToken)
	{
		SyntaxNode? node = valueToken.Parent;

		// Walk up to find the assignment expression or initializer expression
		while (
			node
				is not null
					and not AssignmentExpressionSyntax
					and not InitializerExpressionSyntax
		)
		{
			node = node.Parent;
		}

		// For dictionary entries: { key, value }
		if (
			node is InitializerExpressionSyntax initializer
			&& initializer.IsKind(
				SyntaxKind.ComplexElementInitializerExpression
			)
			&& initializer.Expressions.Count >= 2
		)
		{
			// Get the indentation of the key (first element)
			// Value should be at SAME level as key in dictionary entries
			string keyIndent = GetLeadingWhitespace(
				initializer.Expressions[0].GetFirstToken()
			);

			if (!string.IsNullOrEmpty(keyIndent))
			{
				return keyIndent;
			}
		}

		// For property assignments in object initializers
		if (
			node is AssignmentExpressionSyntax assignment
			&& assignment.Parent is InitializerExpressionSyntax
		)
		{
			// Get the indentation of the property name (left side)
			string propertyIndent = GetLeadingWhitespace(
				assignment.Left.GetFirstToken()
			);

			if (!string.IsNullOrEmpty(propertyIndent))
			{
				return propertyIndent + "\t";
			}
		}

		// For variable declarations, find the equals token and walk up
		SyntaxToken equalsToken = FindEqualsToken(valueToken);

		if (equalsToken != default)
		{
			node = equalsToken.Parent;

			while (node is not null)
			{
				if (node is StatementSyntax or MemberDeclarationSyntax)
				{
					string statementIndent = GetLeadingWhitespace(
						node.GetFirstToken()
					);

					if (!string.IsNullOrEmpty(statementIndent))
					{
						return statementIndent + "\t";
					}

					break;
				}

				node = node.Parent;
			}
		}

		// Fallback: count existing indent and add one tab
		string currentIndent = GetLeadingWhitespace(valueToken);

		if (!string.IsNullOrEmpty(currentIndent))
		{
			// Current indent is wrong, try to determine correct one
			// by looking at surrounding context
			return currentIndent + "\t";
		}

		return "\t\t\t"; // Safe default for nested code
	}

	private static SyntaxToken FindEqualsToken(SyntaxToken valueToken)
	{
		SyntaxToken current = valueToken.GetPreviousToken();

		while (current != default)
		{
			if (
				current.IsKind(SyntaxKind.EqualsToken)
				|| current.IsKind(SyntaxKind.EqualsGreaterThanToken)
			)
			{
				return current;
			}

			// Don't go past statement boundaries
			if (
				current.IsKind(SyntaxKind.SemicolonToken)
				|| current.IsKind(SyntaxKind.OpenBraceToken)
			)
			{
				break;
			}

			current = current.GetPreviousToken();
		}

		return default;
	}

	private static string GetLeadingWhitespace(SyntaxToken token)
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