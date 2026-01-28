// <copyright file="AssignmentContinuationIndentCodeFixProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Composition;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CodeActions;
using Microsoft.CodeAnalysis.CodeFixes;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using SeventySix.Analyzers;
using SeventySix.Analyzers.CodeFixes.Helpers;
using SeventySix.Analyzers.Helpers;

namespace SeventySix.Analyzers.CodeFixes;

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
		ImmutableArray.Create(AssignmentContinuationIndentAnalyzer.DiagnosticId);

	/// <inheritdoc/>
	public sealed override FixAllProvider GetFixAllProvider() =>
		WellKnownFixAllProviders.BatchFixer;

	/// <inheritdoc/>
	public sealed override async Task RegisterCodeFixesAsync(
		CodeFixContext context)
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
				title: CodeFixTitles.FixContinuationIndent,
				createChangedDocument: ct => FixContinuationIndentAsync(
					context.Document,
					valueToken,
					ct),
				equivalenceKey: nameof(AssignmentContinuationIndentCodeFixProvider)),
			diagnostic);
	}

	private static async Task<Document> FixContinuationIndentAsync(
		Document document,
		SyntaxToken valueToken,
		CancellationToken cancellationToken)
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
		List<SyntaxTrivia> newLeadingTrivia = new();

		// Keep non-whitespace trivia (like comments)
		foreach (SyntaxTrivia trivia in valueToken.LeadingTrivia)
		{
			if (
				trivia.RawKind
				is not ((int)SyntaxKind.WhitespaceTrivia)
					and not ((int)SyntaxKind.EndOfLineTrivia))
			{
				newLeadingTrivia.Add(trivia);
			}
		}

		// Add correct whitespace
		newLeadingTrivia.Add(SyntaxFactory.Whitespace(expectedIndent));

		SyntaxToken newValueToken = valueToken.WithLeadingTrivia(
			SyntaxFactory.TriviaList(newLeadingTrivia));

		SyntaxNode newRoot = root.ReplaceToken(valueToken, newValueToken);

		return document.WithSyntaxRoot(newRoot);
	}

	/// <summary>
	/// Calculates expected indent by finding the base indent and adding one tab.
	/// </summary>
	private static string CalculateExpectedIndent(SyntaxToken valueToken)
	{
		SyntaxNode? node = valueToken.Parent;

		// Handle closing brace of initializer
		if (
			valueToken.IsKind(SyntaxKind.CloseBraceToken)
			&& node is InitializerExpressionSyntax initializerForClose)
		{
			// Closing brace should match the 'new' keyword indent
			SyntaxNode? creationParent = initializerForClose.Parent;

			if (
				creationParent
				is ImplicitObjectCreationExpressionSyntax implicitForClose)
			{
				return SyntaxHelpers.GetLeadingWhitespace(implicitForClose.NewKeyword);
			}

			if (creationParent is ObjectCreationExpressionSyntax objectForClose)
			{
				return SyntaxHelpers.GetLeadingWhitespace(objectForClose.NewKeyword);
			}
		}

		// Handle initializer open brace after object/collection creation
		// Pattern: new() { ... } or new Type() { ... } where { is on separate line
		if (
			valueToken.IsKind(SyntaxKind.OpenBraceToken)
			&& node is InitializerExpressionSyntax initializerForBrace)
		{
			SyntaxNode? creationParent = initializerForBrace.Parent;

			if (
				creationParent
				is ImplicitObjectCreationExpressionSyntax implicitCreation)
			{
				// Brace should match 'new' keyword indent
				return SyntaxHelpers.GetLeadingWhitespace(implicitCreation.NewKeyword);
			}

			if (creationParent is ObjectCreationExpressionSyntax objectCreation)
			{
				// Brace should match 'new' keyword indent
				return SyntaxHelpers.GetLeadingWhitespace(objectCreation.NewKeyword);
			}

			// Pattern: Extensions = { ... } where { is direct value of assignment
			// The brace should be at property indent + 1 tab
			if (creationParent is AssignmentExpressionSyntax assignmentParent)
			{
				string propertyIndent = SyntaxHelpers.GetLeadingWhitespace(
					assignmentParent.Left.GetFirstToken());

				if (!string.IsNullOrEmpty(propertyIndent))
				{
					return propertyIndent + "\t";
				}
			}
		}

		// Handle collection initializer contents (elements inside { })
		// The token's parent could be an expression inside an InitializerExpression
		SyntaxNode? parentInitializer = node?.Parent;

		if (
			parentInitializer
				is InitializerExpressionSyntax containerInitializer
			&& (
				containerInitializer.IsKind(
					SyntaxKind.CollectionInitializerExpression)
				|| containerInitializer.IsKind(
					SyntaxKind.ObjectInitializerExpression)))
		{
			// Need to find the object creation to get the 'new' keyword indent
			// because the brace indent might not be correct yet
			SyntaxNode? creationNode = containerInitializer.Parent;

			if (
				creationNode
				is ImplicitObjectCreationExpressionSyntax implicitContent)
			{
				// Contents should be new keyword indent + 1 tab
				return SyntaxHelpers.GetLeadingWhitespace(implicitContent.NewKeyword) + "\t";
			}

			if (creationNode is ObjectCreationExpressionSyntax objectContent)
			{
				// Contents should be new keyword indent + 1 tab
				return SyntaxHelpers.GetLeadingWhitespace(objectContent.NewKeyword) + "\t";
			}
		}

		// Walk up to find the assignment expression or initializer expression
		while (
			node
				is not null
					and not AssignmentExpressionSyntax
					and not InitializerExpressionSyntax)
		{
			node = node.Parent;
		}

		// For dictionary entries: { key, value }
		if (
			node is InitializerExpressionSyntax initializer
			&& initializer.IsKind(
				SyntaxKind.ComplexElementInitializerExpression)
			&& initializer.Expressions.Count >= 2)
		{
			// Get the indentation of the key (first element)
			// Value should be at SAME level as key in dictionary entries
			string keyIndent = SyntaxHelpers.GetLeadingWhitespace(
				initializer.Expressions[0].GetFirstToken());

			if (!string.IsNullOrEmpty(keyIndent))
			{
				return keyIndent;
			}
		}

		// For property assignments in object initializers
		if (
			node is AssignmentExpressionSyntax assignment
			&& assignment.Parent is InitializerExpressionSyntax)
		{
			// Get the indentation of the property name (left side)
			string propertyIndent = SyntaxHelpers.GetLeadingWhitespace(
				assignment.Left.GetFirstToken());

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
					string statementIndent = SyntaxHelpers.GetLeadingWhitespace(
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
		string currentIndent = SyntaxHelpers.GetLeadingWhitespace(valueToken);

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
				|| current.IsKind(SyntaxKind.EqualsGreaterThanToken))
			{
				return current;
			}

			// Don't go past statement boundaries
			if (
				current.IsKind(SyntaxKind.SemicolonToken)
				|| current.IsKind(SyntaxKind.OpenBraceToken))
			{
				break;
			}

			current = current.GetPreviousToken();
		}

		return default;
	}
}